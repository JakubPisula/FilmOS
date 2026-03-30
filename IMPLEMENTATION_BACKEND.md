# IMPLEMENTATION_BACKEND.md
# Instrukcje implementacji backendu dla Gemini CLI — FilmOS

> **Kontekst dla Gemini CLI:** Pracujesz w repozytorium Next.js 15 (App Router) z Prisma 5.21.1 na PostgreSQL.
> Przeczytaj plik `node_modules/next/dist/docs/` przed pisaniem kodu (wymóg z `AGENTS.md`).
> Uwierzytelnianie obsługuje NextAuth v5 (`next-auth@^5.0.0-beta.25`) z adapterem `@auth/prisma-adapter`.
> Walidacja danych: wyłącznie `zod@^4.3.6`. Nie instaluj `joi` ani `yup`.

---

## BLOK 0 — Inspekcja wstępna (wykonaj ZAWSZE jako pierwszy krok)

**0.1** Uruchom `cat prisma/schema.prisma` i zanotuj wszystkie istniejące modele, ich pola i relacje.
Zidentyfikuj model `User` (wymagany przez NextAuth), `Account`, `Session`, `VerificationToken`.

**0.2** Uruchom `ls src/app/api/` i zanotuj istniejące route handlery. NIE nadpisuj żadnego istniejącego pliku — rozszerzaj.

**0.3** Sprawdź `src/lib/prisma.ts` lub `src/lib/db.ts`. Jeśli istnieje singleton Prisma Client, używaj go we wszystkich nowych plikach. Jeśli nie istnieje, utwórz `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
declare global { var prisma: PrismaClient | undefined }
const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
export default prisma
```

---

## BLOK 1 — Rozszerzenie `prisma/schema.prisma` o WorkLog i TaskStatus

> Wykonaj kroki 1.1–1.5 jako **jeden spójny blok edycji** pliku `schema.prisma`, następnie uruchom migrację.

**1.1** Dodaj enum `TaskStatus` (jeśli nie istnieje w pliku):
```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  CANCELLED
}
```

**1.2** Dodaj enum `WorkLogSource`:
```prisma
enum WorkLogSource {
  MANUAL       // wpis z dashboardu web
  PREMIERE_CEP // wpis z wtyczki Adobe Premiere Pro
  API          // wpis z zewnętrznego API (np. Zapier)
}
```

**1.3** Sprawdź, czy model `Task` już istnieje w schema.prisma (krok 0.1). Jeśli NIE — utwórz go:
```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?
  order       Int        @default(0)
  notionId    String?    @unique  // ID rekordu w Notion SSOT
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignedTo  String?
  user        User?      @relation(fields: [assignedTo], references: [id])
  workLogs    WorkLog[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

**1.4** Sprawdź, czy model `Project` istnieje. Jeśli NIE — utwórz go przed modelem `Task`:
```prisma
model Project {
  id           String   @id @default(cuid())
  name         String
  clientName   String?
  notionId     String?  @unique
  driveFolderId String?
  frameIoProjectId String?
  status       TaskStatus @default(TODO)
  ownerId      String
  owner        User     @relation(fields: [ownerId], references: [id])
  tasks        Task[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**1.5** Dodaj model `WorkLog` (centralny model do time trackingu):
```prisma
model WorkLog {
  id          String        @id @default(cuid())
  taskId      String
  task        Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  source      WorkLogSource @default(MANUAL)
  startedAt   DateTime
  endedAt     DateTime?     // null = timer w toku (aktywna sesja)
  durationSec Int?          // obliczane przez trigger lub API; null gdy endedAt jest null
  note        String?
  premiereSeq String?       // opcjonalny: timecode z Premiere (format "HH:MM:SS:FF")
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([taskId])
  @@index([userId])
  @@index([startedAt])
}
```

**1.6** Dodaj relacje do istniejącego modelu `User` (NIE usuwaj istniejących pól — TYLKO dopisz):
```prisma
// Dopisz do modelu User:
projects  Project[]
tasks     Task[]
workLogs  WorkLog[]
```

**1.7** Wykonaj migrację:
```bash
npx prisma migrate dev --name "add_worklog_and_task_status"
npx prisma generate
```

Jeśli migracja się nie powiedzie, uruchom `npx prisma db push` jako fallback i zapisz błąd do pliku `migration_error.log`.

---

## BLOK 2 — API Route: Zarządzanie zadaniami (CRUD + zmiana statusu)

**2.1** Utwórz plik `src/app/api/tasks/route.ts` — obsługa GET (lista zadań) i POST (nowe zadanie):

- `GET /api/tasks?projectId=<id>` → zwróć `prisma.task.findMany({ where: { projectId }, include: { workLogs: true }, orderBy: { order: 'asc' } })`
- `POST /api/tasks` → body: `{ title, description?, projectId, dueDate?, assignedTo? }` — walidacja przez `zod`, utwórz rekord, zwróć `201`
- Zabezpieczenie: wywołaj `auth()` z `next-auth` — jeśli `!session`, zwróć `401`

**2.2** Utwórz plik `src/app/api/tasks/[taskId]/route.ts` — obsługa PATCH i DELETE:

- `PATCH /api/tasks/[taskId]` → przyjmuje dowolne pola modelu `Task` (w tym `status: TaskStatus`) — walidacja przez `zod.partial()`, wykonaj `prisma.task.update`
- `DELETE /api/tasks/[taskId]` → tylko dla roli `ADMIN` (sprawdź `session.user.role`)
- Po każdej zmianie `status` wywołaj helper `syncNotionStatus(taskId, newStatus)` (patrz BLOK 5)

**2.3** Schema zod dla Task w `src/lib/validations/task.ts`:
```typescript
import { z } from 'zod'
import { TaskStatus } from '@prisma/client'

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  projectId: z.string().cuid(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().cuid().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
  order: z.number().int().min(0).optional(),
})
```

---

## BLOK 3 — API Route: WorkLog (rejestracja czasu pracy)

**3.1** Utwórz `src/app/api/worklogs/route.ts` — POST (start timera lub wpis manualny):

- `POST /api/worklogs` → body: `{ taskId, startedAt, endedAt?, note?, source?, premiereSeq? }`
- Jeśli `endedAt` jest podane, oblicz `durationSec = differenceInSeconds(endedAt, startedAt)` używając `date-fns` (zainstaluj: `npm install date-fns`)
- Jeśli `endedAt` brak → zapisz rekord z `endedAt: null` (aktywna sesja timera)
- Sprawdź kolizję: `prisma.workLog.findFirst({ where: { userId, endedAt: null } })` — jeśli istnieje aktywna sesja, zwróć `409 Conflict` z body `{ error: "active_timer_exists", activeLogId: "..." }`
- Zwróć `201` z nowym `WorkLog`

**3.2** Utwórz `src/app/api/worklogs/[logId]/stop/route.ts` — POST (zatrzymanie timera):

- `POST /api/worklogs/[logId]/stop` → body opcjonalnie `{ note?, premiereSeq? }`
- Pobierz log: `prisma.workLog.findUnique({ where: { id: logId } })` — jeśli `endedAt !== null`, zwróć `400`
- Oblicz `endedAt = new Date()`, `durationSec = differenceInSeconds(endedAt, log.startedAt)` (date-fns)
- Wykonaj `prisma.workLog.update` i zwróć zaktualizowany rekord

**3.3** Utwórz `src/app/api/worklogs/route.ts` — GET (historia dla zadania lub użytkownika):

- `GET /api/worklogs?taskId=<id>` → lista logów dla zadania
- `GET /api/worklogs?userId=<id>&from=<ISO>&to=<ISO>` → zestawienie w przedziale dat

**3.4** Schema zod w `src/lib/validations/worklog.ts`:
```typescript
import { z } from 'zod'
import { WorkLogSource } from '@prisma/client'

export const createWorkLogSchema = z.object({
  taskId: z.string().cuid(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
  source: z.nativeEnum(WorkLogSource).default('MANUAL'),
  premiereSeq: z.string().regex(/^\d{2}:\d{2}:\d{2}:\d{2}$/).optional(),
})
```

---

## BLOK 4 — API Route: Zewnętrzny endpoint dla wtyczki CEP (bez sesji przeglądarkowej)

> Wtyczka Adobe Premiere Pro nie może korzystać z sesji NextAuth (cookies). Potrzebuje osobnego tokenu.

**4.1** Dodaj model `ApiToken` do `schema.prisma`:
```prisma
model ApiToken {
  id        String   @id @default(cuid())
  token     String   @unique @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label     String   @default("Premiere Plugin")
  lastUsed  DateTime?
  createdAt DateTime @default(now())
}
```
Następnie: `npx prisma migrate dev --name "add_api_token"` i `npx prisma generate`.

**4.2** Utwórz `src/app/api/external/worklogs/route.ts` — endpoint dla wtyczki CEP:

- Uwierzytelnianie przez nagłówek `Authorization: Bearer <token>`
- Helper w `src/lib/auth-external.ts`:
  ```typescript
  export async function verifyApiToken(request: Request) {
    const header = request.headers.get('Authorization')
    if (!header?.startsWith('Bearer ')) return null
    const token = header.slice(7)
    const record = await prisma.apiToken.findUnique({
      where: { token },
      include: { user: true }
    })
    if (!record) return null
    await prisma.apiToken.update({ where: { id: record.id }, data: { lastUsed: new Date() } })
    return record.user
  }
  ```
- `POST /api/external/worklogs` → używa `createWorkLogSchema` z `source: 'PREMIERE_CEP'`
- Zwróć CORS headers: `Access-Control-Allow-Origin: *` (wtyczka CEP wywołuje z lokalnego kontekstu)

**4.3** Utwórz `src/app/api/external/worklogs/OPTIONS/route.ts` — obsługa preflight CORS:
```typescript
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

**4.4** Utwórz `src/app/api/external/tasks/route.ts`:
- `GET /api/external/tasks?projectId=<id>` → lista zadań dla projektu (wymagany token)
- Zwróć tylko pola: `id, title, status, dueDate` (minimalna odpowiedź dla wtyczki)

**4.5** Utwórz `src/app/api/tokens/route.ts` (wewnętrzne — dla panelu admina):
- `POST /api/tokens` → utwórz nowy `ApiToken` dla zalogowanego użytkownika, zwróć `{ token }` (jednorazowe wyświetlenie)
- `GET /api/tokens` → lista tokenów bez wartości tokenu (tylko `id`, `label`, `lastUsed`)
- `DELETE /api/tokens/[tokenId]` → usuń token

---

## BLOK 5 — Helper synchronizacji z Notion

**5.1** Utwórz `src/lib/notion-sync.ts`:

```typescript
import { Client } from '@notionhq/client'
import { TaskStatus } from '@prisma/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const STATUS_MAP: Record<TaskStatus, string> = {
  TODO: 'Do zrobienia',
  IN_PROGRESS: 'W trakcie',
  REVIEW: 'Recenzja',
  DONE: 'Gotowe',
  CANCELLED: 'Anulowane',
}

export async function syncNotionStatus(notionPageId: string, status: TaskStatus) {
  if (!notionPageId || !process.env.NOTION_TOKEN) return
  try {
    await notion.pages.update({
      page_id: notionPageId,
      properties: {
        Status: { status: { name: STATUS_MAP[status] } },
      },
    })
  } catch (err) {
    console.error('[notion-sync] Failed to sync status:', err)
    // NIE rzucaj wyjątku — brak Notion nie może blokować API
  }
}
```

**5.2** W `src/app/api/tasks/[taskId]/route.ts` (PATCH), po `prisma.task.update`, wywołaj:
```typescript
if (body.status && task.notionId) {
  await syncNotionStatus(task.notionId, body.status)
}
```

---

## BLOK 6 — Agregacja czasu pracy (endpoint raportowy)

**6.1** Utwórz `src/app/api/reports/time/route.ts`:

- `GET /api/reports/time?projectId=<id>&from=<ISO>&to=<ISO>`
- Zapytanie Prisma:
  ```typescript
  const logs = await prisma.workLog.findMany({
    where: {
      task: { projectId },
      startedAt: { gte: new Date(from), lte: new Date(to) },
      endedAt: { not: null },
    },
    include: { task: { select: { title: true } }, user: { select: { name: true } } },
  })
  ```
- Zgrupuj po `task.id` i zsumuj `durationSec`
- Zwróć: `{ totalSec, byTask: [{ taskId, taskTitle, totalSec, entries }] }`
- Użyj `date-fns/formatDuration` i `intervalToDuration` do formatowania odpowiedzi czytelnej dla ludzi

---

## BLOK 7 — Zmienne środowiskowe (dodaj do `.env.example`)

```env
# Istniejące (NIE modyfikuj)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Notion (może już być — sprawdź)
NOTION_TOKEN="secret_..."

# Nowe — wymagane przez BLOK 4
# Brak dodatkowych zmiennych — tokeny przechowywane w bazie
```

---

## BLOK 8 — Testy manualne (checklist dla Gemini CLI po implementacji)

Uruchom serwer deweloperski (`npm run dev`) i zweryfikuj każdy punkt:

- [ ] `POST /api/tasks` z poprawnym body → `201` + rekord w bazie
- [ ] `PATCH /api/tasks/[id]` z `{ status: "DONE" }` → `200` + log w konsoli `[notion-sync]`
- [ ] `POST /api/worklogs` bez `endedAt` → `201`, pole `endedAt: null`
- [ ] Drugi `POST /api/worklogs` dla tego samego usera bez `endedAt` → `409`
- [ ] `POST /api/worklogs/[id]/stop` → `200`, `durationSec` obliczone poprawnie
- [ ] `POST /api/external/worklogs` z nagłówkiem `Authorization: Bearer <token>` → `201`
- [ ] `POST /api/external/worklogs` z błędnym tokenem → `401`
- [ ] `GET /api/reports/time?projectId=<id>&from=...&to=...` → obiekt z `totalSec`

---

## Kolejność wykonania bloków

```
0 → 1.1→1.7 (migracja) → 3 → 2 → 4.1 (migracja) → 4.2→4.5 → 5 → 6 → 7 → 8
```

Każdy blok jest atomowy — można wykonać go w jednej sesji Gemini CLI bez zależności od kolejnych bloków (z wyjątkiem migracji w 1.7 i 4.1, które muszą poprzedzać bloki 2–6).
