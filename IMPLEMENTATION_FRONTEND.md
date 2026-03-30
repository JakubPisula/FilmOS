# IMPLEMENTATION_FRONTEND.md
# Instrukcje implementacji frontendu dla Gemini CLI — FilmOS

> **Kontekst dla Gemini CLI:** Pracujesz w Next.js 15 (App Router) z React 19, Tailwind CSS v4,
> `shadcn/ui`, `lucide-react@^1.7.0` i `@base-ui/react@^1.3.0`.
> Komponenty serwera (`RSC`) są domyślne — `"use client"` dodawaj TYLKO tam, gdzie niezbędna interaktywność.
> Przeczytaj `node_modules/next/dist/docs/` przed pisaniem kodu (wymóg z `AGENTS.md`).
> Style: używaj klas Tailwind — NIE pisz inline CSS ani oddzielnych plików `.module.css`.

---

## BLOK A — Inspekcja wstępna struktury /src

**A.1** Uruchom `find src -type f -name "*.tsx" | sort` i zanotuj istniejące pliki.
Szczególnie szukaj: `src/app/(admin)/`, `src/app/(client)/`, `src/components/`, `src/app/layout.tsx`.

**A.2** Sprawdź `src/app/layout.tsx` — nie modyfikuj providers ani globalnego layoutu bez uzasadnienia.

**A.3** Sprawdź, czy istnieje `src/components/ui/` (shadcn). Jeśli nie, nie twórz komponentów shadcn ręcznie
— zainicjalizuj je poleceniem `npx shadcn@latest add <component>`.

---

## BLOK B — Routing i struktury grup tras (Route Groups)

> Projekt używa dwupanelowego layoutu: `(admin)` dla freelancera, `(client)` dla klienta.
> Jeśli grupy tras już istnieją, rozbudowuj je. Jeśli nie — utwórz poniższą strukturę.

**B.1** Utwórz (lub zweryfikuj) strukturę katalogów:
```
src/app/
├── (admin)/
│   ├── layout.tsx           ← sidebar + topbar dla freelancera
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── page.tsx         ← lista projektów
│   │   └── [projectId]/
│   │       ├── page.tsx     ← widok projektu + tablica Kanban
│   │       └── tasks/
│   │           └── [taskId]/page.tsx  ← szczegół zadania + WorkLog
│   ├── worklogs/page.tsx    ← raport czasu pracy
│   └── settings/
│       └── tokens/page.tsx  ← zarządzanie tokenami API (dla wtyczki CEP)
├── (client)/
│   ├── layout.tsx           ← minimalistyczny layout dla klienta
│   └── dashboard/page.tsx   ← status zleceń klienta
└── api/                     ← (istniejące + nowe z IMPLEMENTATION_BACKEND.md)
```

**B.2** `src/app/(admin)/layout.tsx` — RSC z sidebar:
- Sidebar z linkami: Dashboard, Projekty, Czas pracy, Ustawienia
- Górny pasek z awatarem sesji (`session.user.name`, `session.user.email`)
- Pobierz sesję przez `auth()` z `next-auth` — jeśli brak sesji, `redirect('/login')`
- Użyj `lucide-react` dla ikon: `LayoutDashboard`, `FolderOpen`, `Clock`, `Settings`

**B.3** `src/app/(client)/layout.tsx` — RSC z minimalnym nagłówkiem:
- Logo FilmOS + email klienta + przycisk wylogowania
- Sprawdź sesję: `auth()` → brak = `redirect('/login')`

---

## BLOK C — Dashboard admina (`src/app/(admin)/dashboard/page.tsx`)

> To jest RSC. Dane pobieraj bezpośrednio przez Prisma (nie przez `fetch('/api/...')`).

**C.1** Pobierz dane statystyczne (import `prisma` z `src/lib/prisma.ts`):
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

**C.2** Renderuj 4 karty statystyk (`<StatCard>` — patrz BLOK D):
- `TODO` — liczba zadań do zrobienia
- `IN_PROGRESS` — w trakcie
- `REVIEW` — oczekują na recenzję
- `DONE` (dzisiaj) — ukończone dzisiaj

**C.3** Renderuj komponent `<ActiveTimerBanner>` (patrz BLOK D.3) — widoczny tylko gdy `activeTimer !== null`.

**C.4** Renderuj `<RecentWorkLogs logs={recentLogs} />` (patrz BLOK D.4).

---

## BLOK D — Komponenty wielokrotnego użytku (`src/components/`)

> Każdy komponent to osobny plik. Komponenty z `"use client"` zaznaczono explicite.

**D.1** `src/components/stat-card.tsx` — RSC:
```
Props: { label: string; value: number; icon: LucideIcon; color?: string }
```
- Karta z cieniem (`shadow-sm rounded-xl p-6 bg-card`)
- Ikona po lewej, wartość dużym fontem (`text-3xl font-bold`), etykieta poniżej

**D.2** `src/components/task-status-badge.tsx` — RSC:
```
Props: { status: TaskStatus }
```
- Mapuj `TaskStatus` na kolory Tailwind:
  - `TODO` → `bg-slate-100 text-slate-700`
  - `IN_PROGRESS` → `bg-blue-100 text-blue-700`
  - `REVIEW` → `bg-amber-100 text-amber-700`
  - `DONE` → `bg-green-100 text-green-700`
  - `CANCELLED` → `bg-red-100 text-red-700`
- Użyj `cn()` z `clsx` + `tailwind-merge` do łączenia klas

**D.3** `src/components/active-timer-banner.tsx` — `"use client"`:
```
Props: { logId: string; taskTitle: string; startedAt: Date }
```
- Wyświetlaj odliczanie (`HH:MM:SS`) używając `useEffect` + `setInterval` co sekundę
- Oblicz różnicę: `Date.now() - startedAt.getTime()` → przeliczeń na h/m/s
- Przycisk "Stop" → `fetch('/api/worklogs/[logId]/stop', { method: 'POST' })` → `router.refresh()`
- Styl: żółty banner na górze strony (`bg-amber-50 border-b border-amber-200`)

**D.4** `src/components/recent-work-logs.tsx` — RSC:
```
Props: { logs: Array<WorkLog & { task: { title: string } }> }
```
- Tabela z kolumnami: Zadanie, Start, Czas trwania, Źródło
- `durationSec` formatuj jako `Xh Ym` (własna funkcja `formatDuration(sec: number): string`)
- Źródło `PREMIERE_CEP` oznacz ikoną `Film` z `lucide-react`

**D.5** `src/components/task-kanban.tsx` — `"use client"`:
```
Props: { tasks: Task[]; projectId: string }
```
- 5 kolumn odpowiadających `TaskStatus` (TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED)
- Drag & drop: użyj natywnego HTML5 DnD API (`draggable`, `onDragOver`, `onDrop`) — NIE instaluj dodatkowej biblioteki
- `onDrop` → `fetch('/api/tasks/[taskId]', { method: 'PATCH', body: JSON.stringify({ status }) })` → `router.refresh()`
- Każda karta zadania: tytuł, `<TaskStatusBadge>`, `dueDate` (wyróżnij przeterminowane na czerwono), przycisk szybkiego startu timera

**D.6** `src/components/worklog-form.tsx` — `"use client"`:
```
Props: { taskId: string; onSuccess: () => void }
```
- Dwa tryby: **"Start timera"** (tylko `startedAt = now()`) oraz **"Wpis manualny"** (DateTimePicker dla `startedAt` i `endedAt`)
- Pole `note` (textarea, max 500 znaków)
- Walidacja po stronie klienta: `endedAt > startedAt` (jeśli oba podane)
- Submit → `fetch('/api/worklogs', { method: 'POST', ... })` → toast sukcesu/błędu
- Toast: użyj `@base-ui/react` Toast lub natywnego `alert()` jako fallback

**D.7** `src/components/api-token-manager.tsx` — `"use client"`:
```
Props: { initialTokens: Array<{ id: string; label: string; lastUsed: Date | null }> }
```
- Lista tokenów z datą ostatniego użycia i przyciskiem "Usuń"
- Przycisk "Wygeneruj nowy token" → `POST /api/tokens` → wyświetl token w modalu `<Dialog>` (shadcn) z przyciskiem kopiowania do schowka (`navigator.clipboard.writeText`)
- **Ważne:** po zamknięciu modalu token NIE jest ponownie wyświetlany — poinformuj użytkownika

---

## BLOK E — Widok projektu i Kanban (`src/app/(admin)/projects/[projectId]/page.tsx`)

> RSC. Pobierz dane projektu i zadania bezpośrednio przez Prisma.

**E.1** Pobierz dane:
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

**E.2** Renderuj:
- Nagłówek: nazwa projektu, status projektu (`<TaskStatusBadge>`), łącze do Google Drive (jeśli `project.driveFolderId`)
- Przycisk "Dodaj zadanie" → otwórz `<Sheet>` (shadcn) z formularzem zadania (Client Component)
- `<TaskKanban tasks={project.tasks} projectId={project.id} />`
- Panel boczny: sumaryczny czas pracy (`SUM(durationSec)` ze wszystkich WorkLog zadania) — formatuj jako `Xh Ym`

**E.3** Formularz nowego zadania (wewnątrz Sheet):
- Pola: `title` (wymagane), `description`, `dueDate` (input `datetime-local`), `assignedTo` (opcjonalne)
- Submit → `POST /api/tasks` → zamknij Sheet → `router.refresh()`

---

## BLOK F — Widok szczegółu zadania (`src/app/(admin)/projects/[projectId]/tasks/[taskId]/page.tsx`)

> RSC.

**F.1** Pobierz dane:
```typescript
const task = await prisma.task.findUnique({
  where: { id: params.taskId },
  include: {
    workLogs: {
      include: { user: { select: { name: true } } },
      orderBy: { startedAt: 'desc' }
    }
  }
})
```

**F.2** Renderuj:
- Tytuł zadania (edytowalny inline — `contentEditable` lub `<Input>` z auto-save po blur)
- `<TaskStatusBadge status={task.status} />` + `<select>` do zmiany statusu → `PATCH /api/tasks/[id]`
- Opis (`<Textarea>` z auto-save)
- Sekcja "Czas pracy":
  - Suma: `formatDuration(task.workLogs.reduce((sum, l) => sum + (l.durationSec ?? 0), 0))`
  - `<WorklogForm taskId={task.id} />`
  - Tabela WorkLog z kolumnami: Data, Czas trwania, Notatka, Źródło, Usuń
- Link "Powrót do projektu"

---

## BLOK G — Strona raportów czasu (`src/app/(admin)/worklogs/page.tsx`)

> RSC z filtrowaniem przez `searchParams`.

**G.1** Parametry URL: `?projectId=&from=&to=` (domyślnie: bieżący tydzień)

**G.2** Pobierz dane przez `fetch('/api/reports/time?...')` (lub bezpośrednio Prisma — wybierz konsekwentnie jedno podejście w całym projekcie).

**G.3** Renderuj:
- Filtry (Client Component): DateRangePicker (`<input type="date">`), wybór projektu (`<select>`)
- Karta "Łączny czas": duży wynik w formacie `Xh Ym`
- Tabela rozbita po zadaniach: Zadanie | Czas | % całości | Wpisy
- Wykres słupkowy (opcjonalny): użyj natywnego SVG — NIE instaluj Recharts ani Chart.js

---

## BLOK H — Strona zarządzania tokenami (`src/app/(admin)/settings/tokens/page.tsx`)

> RSC + `<ApiTokenManager>` (Client Component z BLOK D.7).

**H.1** Pobierz tokeny: `prisma.apiToken.findMany({ where: { userId: session.user.id }, select: { id: true, label: true, lastUsed: true } })`

**H.2** Renderuj:
- Opis: "Wygeneruj token API dla wtyczki Adobe Premiere Pro. Token jest wyświetlany tylko raz."
- `<ApiTokenManager initialTokens={tokens} />`
- Link do instrukcji konfiguracji wtyczki (np. `PREMIERE_PLUGIN_SPEC.md` dołączony do projektu)

---

## BLOK I — Dashboard klienta (`src/app/(client)/dashboard/page.tsx`)

> RSC. Klient widzi TYLKO swoje projekty (filtrowane po `clientName` lub dedykowanej relacji).

**I.1** Pobierz projekty klienta (powiązane z emailem sesji — dostosuj do faktycznej relacji w schema):
```typescript
const projects = await prisma.project.findMany({
  where: { clientName: session.user.email },
  include: { tasks: { select: { status: true } } }
})
```

**I.2** Renderuj dla każdego projektu:
- Nazwa projektu
- Pasek postępu: `(done / total) * 100%` (natywny `<progress>` lub div z Tailwind)
- Status: `<TaskStatusBadge>`
- Link do Google Drive (`project.driveFolderId` → `https://drive.google.com/drive/folders/${id}`) jeśli dostępny
- Link do Frame.io jeśli `project.frameIoProjectId`

---

## BLOK J — Obsługa błędów i stany ładowania

**J.1** W każdym katalogu strony utwórz `error.tsx` (`"use client"`) z przyciskiem "Spróbuj ponownie" (`reset()`).

**J.2** W każdym katalogu strony utwórz `loading.tsx` z szkieletem (`animate-pulse` + `bg-muted rounded`).
Minimalny szkielet: 3 szare bloki o różnych szerokościach.

**J.3** `src/app/not-found.tsx` — strona 404 z przyciskiem powrotu do dashboardu.

---

## Kolejność wykonania bloków

```
A (inspekcja) → B (routing) → D (komponenty) → C (dashboard) → E (kanban) → F (szczegół) → G (raporty) → H (tokeny) → I (klient) → J (błędy)
```

Każdy blok jest niezależny po wykonaniu bloku B. Bloki D.3 i D.5 wymagają działającego backendu z BLOK 1–4 `IMPLEMENTATION_BACKEND.md`.
