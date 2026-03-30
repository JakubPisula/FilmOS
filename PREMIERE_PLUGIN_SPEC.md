# PREMIERE_PLUGIN_SPEC.md
# Specyfikacja wtyczki Adobe Premiere Pro (CEP) dla Gemini CLI — FilmOS

> **Kontekst dla Gemini CLI:** Tworzysz wtyczkę Adobe CEP (Common Extensibility Platform) v12 dla Premiere Pro 2024+.
> CEP to technologia panelów HTML5/JS osadzonych w aplikacjach Adobe CC.
> Wtyczka komunikuje się z FilmOS API przez `axios` (zainstaluj w katalogu wtyczki).
> Wtyczka NIE ma dostępu do ciasteczek sesji — używa tokenu Bearer z `IMPLEMENTATION_BACKEND.md` BLOK 4.
> Cały panel wtyczki to single HTML file z osadzonym CSS i JS — NIE używaj bundlerów.

---

## BLOK P0 — Struktura katalogów wtyczki (utwórz od zera)

**P0.1** Utwórz katalog `premiere-plugin/` w **głównym katalogu repozytorium** FilmOS (obok `src/`, `prisma/`).

**P0.2** Utwórz następującą strukturę plików:
```
premiere-plugin/
├── CSXS/
│   └── manifest.xml          ← rejestracja wtyczki w systemie Adobe
├── js/
│   ├── CSInterface.js         ← oficjalna biblioteka Adobe CEP (skopiuj z Adobe-CEP/CEP-Resources)
│   ├── axios.min.js           ← pobierz: https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js
│   └── main.js               ← logika wtyczki
├── css/
│   └── style.css             ← style panelu
├── jsx/
│   └── host.jsx              ← skrypty ExtendScript działające wewnątrz Premiere Pro
└── index.html                ← główny panel HTML
```

**P0.3** Pobierz `CSInterface.js` z oficjalnego repozytorium Adobe CEP:
URL: `https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_12.x/CSInterface.js`
Zapisz jako `premiere-plugin/js/CSInterface.js`.

**P0.4** Pobierz `axios.min.js`:
```bash
curl -o premiere-plugin/js/axios.min.js \
  https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js
```

---

## BLOK P1 — Plik `CSXS/manifest.xml`

**P1.1** Utwórz `premiere-plugin/CSXS/manifest.xml` z następującą treścią:

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
      <!-- PPRO = Premiere Pro; wersja 24.0 = Premiere Pro 2024 -->
      <Host Name="PPRO" Version="[24.0,99.9]"/>
    </HostList>
    <LocaleList>
      <Locale Code="All"/>
    </LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="12.0"/>
    </RequiredRuntimeList>
  </ExecutionEnvironment>

  <DispatchInfoList>
    <Extension Id="com.filmos.premiere.panel">
      <DispatchInfo>
        <Resources>
          <!-- Ścieżka do głównego pliku HTML panelu -->
          <MainPath>./index.html</MainPath>
          <!-- Ścieżka do skryptu ExtendScript -->
          <ScriptPath>./jsx/host.jsx</ScriptPath>
        </Resources>
        <Lifecycle>
          <AutoVisible>true</AutoVisible>
        </Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>
            <Locale Code="en_US">FilmOS Time Tracker</Locale>
            <Locale Code="pl_PL">FilmOS Śledzenie czasu</Locale>
          </Menu>
          <Geometry>
            <Size>
              <Height>600</Height>
              <Width>320</Width>
            </Size>
            <MinSize>
              <Height>400</Height>
              <Width>280</Width>
            </MinSize>
          </Geometry>
          <Icons/>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>

</ExtensionManifest>
```

> **Uwaga dla Gemini CLI:** `ExtensionBundleId` musi być unikatowy. Użyj wartości `com.filmos.premiere.plugin`.
> NIE zmieniaj struktury XML — Adobe wymaga dokładnie tego formatu.

---

## BLOK P2 — Plik `jsx/host.jsx` (ExtendScript)

> ExtendScript to starszy JavaScript (ES3) działający wewnątrz procesu Premiere Pro.
> Ma dostęp do obiektów Premiere: `app.project`, `app.project.sequences`, timecode'ów.
> NIE używaj `fetch`, `async/await`, `const`, `let` — tylko ES3.

**P2.1** Utwórz `premiere-plugin/jsx/host.jsx`:

```javascript
/**
 * host.jsx — ExtendScript dla FilmOS Premiere Plugin
 * Środowisko: ExtendScript (ES3), Premiere Pro 2024+
 * NIE używaj: const, let, arrow functions, async/await, fetch
 */

/**
 * Zwraca aktualny timecode aktywnej sekwencji.
 * Format: "HH:MM:SS:FF" (godziny:minuty:sekundy:klatki)
 * @returns {string} timecode lub "00:00:00:00" jeśli brak sekwencji
 */
function getCurrentTimecode() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "00:00:00:00";
    var tc = seq.getPlayerPosition();
    return tc.toString();
  } catch (e) {
    return "00:00:00:00";
  }
}

/**
 * Zwraca nazwę aktywnego projektu Premiere.
 * @returns {string} nazwa projektu lub pusty string
 */
function getProjectName() {
  try {
    return app.project.name.replace(/\.prproj$/, "");
  } catch (e) {
    return "";
  }
}

/**
 * Zwraca nazwę aktywnej sekwencji.
 * @returns {string} nazwa sekwencji lub pusty string
 */
function getSequenceName() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "";
    return seq.name;
  } catch (e) {
    return "";
  }
}

/**
 * Zwraca ścieżkę do pliku projektu Premiere.
 * @returns {string} ścieżka lub pusty string
 */
function getProjectPath() {
  try {
    return app.project.path;
  } catch (e) {
    return "";
  }
}

/**
 * Zwraca JSON z pełnym kontekstem Premiere do przekazania do panelu HTML.
 * @returns {string} JSON string
 */
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

## BLOK P3 — Plik `index.html` (panel wtyczki)

**P3.1** Utwórz `premiere-plugin/index.html`. Panel ma 3 zakładki: **Timer**, **Lista zadań**, **Ustawienia**.

```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FilmOS Time Tracker</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<!-- NAWIGACJA ZAKŁADEK -->
<nav class="tabs">
  <button class="tab-btn active" data-tab="timer">⏱ Timer</button>
  <button class="tab-btn" data-tab="tasks">📋 Zadania</button>
  <button class="tab-btn" data-tab="settings">⚙ Ustawienia</button>
</nav>

<!-- STATUS POŁĄCZENIA -->
<div id="connection-status" class="status-bar">
  <span id="status-dot" class="dot dot--offline"></span>
  <span id="status-text">Nie połączono</span>
</div>

<!-- ZAKŁADKA: TIMER -->
<section id="tab-timer" class="tab-content active">
  <div class="context-info">
    <div class="context-row">
      <span class="label">Projekt:</span>
      <span id="premiere-project" class="value">—</span>
    </div>
    <div class="context-row">
      <span class="label">Sekwencja:</span>
      <span id="premiere-sequence" class="value">—</span>
    </div>
    <div class="context-row">
      <span class="label">Timecode:</span>
      <span id="premiere-timecode" class="value monospace">00:00:00:00</span>
    </div>
  </div>

  <div class="form-group">
    <label for="task-select">Zadanie FilmOS</label>
    <select id="task-select">
      <option value="">-- wybierz zadanie --</option>
    </select>
  </div>

  <div class="form-group">
    <label for="note-input">Notatka (opcjonalna)</label>
    <textarea id="note-input" rows="2" maxlength="500" placeholder="Co robisz?"></textarea>
  </div>

  <div id="timer-idle">
    <button id="btn-start" class="btn btn--primary btn--full">▶ Start timera</button>
  </div>

  <div id="timer-active" class="hidden">
    <div class="timer-display" id="timer-display">00:00:00</div>
    <button id="btn-stop" class="btn btn--danger btn--full">■ Stop i zapisz</button>
  </div>

  <div id="timer-feedback" class="feedback hidden"></div>
</section>

<!-- ZAKŁADKA: LISTA ZADAŃ -->
<section id="tab-tasks" class="tab-content hidden">
  <div class="form-group">
    <label for="project-select">Projekt FilmOS</label>
    <select id="project-select">
      <option value="">-- wybierz projekt --</option>
    </select>
  </div>
  <button id="btn-load-tasks" class="btn btn--secondary btn--full">Wczytaj zadania</button>
  <ul id="tasks-list" class="tasks-list"></ul>
</section>

<!-- ZAKŁADKA: USTAWIENIA -->
<section id="tab-settings" class="tab-content hidden">
  <div class="form-group">
    <label for="api-url">URL serwera FilmOS</label>
    <input type="url" id="api-url" placeholder="http://localhost:3000">
  </div>
  <div class="form-group">
    <label for="api-token">Token API (Bearer)</label>
    <input type="password" id="api-token" placeholder="Wklej token z FilmOS > Ustawienia > Tokeny">
  </div>
  <button id="btn-save-settings" class="btn btn--primary">Zapisz ustawienia</button>
  <button id="btn-test-connection" class="btn btn--secondary">Test połączenia</button>
  <div id="settings-feedback" class="feedback hidden"></div>
</section>

<!-- BIBLIOTEKI -->
<script src="js/CSInterface.js"></script>
<script src="js/axios.min.js"></script>
<script src="js/main.js"></script>
</body>
</html>
```

---

## BLOK P4 — Plik `js/main.js` (logika panelu)

**P4.1** Utwórz `premiere-plugin/js/main.js`:

```javascript
/**
 * main.js — Logika panelu HTML FilmOS Premiere Plugin
 * Środowisko: Chromium (CEP WebView) — dostępny nowoczesny JS (ES2020+)
 * Komunikacja z Premiere: przez CSInterface.evalScript()
 * Komunikacja z FilmOS API: przez axios
 */

'use strict';

// ─── STAŁE ───────────────────────────────────────────────────────────────────
const cs = new CSInterface();
const STORAGE_KEY_URL   = 'filmos_api_url';
const STORAGE_KEY_TOKEN = 'filmos_api_token';

// ─── STAN GLOBALNY ───────────────────────────────────────────────────────────
let state = {
  apiUrl:       localStorage.getItem(STORAGE_KEY_URL)   || 'http://localhost:3000',
  apiToken:     localStorage.getItem(STORAGE_KEY_TOKEN) || '',
  activeLogId:  null,
  timerStart:   null,
  timerInterval:null,
  selectedTaskId: null,
  premiereCtx:  { projectName: '', sequenceName: '', timecode: '00:00:00:00' },
};

// ─── DOM REFS ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── HELPERS: API ─────────────────────────────────────────────────────────────
function apiClient() {
  return axios.create({
    baseURL: state.apiUrl,
    headers: { Authorization: `Bearer ${state.apiToken}`, 'Content-Type': 'application/json' },
    timeout: 10000,
  });
}

async function testConnection() {
  try {
    // Próbuje pobrać listę zadań bez taskId — oczekuje 400 lub 200 (nie 401/403)
    const res = await apiClient().get('/api/external/tasks');
    return res.status < 500;
  } catch (err) {
    return err.response && err.response.status !== 401 ? false : false;
  }
}

// ─── HELPERS: UI ─────────────────────────────────────────────────────────────
function showFeedback(elementId, message, type = 'success') {
  const el = $(elementId);
  el.textContent = message;
  el.className = `feedback feedback--${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function setStatus(online) {
  $('status-dot').className = `dot dot--${online ? 'online' : 'offline'}`;
  $('status-text').textContent = online ? 'Połączono z FilmOS' : 'Brak połączenia';
}

// ─── ZAKŁADKI ────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
    btn.classList.add('active');
    $(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

// ─── PREMIERE CONTEXT (polling co 2s) ────────────────────────────────────────
function refreshPremiereContext() {
  cs.evalScript('getPremiereContext()', result => {
    try {
      state.premiereCtx = JSON.parse(result);
      $('premiere-project').textContent  = state.premiereCtx.projectName  || '—';
      $('premiere-sequence').textContent = state.premiereCtx.sequenceName || '—';
      $('premiere-timecode').textContent = state.premiereCtx.timecode     || '00:00:00:00';
    } catch (e) { /* ignoruj błędy parsowania */ }
  });
}
setInterval(refreshPremiereContext, 2000);
refreshPremiereContext();

// ─── PROJEKTY i ZADANIA ──────────────────────────────────────────────────────
async function loadProjects() {
  if (!state.apiToken) return;
  try {
    const { data } = await apiClient().get('/api/external/tasks');
    // external/tasks bez parametrów zwróci błąd 400 — obsłuż to jako brak projektów
  } catch (e) { /* ignoruj */ }
}

$('btn-load-tasks').addEventListener('click', async () => {
  const projectId = $('project-select').value;
  if (!projectId) { showFeedback('timer-feedback', 'Wybierz projekt', 'error'); return; }
  try {
    const { data } = await apiClient().get(`/api/external/tasks?projectId=${projectId}`);
    const select = $('task-select');
    select.innerHTML = '<option value="">-- wybierz zadanie --</option>';
    (data || []).forEach(task => {
      const opt = document.createElement('option');
      opt.value = task.id;
      opt.textContent = `[${task.status}] ${task.title}`;
      select.appendChild(opt);
    });
    // Wypełnij też listę w zakładce Tasks
    const list = $('tasks-list');
    list.innerHTML = '';
    (data || []).forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.innerHTML = `<span class="task-status task-status--${task.status.toLowerCase()}">${task.status}</span>
                      <span class="task-title">${task.title}</span>`;
      list.appendChild(li);
    });
    setStatus(true);
  } catch (err) {
    setStatus(false);
    showFeedback('timer-feedback', 'Błąd wczytywania zadań', 'error');
  }
});

$('task-select').addEventListener('change', e => {
  state.selectedTaskId = e.target.value || null;
});

// ─── TIMER: START ────────────────────────────────────────────────────────────
$('btn-start').addEventListener('click', async () => {
  if (!state.selectedTaskId) {
    showFeedback('timer-feedback', 'Wybierz zadanie przed startem', 'error');
    return;
  }
  const startedAt = new Date().toISOString();
  const note      = $('note-input').value.trim();

  // Pobierz aktualny timecode z Premiere
  cs.evalScript('getCurrentTimecode()', async premiereSeq => {
    try {
      const { data } = await apiClient().post('/api/external/worklogs', {
        taskId: state.selectedTaskId,
        startedAt,
        note: note || undefined,
        source: 'PREMIERE_CEP',
        premiereSeq: premiereSeq || undefined,
      });

      state.activeLogId = data.id;
      state.timerStart  = Date.now();

      // Uruchom odliczanie
      $('timer-idle').classList.add('hidden');
      $('timer-active').classList.remove('hidden');
      state.timerInterval = setInterval(() => {
        $('timer-display').textContent = formatElapsed(Date.now() - state.timerStart);
      }, 1000);

      setStatus(true);
    } catch (err) {
      const msg = err.response?.data?.error === 'active_timer_exists'
        ? 'Masz już aktywny timer. Zatrzymaj go przed startem nowego.'
        : 'Błąd startu timera';
      showFeedback('timer-feedback', msg, 'error');
    }
  });
});

// ─── TIMER: STOP ─────────────────────────────────────────────────────────────
$('btn-stop').addEventListener('click', async () => {
  if (!state.activeLogId) return;
  clearInterval(state.timerInterval);

  try {
    await apiClient().post(`/api/worklogs/${state.activeLogId}/stop`, {
      note: $('note-input').value.trim() || undefined,
    });

    state.activeLogId   = null;
    state.timerStart    = null;
    $('timer-active').classList.add('hidden');
    $('timer-idle').classList.remove('hidden');
    $('timer-display').textContent = '00:00:00';
    $('note-input').value = '';
    showFeedback('timer-feedback', 'Czas zapisany pomyślnie ✓', 'success');
    setStatus(true);
  } catch (err) {
    showFeedback('timer-feedback', 'Błąd zatrzymania timera', 'error');
  }
});

// ─── USTAWIENIA ──────────────────────────────────────────────────────────────
$('api-url').value   = state.apiUrl;
$('api-token').value = state.apiToken;

$('btn-save-settings').addEventListener('click', () => {
  state.apiUrl   = $('api-url').value.trim().replace(/\/$/, '');
  state.apiToken = $('api-token').value.trim();
  localStorage.setItem(STORAGE_KEY_URL,   state.apiUrl);
  localStorage.setItem(STORAGE_KEY_TOKEN, state.apiToken);
  showFeedback('settings-feedback', 'Ustawienia zapisane', 'success');
});

$('btn-test-connection').addEventListener('click', async () => {
  state.apiUrl   = $('api-url').value.trim().replace(/\/$/, '');
  state.apiToken = $('api-token').value.trim();
  const ok = await testConnection();
  setStatus(ok);
  showFeedback('settings-feedback', ok ? 'Połączenie OK ✓' : 'Błąd połączenia — sprawdź URL i token', ok ? 'success' : 'error');
});
```

---

## BLOK P5 — Plik `css/style.css`

**P5.1** Utwórz `premiere-plugin/css/style.css`. Adobe CEP renderuje panel w ciemnym motywie — dostosuj kolory:

```css
/* ─── RESET i BASE ─────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  background: #1c1c1c;
  color: #d4d4d4;
  height: 100vh;
  overflow-y: auto;
}

/* ─── ZAKŁADKI ─────────────────────────────────────── */
.tabs {
  display: flex;
  border-bottom: 1px solid #333;
  background: #252525;
}
.tab-btn {
  flex: 1;
  padding: 8px 4px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 11px;
  transition: color 0.2s;
}
.tab-btn:hover    { color: #ccc; }
.tab-btn.active   { color: #fff; border-bottom: 2px solid #0078d4; }
.tab-content      { padding: 12px; }
.hidden           { display: none !important; }

/* ─── STATUS BAR ───────────────────────────────────── */
.status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #1a1a1a;
  font-size: 10px;
  color: #666;
  border-bottom: 1px solid #2a2a2a;
}
.dot { width: 6px; height: 6px; border-radius: 50%; }
.dot--online  { background: #4caf50; }
.dot--offline { background: #666; }

/* ─── KONTEKST PREMIERE ────────────────────────────── */
.context-info {
  background: #2a2a2a;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 12px;
}
.context-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
.context-row .label { color: #666; }
.context-row .value { color: #ccc; max-width: 65%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.monospace { font-family: 'Courier New', monospace; color: #e8a838; }

/* ─── FORMULARZE ───────────────────────────────────── */
.form-group { margin-bottom: 10px; }
.form-group label { display: block; margin-bottom: 4px; color: #888; font-size: 10px; text-transform: uppercase; }
select, input, textarea {
  width: 100%;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #d4d4d4;
  padding: 6px 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
}
select:focus, input:focus, textarea:focus { border-color: #0078d4; }
textarea { resize: vertical; min-height: 40px; }

/* ─── TIMER DISPLAY ────────────────────────────────── */
.timer-display {
  font-size: 36px;
  font-family: 'Courier New', monospace;
  text-align: center;
  color: #e8a838;
  padding: 16px 0;
  letter-spacing: 2px;
}

/* ─── PRZYCISKI ────────────────────────────────────── */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn:hover       { opacity: 0.85; }
.btn--full       { width: 100%; }
.btn--primary    { background: #0078d4; color: #fff; }
.btn--secondary  { background: #444;    color: #d4d4d4; margin-top: 6px; }
.btn--danger     { background: #c62828; color: #fff; }

/* ─── FEEDBACK ─────────────────────────────────────── */
.feedback { margin-top: 8px; padding: 6px 10px; border-radius: 4px; font-size: 11px; }
.feedback--success { background: #1b3a1b; color: #81c784; border: 1px solid #2e7d32; }
.feedback--error   { background: #3a1b1b; color: #e57373; border: 1px solid #b71c1c; }

/* ─── LISTA ZADAŃ ──────────────────────────────────── */
.tasks-list  { list-style: none; margin-top: 10px; }
.task-item   { display: flex; align-items: center; gap: 8px; padding: 6px; border-bottom: 1px solid #2a2a2a; }
.task-title  { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-status {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  white-space: nowrap;
}
.task-status--todo        { background: #333; color: #888; }
.task-status--in_progress { background: #0d3a5c; color: #64b5f6; }
.task-status--review      { background: #3a2c00; color: #ffca28; }
.task-status--done        { background: #1b3a1b; color: #81c784; }
.task-status--cancelled   { background: #3a1b1b; color: #e57373; }
```

---

## BLOK P6 — Instalacja i debugowanie wtyczki

**P6.1** Tryb debugowania Adobe CEP (wymagany do uruchomienia bez podpisanego certyfikatu):

Na **Windows** (PowerShell jako Administrator):
```powershell
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

Na **macOS** (Terminal):
```bash
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

**P6.2** Skopiuj katalog `premiere-plugin/` do katalogu rozszerzeń CEP:

Windows: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\FilmOS_TimeTracker\`
macOS:   `/Library/Application Support/Adobe/CEP/extensions/FilmOS_TimeTracker/`

Lub utwórz dowiązanie symboliczne (symlink) — zalecane dla dewelopera:
```bash
# macOS
ln -s "$(pwd)/premiere-plugin" "/Library/Application Support/Adobe/CEP/extensions/FilmOS_TimeTracker"
```

**P6.3** Utwórz plik `.debug` w katalogu `premiere-plugin/` (wymagany dla DevTools):
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

Debuguj panel w Chrome DevTools: otwórz `http://localhost:8099` w przeglądarce Chrome.

**P6.4** Uruchom Premiere Pro → menu `Okno > Rozszerzenia > FilmOS Time Tracker`.

---

## BLOK P7 — Checklist weryfikacji wtyczki

Po implementacji zweryfikuj każdy punkt:

- [ ] Panel otwiera się w Premiere Pro bez błędów konsoli
- [ ] Timecode z Premiere jest odświeżany co 2 sekundy
- [ ] Pole "Projekt Premiere" pokazuje nazwę otwartego projektu `.prproj`
- [ ] Ustawienia (URL + token) są trwałe po zamknięciu i otwarciu panelu
- [ ] "Test połączenia" zwraca zielony status dla poprawnego tokenu
- [ ] "Test połączenia" zwraca czerwony status dla błędnego tokenu
- [ ] Start timera bez wybranego zadania → komunikat błędu (NIE wywołuje API)
- [ ] Start timera z wybranym zadaniem → rekord w bazie FilmOS z `source: PREMIERE_CEP`
- [ ] Uruchomienie drugiego timera (bez stopowania pierwszego) → komunikat "aktywny timer"
- [ ] Stop timera → `durationSec` obliczone w bazie FilmOS
- [ ] `premiereSeq` (timecode) zapisany w `WorkLog.premiereSeq`

---

## Struktura pliku końcowego — podsumowanie

```
premiere-plugin/
├── CSXS/manifest.xml      ← rejestracja Adobe CEP (BLOK P1)
├── jsx/host.jsx           ← ExtendScript: getCurrentTimecode(), getProjectName() (BLOK P2)
├── index.html             ← UI panelu: 3 zakładki (BLOK P3)
├── js/
│   ├── CSInterface.js     ← skopiowane z Adobe-CEP/CEP-Resources (BLOK P0.3)
│   ├── axios.min.js       ← pobrane z CDN (BLOK P0.4)
│   └── main.js            ← logika: timer, axios, localStorage (BLOK P4)
├── css/style.css          ← ciemny motyw zgodny z Adobe CC (BLOK P5)
└── .debug                 ← port DevTools dla Chrome (BLOK P6.3)
```

**Zależności zewnętrzne wtyczki (NIE npm):** `axios@1.7.2` (plik lokalny), `CSInterface.js` (Adobe).
**Komunikacja z FilmOS:** endpoint `/api/external/worklogs` i `/api/external/tasks` z tokenem Bearer.
