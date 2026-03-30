# LISTA POLECEŃ GEMINI CLI — FilmOS
# Wklejaj po kolei. Czekaj na zakończenie każdego kroku przed przejściem do następnego.

---

## KROK 1 — Inspekcja wstępna

```
Przeczytaj plik GEMINI_CLI_PROMPT.md. Następnie wykonaj wyłącznie BLOK 0 (inspekcję wstępną): uruchom `cat prisma/schema.prisma`, `ls src/app/api/`, `find src -type f -name "*.tsx" | sort` oraz sprawdź czy istnieje `src/lib/prisma.ts` lub `src/lib/db.ts`. Jeśli singleton Prisma nie istnieje, utwórz go. Nie rób nic więcej — zatrzymaj się i pokaż mi wyniki inspekcji.
```

---

## KROK 2 — Schemat bazy danych + migracja

```
Wykonaj BLOK 1 z pliku GEMINI_CLI_PROMPT.md: dodaj do prisma/schema.prisma enumy TaskStatus i WorkLogSource oraz modele Project, Task, WorkLog i ApiToken. Dopisz brakujące relacje do modelu User. Następnie uruchom migrację `npx prisma migrate dev --name "add_worklog_task_status_apitoken"` i `npx prisma generate`. Jeśli migracja się nie powiedzie, użyj `npx prisma db push` i zapisz błąd do migration_error.log. Zatrzymaj się po migracji i pokaż mi wynik.
```

---

## KROK 3 — Walidacje Zod

```
Wykonaj BLOK 2 z pliku GEMINI_CLI_PROMPT.md: utwórz pliki src/lib/validations/task.ts i src/lib/validations/worklog.ts z schematami Zod. Zainstaluj date-fns jeśli nie jest zainstalowany (`npm install date-fns`). Zatrzymaj się po utworzeniu plików.
```

---

## KROK 4 — API: Zadania (CRUD)

```
Wykonaj BLOK 3 z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/api/tasks/route.ts (GET i POST) oraz src/app/api/tasks/[taskId]/route.ts (PATCH i DELETE). Nie nadpisuj istniejących plików — rozszerzaj. Zatrzymaj się po implementacji.
```

---

## KROK 5 — API: WorkLogi (time tracking)

```
Wykonaj BLOK 4 z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/api/worklogs/route.ts (POST z obsługą kolizji 409 i GET) oraz src/app/api/worklogs/[logId]/stop/route.ts (POST zatrzymania timera). Zatrzymaj się po implementacji.
```

---

## KROK 6 — API: Zewnętrzny endpoint dla wtyczki CEP + tokeny

```
Wykonaj BLOK 5 z pliku GEMINI_CLI_PROMPT.md: utwórz src/lib/auth-external.ts, src/app/api/external/worklogs/route.ts, src/app/api/external/worklogs/OPTIONS/route.ts, src/app/api/external/tasks/route.ts oraz src/app/api/tokens/route.ts i src/app/api/tokens/[tokenId]/route.ts. Zatrzymaj się po implementacji.
```

---

## KROK 7 — Synchronizacja z Notion

```
Wykonaj BLOK 6 z pliku GEMINI_CLI_PROMPT.md: zainstaluj `npm install @notionhq/client`, utwórz src/lib/notion-sync.ts z funkcją syncNotionStatus. Następnie zaktualizuj src/app/api/tasks/[taskId]/route.ts aby wywoływał syncNotionStatus po zmianie statusu. Zatrzymaj się po implementacji.
```

---

## KROK 8 — Endpoint raportowy

```
Wykonaj BLOK 7 z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/api/reports/time/route.ts z agregacją czasu pracy pogrupowaną po zadaniach. Dopisz NOTION_TOKEN do .env.example. Zatrzymaj się po implementacji.
```

---

## KROK 9 — Test backendu

```
Uruchom serwer deweloperski `npm run dev` i sprawdź czy startuje bez błędów TypeScript i błędów kompilacji. Pokaż mi logi startowe. Nie przechodź do frontendu dopóki backend nie kompiluje się czysto.
```

---

## KROK 10 — Frontend: Routing i layouty

```
Wykonaj BLOK B z pliku GEMINI_CLI_PROMPT.md: utwórz strukturę katalogów dla grup tras (admin) i (client), utwórz src/app/(admin)/layout.tsx z sidebarem i src/app/(client)/layout.tsx z minimalnym nagłówkiem. Zatrzymaj się po implementacji.
```

---

## KROK 11 — Frontend: Komponenty wielokrotnego użytku

```
Wykonaj BLOK C z pliku GEMINI_CLI_PROMPT.md: zainstaluj `npm install clsx tailwind-merge` jeśli nie są zainstalowane. Utwórz wszystkie 6 komponentów: stat-card.tsx, task-status-badge.tsx, active-timer-banner.tsx, recent-work-logs.tsx, task-kanban.tsx, worklog-form.tsx oraz api-token-manager.tsx. Zatrzymaj się po implementacji.
```

---

## KROK 12 — Frontend: Dashboard admina

```
Wykonaj BLOK D z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/(admin)/dashboard/page.tsx jako RSC pobierający dane bezpośrednio przez Prisma. Renderuj StatCard, ActiveTimerBanner i RecentWorkLogs. Zatrzymaj się po implementacji.
```

---

## KROK 13 — Frontend: Widok projektu i Kanban

```
Wykonaj BLOK E z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/(admin)/projects/[projectId]/page.tsx z tablicą Kanban, formularzem dodawania zadania w Sheet oraz panelem czasu pracy. Zatrzymaj się po implementacji.
```

---

## KROK 14 — Frontend: Szczegół zadania

```
Wykonaj BLOK F z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/(admin)/projects/[projectId]/tasks/[taskId]/page.tsx z edytowalnym tytułem, zmianą statusu, WorklogForm i tabelą logów. Zatrzymaj się po implementacji.
```

---

## KROK 15 — Frontend: Raporty i tokeny

```
Wykonaj BLOK G i BLOK H z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/(admin)/worklogs/page.tsx z raportami czasu (filtry, tabela, wykres SVG) oraz src/app/(admin)/settings/tokens/page.tsx z ApiTokenManager. Zatrzymaj się po implementacji.
```

---

## KROK 16 — Frontend: Dashboard klienta i obsługa błędów

```
Wykonaj BLOK I i BLOK J z pliku GEMINI_CLI_PROMPT.md: utwórz src/app/(client)/dashboard/page.tsx z widokiem projektów klienta. Następnie w każdym katalogu stron utwórz error.tsx i loading.tsx oraz src/app/not-found.tsx. Zatrzymaj się po implementacji.
```

---

## KROK 17 — Wtyczka CEP: Struktura i pliki statyczne

```
Wykonaj BLOK P0 i BLOK P1 z pliku GEMINI_CLI_PROMPT.md: utwórz katalog premiere-plugin/ z pełną strukturą podkatalogów, pobierz axios.min.js przez curl, pobierz CSInterface.js z GitHub Adobe-CEP, utwórz CSXS/manifest.xml. Zatrzymaj się po implementacji i pokaż mi listę utworzonych plików.
```

---

## KROK 18 — Wtyczka CEP: ExtendScript

```
Wykonaj BLOK P2 z pliku GEMINI_CLI_PROMPT.md: utwórz premiere-plugin/jsx/host.jsx z funkcjami getCurrentTimecode, getProjectName, getSequenceName, getProjectPath i getPremiereContext. Pamiętaj: wyłącznie ES3, bez const/let/async/arrow functions. Zatrzymaj się po implementacji.
```

---

## KROK 19 — Wtyczka CEP: Panel HTML i style

```
Wykonaj BLOK P3 i BLOK P5 z pliku GEMINI_CLI_PROMPT.md: utwórz premiere-plugin/index.html z 3 zakładkami (Timer, Zadania, Ustawienia) oraz premiere-plugin/css/style.css z ciemnym motywem Adobe CC. Zatrzymaj się po implementacji.
```

---

## KROK 20 — Wtyczka CEP: Logika JS

```
Wykonaj BLOK P4 z pliku GEMINI_CLI_PROMPT.md: utwórz premiere-plugin/js/main.js z pełną logiką: stan w localStorage, apiClient przez axios, loadPremiereContext co 2 sekundy przez CSInterface.evalScript, testConnection, loadTasks, obsługa startu i stopu timera, zapis ustawień. Zatrzymaj się po implementacji.
```

---

## KROK 21 — Wtyczka CEP: Konfiguracja debugowania

```
Wykonaj BLOK P6 z pliku GEMINI_CLI_PROMPT.md: utwórz premiere-plugin/.debug z konfiguracją portu 8099 oraz utwórz premiere-plugin/INSTALL.md z instrukcjami włączenia trybu debugowania na Windows i macOS oraz tworzenia symlinka. Zatrzymaj się po implementacji.
```

---

## KROK 22 — Końcowy test kompilacji

```
Uruchom `npm run build` i pokaż mi pełny output. Jeśli są błędy TypeScript lub błędy kompilacji, napraw je wszystkie zanim przejdziesz dalej. Nie zgłaszaj sukcesu dopóki build nie przechodzi czysto.
```

---

## KROK 23 — Weryfikacja checklisty

```
Uruchom serwer `npm run dev`. Przejdź przez checklistę końcową z pliku GEMINI_CLI_PROMPT.md i zweryfikuj każdy punkt po stronie backendu robiąc rzeczywiste żądania HTTP przez curl lub fetch. Pokaż mi wyniki każdego testu.
```
