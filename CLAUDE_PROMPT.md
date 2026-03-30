# PROMPT DLA CLAUDE CODE — Implementacja FilmOS (Backend + Frontend + Wtyczka Premiere)

> Skopiuj poniższy prompt w całości do sesji Claude Code uruchomionej w katalogu głównym repozytorium FilmOS.

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

### BLOK 1 — Rozszerzenie schema.prisma

Dodaj do `prisma/schema.prisma` enumy `TaskStatus`, `WorkLogSource` oraz modele `Project`, `Task`, `WorkLog` i `ApiToken`. Zaktualizuj model `User`.

---

### BLOK 2 — Walidacje Zod

Utwórz `src/lib/validations/task.ts` i `src/lib/validations/worklog.ts`.

---

### BLOK 3 — API Route: Zadania

Utwórz endpointy w `src/app/api/tasks/`.

---

### BLOK 4 — API Route: WorkLogi

Utwórz endpointy w `src/app/api/worklogs/`.

---

### BLOK 5 — Zewnętrzne API i Auth

Utwórz `src/lib/auth-external.ts` i endpointy `external/`.

---

### BLOK 6 — Synchronizacja z Notion

Utwórz `src/lib/notion-sync.ts` i zintegruj z API zadań.

---

### BLOK 7 — Endpoint raportowy

Utwórz `src/app/api/reports/time/`.

---

## FAZA 2 — FRONTEND

### BLOK A-J — Implementacja UI

Implementuj routing, layouty, komponenty (shadcn), dashboardy i obsługę błędów zgodnie z architekturą Next.js 15.

---

## FAZA 3 — WTYCZKA ADOBE PREMIERE PRO (CEP)

### BLOK P0-P6 — Implementacja wtyczki

Implementuj strukturę, manifest, ExtendScript (ES3), UI (HTML/CSS) i logikę (JS/Axios) w katalogu `premiere-plugin/`.
