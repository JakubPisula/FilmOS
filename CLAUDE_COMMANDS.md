# LISTA POLECEŃ CLAUDE CODE — FilmOS
# Wklejaj po kolei. Czekaj na zakończenie każdego kroku przed przejściem do następnego.

---

## KROK 1 — Inspekcja wstępna

```
Przeczytaj plik CLAUDE_PROMPT.md. Następnie wykonaj wyłącznie BLOK 0 (inspekcję wstępną): sprawdź czy istnieje `src/lib/prisma.ts` lub `src/lib/db.ts`. Jeśli singleton Prisma nie istnieje, utwórz go. Nie rób nic więcej — zatrzymaj się i pokaż mi wyniki inspekcji.
```

---

## KROK 2 — Schemat bazy danych + migracja

```
Wykonaj BLOK 1 z pliku CLAUDE_PROMPT.md: dodaj do prisma/schema.prisma enumy TaskStatus i WorkLogSource oraz modele Project, Task, WorkLog i ApiToken. Dopisz brakujące relacje do modelu User. Następnie uruchom migrację `npx prisma migrate dev --name "add_worklog_task_status_apitoken"` i `npx prisma generate`. Jeśli migracja się nie powiedzie, użyj `npx prisma db push` i zapisz błąd do migration_error.log.
```

---

## KROK 3 — Walidacje Zod

```
Wykonaj BLOK 2 z pliku CLAUDE_PROMPT.md: utwórz pliki src/lib/validations/task.ts i src/lib/validations/worklog.ts z schematami Zod.
```

---

## KROK 4 — API: Zadania (CRUD)

```
Wykonaj BLOK 3 z pliku CLAUDE_PROMPT.md: utwórz src/app/api/tasks/route.ts (GET i POST) oraz src/app/api/tasks/[taskId]/route.ts (PATCH i DELETE).
```

---

## KROK 5 — API: WorkLogi (time tracking)

```
Wykonaj BLOK 4 z pliku CLAUDE_PROMPT.md: utwórz src/app/api/worklogs/route.ts (POST z obsługą kolizji 409 i GET) oraz src/app/api/worklogs/[logId]/stop/route.ts (POST zatrzymania timera).
```

---

## KROK 6 — API: Zewnętrzny endpoint dla wtyczki CEP + tokeny

```
Wykonaj BLOK 5 z pliku CLAUDE_PROMPT.md: utwórz src/lib/auth-external.ts, src/app/api/external/worklogs/route.ts, src/app/api/external/worklogs/OPTIONS/route.ts, src/app/api/external/tasks/route.ts oraz src/app/api/tokens/route.ts i src/app/api/tokens/[tokenId]/route.ts.
```

---

## KROK 7 — Synchronizacja z Notion

```
Wykonaj BLOK 6 z pliku CLAUDE_PROMPT.md: zainstaluj `@notionhq/client`, utwórz src/lib/notion-sync.ts i zaktualizuj API zadań.
```

---

## KROK 8 — Endpoint raportowy

```
Wykonaj BLOK 7 z pliku CLAUDE_PROMPT.md: utwórz src/app/api/reports/time/route.ts z agregacją czasu pracy.
```

---

## KROK 9 — Test backendu i Frontend

```
Sprawdź kompilację `npm run dev`. Następnie wykonaj BLOKI A-J i P0-P6 zgodnie z kolejnością w CLAUDE_PROMPT.md.
```
