# PROMPT DLA GEMINI CLI — Implementacja FilmOS (Backend + Frontend + Wtyczka Premiere)

> Skopiuj poniższy prompt w całości do sesji Gemini CLI uruchomionej w katalogu głównym repozytorium FilmOS.

---

## KONTEKST I ZASADY NADRZĘDNE

Jesteś agentem implementującym aplikację **FilmOS** — narzędzie do zarządzania projektami wideo dla freelancerów. Pracujesz w repozytorium **Next.js 15 (App Router)** z **Prisma 5.21.1 na PostgreSQL**, **NextAuth v5**, **Tailwind CSS v4**, **shadcn/ui** i **lucide-react**.

**Zanim napiszesz JAKIKOLWIEK kod, obowiązkowo:**
1. Uruchom `cat prisma/schema.prisma` i zanotuj istniejące modele.
2. Uruchom `ls src/app/api/` i zanotuj istniejące route handlery.
3. Uruchom `find src -type f -name "*.tsx" | sort` i zanotuj istniejące komponenty.
4. Sprawdź `src/lib/prisma.ts` lub `src/lib/db.ts` pod kątem singletonu Prisma Client.

**Zasady, których NIGDY nie łamiesz:**
- NIE nadpisuj istniejących plików — zawsze rozszerzaj.
- NIE instaluj `joi`, `yup`, `recharts`, `chart.js` ani żadnej biblioteki DnD — walidacja tylko przez `zod@^4.3.6`, DnD przez natywne HTML5 API, wykresy przez natywne SVG.
- `"use client"` tylko tam, gdzie niezbędna interaktywność po stronie klienta.
- Style wyłącznie przez klasy Tailwind — bez inline CSS i plików `.module.css`.
- W ExtendScript (`host.jsx`) wyłącznie ES3 — bez `const`, `let`, `async/await`, arrow functions.

**Kolejność wykonania (respektuj ją ściśle):**

```
INSPEKCJA → BACKEND (0→1→3→2→4→5→6→7→8) → FRONTEND (A→B→D→C→E→F→G→H→I→J) → WTYCZKA (P0→P1→P2→P3→P4→P5→P6)
```

---

## FAZA 1 — BACKEND

### BLOK 0 — Inspekcja wstępna

Wykonaj inspekcję wstępną zgodnie z zasadami nadrzędnymi powyżej. Jeśli singleton Prisma Client nie istnieje, utwórz `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
declare global { var prisma: PrismaClient | undefined }
const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
export default prisma
```

---

### BLOK 1 — Rozszerzenie schema.prisma (wykonaj jako jeden spójny blok edycji)

Dodaj do `prisma/schema.prisma` następujące elementy (pomijaj te, które już istnieją):

**Enum `TaskStatus`:**
```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  CANCELLED
}
```

**Enum `WorkLogSource`:**
```prisma
enum WorkLogSource {
  MANUAL
  PREMIERE_CEP
  API
}
```

**Model `Project`** (utwórz przed `Task`, jeśli nie istnieje):
```prisma
model Project {
  id               String     @id @default(cuid())
  name             String
  clientName       String?
  notionId         String?    @unique
  driveFolderId    String?
  frameIoProjectId String?
  status           TaskStatus @default(TODO)
  ownerId          String
  owner            User       @relation(fields: [ownerId], references: [id])
  tasks            Task[]
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
}
```

**Model `Task`** (jeśli nie istnieje):
```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?
  order       Int        @default(0)
  notionId    String?    @unique
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignedTo  String?
  user        User?      @relation(fields: [assignedTo], references: [id])
  workLogs    WorkLog[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

**Model `WorkLog`:**
```prisma
model WorkLog {
  id          String        @id @default(cuid())
  taskId      String
  task        Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  source      WorkLogSource @default(MANUAL)
  startedAt   DateTime
  endedAt     DateTime?
  durationSec Int?
  note        String?
  premiereSeq String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([taskId])
  @@index([userId])
  @@index([startedAt])
}
```

**Model `ApiToken`:**
```prisma
model ApiToken {
  id        String    @id @default(cuid())
  token     String    @unique @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  label     String    @default("Premiere Plugin")
  lastUsed  DateTime?
  createdAt DateTime  @default(now())
}
```

**Dopisz do modelu `User`** (tylko brakujące relacje):
```prisma
projects  Project[]
tasks     Task[]
workLogs  WorkLog[]
apiTokens ApiToken[]
```

**Migracja** (uruchom po edycji schema):
```bash
npx prisma migrate dev --name "add_worklog_task_status_apitoken"
npx prisma generate
```
Jeśli migracja się nie powiedzie, uruchom `npx prisma db push` jako fallback i zapisz błąd do `migration_error.log`.

---

### BLOK 2 — Walidacje Zod

**`src/lib/validations/task.ts`:**
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

**`src/lib/validations/worklog.ts`:**
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

### BLOK 3 — API Route: Zadania

Zainstaluj `date-fns`: `npm install date-fns`

**`src/app/api/tasks/route.ts`** — GET (lista zadań) i POST (nowe zadanie):
- `GET /api/tasks?projectId=<id>` → `prisma.task.findMany({ where: { projectId }, include: { workLogs: true }, orderBy: { order: 'asc' } })`
- `POST /api/tasks` → walidacja `createTaskSchema`, utwórz rekord, zwróć `201`
- Zabezpieczenie: `auth()` z `next-auth` — brak sesji = `401`

**`src/app/api/tasks/[taskId]/route.ts`** — PATCH i DELETE:
- `PATCH /api/tasks/[taskId]` → walidacja `updateTaskSchema.partial()`, `prisma.task.update`; po zmianie `status` wywołaj `syncNotionStatus(task.notionId, body.status)` (patrz BLOK 5)
- `DELETE /api/tasks/[taskId]` → tylko dla `session.user.role === 'ADMIN'`

---

### BLOK 4 — API Route: WorkLogi

**`src/app/api/worklogs/route.ts`** — POST (start/wpis manualny) i GET (historia):
- `POST` → walidacja `createWorkLogSchema`; jeśli `endedAt` podane, oblicz `durationSec = differenceInSeconds(endedAt, startedAt)` z `date-fns`; jeśli brak `endedAt`, sprawdź kolizję aktywnego timera (`endedAt: null`) — zwróć `409 Conflict { error: "active_timer_exists", activeLogId: "..." }` jeśli istnieje; zwróć `201`
- `GET /api/worklogs?taskId=<id>` → lista dla zadania
- `GET /api/worklogs?userId=<id>&from=<ISO>&to=<ISO>` → zestawienie w przedziale dat

**`src/app/api/worklogs/[logId]/stop/route.ts`** — POST (zatrzymanie timera):
- Pobierz log; jeśli `endedAt !== null`, zwróć `400`
- Oblicz `endedAt = new Date()`, `durationSec = differenceInSeconds(endedAt, log.startedAt)`
- `prisma.workLog.update` i zwróć zaktualizowany rekord

---

### BLOK 5 — Zewnętrzne API dla wtyczki CEP

**`src/lib/auth-external.ts`** — helper weryfikacji tokenu Bearer:
```typescript
import prisma from './prisma'

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

**`src/app/api/external/worklogs/route.ts`**:
- Uwierzytelnianie przez `verifyApiToken`; brak = `401`
- `POST` → używa `createWorkLogSchema` z `source: 'PREMIERE_CEP'`
- CORS headers: `Access-Control-Allow-Origin: *`

**`src/app/api/external/worklogs/OPTIONS/route.ts`**:
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

**`src/app/api/external/tasks/route.ts`**:
- `GET /api/external/tasks?projectId=<id>` → wymagany token; zwróć tylko pola `id, title, status, dueDate`

**`src/app/api/tokens/route.ts`** (panel admina):
- `POST` → utwórz `ApiToken`, zwróć `{ token }` (jednorazowe wyświetlenie)
- `GET` → lista tokenów: `id, label, lastUsed` (bez wartości tokenu)

**`src/app/api/tokens/[tokenId]/route.ts`**:
- `DELETE` → usuń token

---

### BLOK 6 — Synchronizacja z Notion

**`src/lib/notion-sync.ts`**:
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
      properties: { Status: { status: { name: STATUS_MAP[status] } } },
    })
  } catch (err) {
    console.error('[notion-sync] Failed to sync status:', err)
    // NIE rzucaj wyjątku
  }
}
```

Zainstaluj: `npm install @notionhq/client`

---

### BLOK 7 — Endpoint raportowy

**`src/app/api/reports/time/route.ts`**:
- `GET /api/reports/time?projectId=<id>&from=<ISO>&to=<ISO>`
- Zapytanie Prisma z filtrowaniem po `task.projectId`, `startedAt`, `endedAt: { not: null }`
- Grupuj po `task.id`, sumuj `durationSec`
- Zwróć: `{ totalSec, byTask: [{ taskId, taskTitle, totalSec, entries }] }`
- Użyj `date-fns` `intervalToDuration` do formatowania czytelnego dla ludzi

---

### BLOK 8 — Zmienne środowiskowe

Dopisz do `.env.example` (NIE modyfikuj istniejących wpisów):
```env
NOTION_TOKEN="secret_..."
```

---

## FAZA 2 — FRONTEND

### BLOK A — Inspekcja (już wykonana w BLOK 0)

Zweryfikuj wyniki z BLOK 0 pod kątem struktury `src/app/` i `src/components/ui/` (shadcn).

---

### BLOK B — Routing i layouty

Utwórz (lub zweryfikuj) strukturę:
```
src/app/
├── (admin)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [projectId]/
│   │       ├── page.tsx
│   │       └── tasks/[taskId]/page.tsx
│   ├── worklogs/page.tsx
│   └── settings/tokens/page.tsx
├── (client)/
│   ├── layout.tsx
│   └── dashboard/page.tsx
```

**`src/app/(admin)/layout.tsx`** — RSC:
- Sidebar z linkami używając `lucide-react`: `LayoutDashboard`, `FolderOpen`, `Clock`, `Settings`
- Górny pasek z awatarem (`session.user.name`, `session.user.email`)
- `auth()` → brak sesji = `redirect('/login')`

**`src/app/(client)/layout.tsx`** — RSC:
- Logo FilmOS + email klienta + przycisk wylogowania
- `auth()` → brak sesji = `redirect('/login')`

---

### BLOK C — Komponenty wielokrotnego użytku

Zainstaluj zależności: `npm install clsx tailwind-merge`

**`src/components/stat-card.tsx`** — RSC:
- Props: `{ label: string; value: number; icon: LucideIcon; color?: string }`
- Karta: `shadow-sm rounded-xl p-6 bg-card`, ikona po lewej, wartość `text-3xl font-bold`

**`src/components/task-status-badge.tsx`** — RSC:
- Props: `{ status: TaskStatus }`
- Kolory przez `cn()`: TODO=slate, IN_PROGRESS=blue, REVIEW=amber, DONE=green, CANCELLED=red

**`src/components/active-timer-banner.tsx`** — `"use client"`:
- Props: `{ logId: string; taskTitle: string; startedAt: Date }`
- Odliczanie co sekundę: `useEffect` + `setInterval`
- Obliczenie: `Date.now() - startedAt.getTime()` → h/m/s
- Przycisk "Stop" → `fetch('/api/worklogs/[logId]/stop', { method: 'POST' })` → `router.refresh()`
- Styl: `bg-amber-50 border-b border-amber-200`

**`src/components/recent-work-logs.tsx`** — RSC:
- Props: `{ logs: Array<WorkLog & { task: { title: string } }> }`
- Tabela: Zadanie | Start | Czas trwania | Źródło
- `durationSec` → `formatDuration(sec: number): string` (własna funkcja zwracająca `Xh Ym`)
- Źródło `PREMIERE_CEP` → ikona `Film` z `lucide-react`

**`src/components/task-kanban.tsx`** — `"use client"`:
- Props: `{ tasks: Task[]; projectId: string }`
- 5 kolumn dla każdego `TaskStatus`
- Drag & drop przez natywne HTML5 API (`draggable`, `onDragOver`, `onDrop`) — BEZ zewnętrznych bibliotek
- `onDrop` → `PATCH /api/tasks/[taskId]` ze `{ status }` → `router.refresh()`
- Karta zadania: tytuł, `<TaskStatusBadge>`, `dueDate` (przeterminowane czerwone), przycisk startu timera

**`src/components/worklog-form.tsx`** — `"use client"`:
- Props: `{ taskId: string; onSuccess: () => void }`
- Dwa tryby: "Start timera" i "Wpis manualny" (DateTimePicker)
- Walidacja: `endedAt > startedAt`
- Submit → `POST /api/worklogs` → toast sukcesu/błędu przez `@base-ui/react` Toast lub `alert()` jako fallback

**`src/components/api-token-manager.tsx`** — `"use client"`:
- Props: `{ initialTokens: Array<{ id: string; label: string; lastUsed: Date | null }> }`
- Lista tokenów z przyciskami "Usuń"
- "Wygeneruj nowy token" → `POST /api/tokens` → `<Dialog>` (shadcn) z `navigator.clipboard.writeText`
- Informacja: token widoczny tylko raz

---

### BLOK D — Dashboard admina

**`src/app/(admin)/dashboard/page.tsx`** — RSC, dane przez Prisma bezpośrednio:
```typescript
const [taskCounts, activeTimer, recentLogs] = await Promise.all([
  prisma.task.groupBy({ by: ['status'], _count: true }),
  prisma.workLog.findFirst({
    where: { userId: session.user.id, endedAt: null },
    include: { task: { select: { title: true } } }
  }),
  prisma.workLog.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { task: { select: { title: true } } }
  })
])
```
Renderuj: 4x `<StatCard>`, `<ActiveTimerBanner>` (gdy `activeTimer !== null`), `<RecentWorkLogs>`

---

### BLOK E — Widok projektu + Kanban

**`src/app/(admin)/projects/[projectId]/page.tsx`** — RSC:
```typescript
const project = await prisma.project.findUnique({
  where: { id: params.projectId },
  include: {
    tasks: {
      include: { workLogs: { where: { endedAt: { not: null } } } },
      orderBy: { order: 'asc' }
    }
  }
})
if (!project) notFound()
```
Renderuj: nagłówek, link do Google Drive, `<Sheet>` (shadcn) z formularzem zadania, `<TaskKanban>`, panel z łącznym czasem pracy

---

### BLOK F — Szczegół zadania

**`src/app/(admin)/projects/[projectId]/tasks/[taskId]/page.tsx`** — RSC:
- Pobierz zadanie z worklogami i użytkownikami
- Tytuł edytowalny inline (auto-save po `blur`)
- `<TaskStatusBadge>` + `<select>` do zmiany statusu → `PATCH /api/tasks/[id]`
- Suma czasu: `task.workLogs.reduce((sum, l) => sum + (l.durationSec ?? 0), 0)`
- `<WorklogForm taskId={task.id} />`
- Tabela WorkLog: Data | Czas trwania | Notatka | Źródło | Usuń

---

### BLOK G — Raporty czasu

**`src/app/(admin)/worklogs/page.tsx`** — RSC z `searchParams`:
- Domyślny zakres: bieżący tydzień
- Filtry (Client Component): `<input type="date">` dla zakresu dat, `<select>` dla projektu
- Karta "Łączny czas": `Xh Ym`
- Tabela: Zadanie | Czas | % całości | Wpisy
- Wykres słupkowy przez natywne SVG (bez bibliotek)

---

### BLOK H — Zarządzanie tokenami

**`src/app/(admin)/settings/tokens/page.tsx`** — RSC:
- Pobierz tokeny: `prisma.apiToken.findMany({ where: { userId: session.user.id }, select: { id: true, label: true, lastUsed: true } })`
- Opis instrukcji + `<ApiTokenManager initialTokens={tokens} />`

---

### BLOK I — Dashboard klienta

**`src/app/(client)/dashboard/page.tsx`** — RSC:
```typescript
const projects = await prisma.project.findMany({
  where: { clientName: session.user.email },
  include: { tasks: { select: { status: true } } }
})
```
Renderuj dla każdego projektu: nazwa, pasek postępu `(done/total)*100%`, `<TaskStatusBadge>`, linki do Google Drive i Frame.io

---

### BLOK J — Obsługa błędów

W każdym katalogu strony utwórz:
- `error.tsx` (`"use client"`) z przyciskiem "Spróbuj ponownie" (`reset()`)
- `loading.tsx` z szkieletem `animate-pulse` (3 szare bloki)

**`src/app/not-found.tsx`** — strona 404 z przyciskiem powrotu do dashboardu

---

## FAZA 3 — WTYCZKA ADOBE PREMIERE PRO (CEP)

### BLOK P0 — Struktura katalogów

Utwórz `premiere-plugin/` w głównym katalogu repozytorium (obok `src/`, `prisma/`):

```
premiere-plugin/
├── CSXS/manifest.xml
├── jsx/host.jsx
├── index.html
├── js/
│   ├── CSInterface.js
│   ├── axios.min.js
│   └── main.js
├── css/style.css
└── .debug
```

Pobierz zależności:
```bash
curl -o premiere-plugin/js/axios.min.js \
  https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js
```
Dla `CSInterface.js` pobierz z: `https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_12.x/CSInterface.js`

---

### BLOK P1 — `CSXS/manifest.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ExtensionManifest Version="7.0"
                   ExtensionBundleId="com.filmos.premiere.plugin"
                   ExtensionBundleVersion="1.0.0"
                   ExtensionBundleName="FilmOS Time Tracker">
  <ExtensionList>
    <Extension Id="com.filmos.premiere.panel" Version="1.0.0"/>
  </ExtensionList>
  <ExecutionEnvironment>
    <HostList>
      <Host Name="PPRO" Version="[24.0,99.9]"/>
    </HostList>
    <LocaleList><Locale Code="All"/></LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="12.0"/>
    </RequiredRuntimeList>
  </ExecutionEnvironment>
  <DispatchInfoList>
    <Extension Id="com.filmos.premiere.panel">
      <DispatchInfo>
        <Resources>
          <MainPath>./index.html</MainPath>
          <ScriptPath>./jsx/host.jsx</ScriptPath>
        </Resources>
        <Lifecycle><AutoVisible>true</AutoVisible></Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>
            <Locale Code="en_US">FilmOS Time Tracker</Locale>
            <Locale Code="pl_PL">FilmOS Śledzenie czasu</Locale>
          </Menu>
          <Geometry>
            <Size><Height>600</Height><Width>320</Width></Size>
            <MinSize><Height>400</Height><Width>280</Width></MinSize>
          </Geometry>
          <Icons/>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>
</ExtensionManifest>
```

---

### BLOK P2 — `jsx/host.jsx` (ExtendScript — tylko ES3)

```javascript
// ExtendScript ES3 — NIE używaj const/let/async/arrow functions

function getCurrentTimecode() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "00:00:00:00";
    return seq.getPlayerPosition().toString();
  } catch (e) { return "00:00:00:00"; }
}

function getProjectName() {
  try { return app.project.name.replace(/\.prproj$/, ""); }
  catch (e) { return ""; }
}

function getSequenceName() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "";
    return seq.name;
  } catch (e) { return ""; }
}

function getProjectPath() {
  try { return app.project.path; }
  catch (e) { return ""; }
}

function getPremiereContext() {
  var context = {
    projectName: getProjectName(),
    sequenceName: getSequenceName(),
    timecode: getCurrentTimecode(),
    projectPath: getProjectPath()
  };
  return JSON.stringify(context);
}
```

---

### BLOK P3 — `index.html` (panel UI — 3 zakładki)

Panel musi zawierać:
1. **Zakładka Timer**: kontekst Premiere (projekt, sekwencja, timecode), select zadania FilmOS, pole notatki, wyświetlacz timera `00:00:00`, przyciski Start/Stop
2. **Zakładka Zadania**: select projektu FilmOS, lista zadań z przyciskami "Ustaw jako aktywne"
3. **Zakładka Ustawienia**: pole URL API, pole tokenu Bearer, przyciski "Zapisz" i "Test połączenia", feedback status

Implementuj jako pojedynczy plik HTML z `<link rel="stylesheet" href="css/style.css">` i skryptami ładowanymi na dole `<body>`:
```html
<script src="js/CSInterface.js"></script>
<script src="js/axios.min.js"></script>
<script src="js/main.js"></script>
```

---

### BLOK P4 — `js/main.js` (logika panelu)

Kluczowe wymagania:

**Stan aplikacji (localStorage):**
```javascript
const STORAGE_KEY_URL   = 'filmos_api_url';
const STORAGE_KEY_TOKEN = 'filmos_api_token';

const state = {
  apiUrl:      localStorage.getItem(STORAGE_KEY_URL)   || 'http://localhost:3000',
  apiToken:    localStorage.getItem(STORAGE_KEY_TOKEN) || '',
  activeLogId: null,
  timerStart:  null,
  timerInterval: null,
};
```

**Funkcja `apiClient()`** zwracająca instancję axios z `baseURL` i `Authorization: Bearer <token>`.

**`loadPremiereContext()`** — co 2 sekundy przez `CSInterface.evalScript('getPremiereContext()', callback)`:
- Parsuje JSON, aktualizuje `#premiere-project`, `#premiere-sequence`, `#premiere-timecode`

**`testConnection()`** — `GET /api/external/tasks?projectId=test`, status 200/401 = połączono, 404 = połączono, inne = błąd

**`loadTasks(projectId)`** — `GET /api/external/tasks?projectId=<id>`, wypełnij `<select id="task-select">` i listę zadań

**Start timera:**
- Jeśli brak wybranego zadania → błąd
- `POST /api/external/worklogs` z `{ taskId, startedAt: new Date().toISOString(), source: 'PREMIERE_CEP', premiereSeq: currentTimecode }`
- Jeśli 409 → komunikat "Aktywny timer już istnieje"
- Sukces → uruchom `setInterval` co sekundę, aktualizuj `#timer-display`

**Stop timera:**
- `POST /api/external/worklogs/<logId>/stop` z opcjonalną notatką
- Wyczyść interval, zresetuj wyświetlacz

**Ustawienia:** zapisuj do `localStorage`, `testConnection()` po kliknięciu "Test połączenia"

---

### BLOK P5 — `css/style.css` (ciemny motyw Adobe CC)

Kluczowe zmienne stylistyczne:
- Tło body: `#1c1c1c`, tekst: `#d4d4d4`
- Sidebar zakładek: `#252525`, aktywna zakładka: `border-bottom: 2px solid #0078d4`
- Inputy/selecty: `background: #333`, `border: 1px solid #444`
- Timer display: `font-size: 36px`, monospace, kolor `#e8a838`
- Przyciski: primary `#0078d4`, danger `#c62828`
- Feedback success: `background: #1b3a1b; color: #81c784`
- Feedback error: `background: #3a1b1b; color: #e57373`
- Status dot online: `#4caf50`, offline: `#666`

---

### BLOK P6 — Konfiguracja debugowania

**Utwórz `premiere-plugin/.debug`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
  <Extension Id="com.filmos.premiere.panel">
    <HostList>
      <Host Name="PPRO" Port="8099"/>
    </HostList>
  </Extension>
</ExtensionList>
```

**Dołącz do README lub utwórz `premiere-plugin/INSTALL.md`** z instrukcjami:

Windows (PowerShell jako Administrator):
```powershell
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
```
macOS:
```bash
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
ln -s "$(pwd)/premiere-plugin" "/Library/Application Support/Adobe/CEP/extensions/FilmOS_TimeTracker"
```
Debugowanie: Chrome DevTools → `http://localhost:8099`

---

## CHECKLIST KOŃCOWA

Po zakończeniu implementacji zweryfikuj każdy punkt:

**Backend:**
- [ ] `POST /api/tasks` → `201` + rekord w bazie
- [ ] `PATCH /api/tasks/[id]` z `{ status: "DONE" }` → `200` + log `[notion-sync]` w konsoli
- [ ] `POST /api/worklogs` bez `endedAt` → `201`, pole `endedAt: null`
- [ ] Drugi `POST /api/worklogs` dla tego samego usera → `409`
- [ ] `POST /api/worklogs/[id]/stop` → `200`, `durationSec` obliczone
- [ ] `POST /api/external/worklogs` z Bearer tokenem → `201`
- [ ] `POST /api/external/worklogs` z błędnym tokenem → `401`
- [ ] `GET /api/reports/time?projectId=...` → obiekt z `totalSec`

**Frontend:**
- [ ] Dashboard admina ładuje statystyki zadań
- [ ] `<ActiveTimerBanner>` pojawia się gdy timer aktywny
- [ ] Kanban poprawnie zmienia status przez DnD
- [ ] Formularz zadania tworzy rekord i odświeża widok
- [ ] Strona tokenów generuje i usuwa tokeny
- [ ] Dashboard klienta widzi tylko swoje projekty

**Wtyczka:**
- [ ] Panel otwiera się w Premiere Pro bez błędów
- [ ] Timecode odświeżany co 2 sekundy
- [ ] Ustawienia (URL + token) trwałe po restarcie panelu
- [ ] Test połączenia zwraca poprawny status
- [ ] Start timera bez zadania → błąd (bez wywołania API)
- [ ] Start + Stop zapisuje WorkLog z `source: PREMIERE_CEP` i `premiereSeq`
- [ ] Drugi start bez stopu → komunikat "aktywny timer"
