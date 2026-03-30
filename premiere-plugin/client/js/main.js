/**
 * FilmOS Connector - main.js
 * Logika panelu CEP dla Adobe Premiere Pro
 */

var csInterface = new CSInterface();

// --- STAN APLIKACJI ---
var state = {
    apiToken: localStorage.getItem('filmos_token') || '',
    projectId: localStorage.getItem('filmos_project_id') || '',
    baseUrl: 'http://192.168.1.177:8989', // Adres serwera FilmOS (z Twojego .env)
    activeTaskId: localStorage.getItem('filmos_active_task_id') || null,
    activeTaskName: localStorage.getItem('filmos_active_task_name') || 'Wybierz zadanie...',
    activeWorkLogId: localStorage.getItem('filmos_active_log_id') || null,
    timerSeconds: 0,
    timerInterval: null,
    premiereContext: {
        projectName: '-',
        sequenceName: '-',
        timecode: '00:00:00:00'
    }
};

// --- API CLIENT ---
var apiClient = axios.create({
    baseURL: state.baseUrl + '/api/external',
    timeout: 5000
});

apiClient.interceptors.request.use(function(config) {
    if (state.apiToken) {
        config.headers.Authorization = 'Bearer ' + state.apiToken;
    }
    return config;
});

// --- INICJALIZACJA ---
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initSettings();
    initTimer();
    updateUI();
    
    // Pobierz kontekst z Premiere co 2 sekundy
    setInterval(loadPremiereContext, 2000);
    
    if (state.apiToken && state.projectId) {
        loadTasks();
    }
    
    // Przywróć timer jeśli był aktywny
    if (state.activeWorkLogId) {
        startTimerUI();
    }
});

// --- OBSŁUGA ZAKŁADEK ---
function initTabs() {
    var tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(function(btn) {
        btn.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });
}

// --- USTAWIENIA ---
function initSettings() {
    document.getElementById('api-token').value = state.apiToken;
    document.getElementById('project-id').value = state.projectId;
    
    document.getElementById('btn-save-settings').addEventListener('click', function() {
        var token = document.getElementById('api-token').value.trim();
        var pid = document.getElementById('project-id').value.trim();
        
        state.apiToken = token;
        state.projectId = pid;
        
        localStorage.setItem('filmos_token', token);
        localStorage.setItem('filmos_project_id', pid);
        
        testConnection();
    });
}

function testConnection() {
    var statusEl = document.getElementById('connection-status');
    statusEl.innerText = 'Status: Łączenie...';
    
    apiClient.get('/tasks?projectId=' + state.projectId)
        .then(function() {
            statusEl.innerText = 'Status: Połączono pomyślnie';
            statusEl.style.color = '#4caf50';
            loadTasks();
        })
        .catch(function(err) {
            statusEl.innerText = 'Status: Błąd połączenia (' + (err.response ? err.response.status : 'timeout') + ')';
            statusEl.style.color = '#f44336';
        });
}

// --- ZADANIA ---
function loadTasks() {
    var listEl = document.getElementById('tasks-list');
    
    apiClient.get('/tasks?projectId=' + state.projectId)
        .then(function(res) {
            var tasks = res.data;
            if (tasks.length === 0) {
                listEl.innerHTML = '<p className="empty-msg">Brak zadań w projekcie.</p>';
                return;
            }
            
            listEl.innerHTML = '';
            tasks.forEach(function(task) {
                var item = document.createElement('div');
                item.className = 'task-item' + (state.activeTaskId === task.id ? ' active' : '');
                item.style.padding = '8px';
                item.style.borderBottom = '1px solid #333';
                item.style.cursor = 'pointer';
                item.innerHTML = '<strong>' + task.title + '</strong><br><small style="color:#888">' + task.status + '</small>';
                
                item.onclick = function() {
                    selectTask(task);
                };
                listEl.appendChild(item);
            });
        })
        .catch(function() {
            listEl.innerHTML = '<p className="empty-msg">Nie udało się załadować zadań.</p>';
        });
}

function selectTask(task) {
    if (state.activeWorkLogId) return alert('Zatrzymaj obecny timer przed zmianą zadania!');
    
    state.activeTaskId = task.id;
    state.activeTaskName = task.title;
    localStorage.setItem('filmos_active_task_id', task.id);
    localStorage.setItem('filmos_active_task_name', task.title);
    
    updateUI();
    // Przełącz na zakładkę Timer
    document.querySelector('[data-tab="timer"]').click();
}

// --- TIMER ---
function initTimer() {
    document.getElementById('btn-start').addEventListener('click', startWorkLog);
    document.getElementById('btn-stop').addEventListener('click', stopWorkLog);
}

function startWorkLog() {
    if (!state.activeTaskId) return alert('Wybierz najpierw zadanie!');
    
    apiClient.post('/worklogs', {
        taskId: state.activeTaskId,
        startedAt: new Date().toISOString(),
        note: 'Praca w Premiere: ' + state.premiereContext.sequenceName,
        premiereSeq: state.premiereContext.timecode // Przesyłamy TC jako meta
    }).then(function(res) {
        state.activeWorkLogId = res.data.id;
        localStorage.setItem('filmos_active_log_id', res.data.id);
        startTimerUI();
    }).catch(function(err) {
        alert('Błąd startu: ' + (err.response?.data?.error || 'serwer nie odpowiada'));
    });
}

function stopWorkLog() {
    if (!state.activeWorkLogId) return;
    
    // Zatrzymanie lokalne natychmiast dla lepszego UX
    stopTimerUI();
    
    // Logika stopu jest obsługiwana przez serwer (zamyka aktywny log użytkownika)
    // Ale my mamy dedykowany endpoint stop/ w API wewnętrznym, 
    // dla API zewnętrznego uprościmy to przesyłając endedAt w POST /worklogs (jeśli API to obsługuje)
    // lub użyjemy ogólnego mechanizmu stopu. 
    // Zgodnie z BLOK 4 mamy endpoint /api/worklogs/[logId]/stop, dodajmy go do API zewnętrznego.
    
    apiClient.post('/worklogs/' + state.activeWorkLogId + '/stop')
        .then(function() {
            state.activeWorkLogId = null;
            localStorage.removeItem('filmos_active_log_id');
            updateUI();
        })
        .catch(function() {
            alert('Błąd zatrzymania na serwerze. Spróbuj ponownie.');
            startTimerUI(); // Przywróć UI jeśli błąd
        });
}

function startTimerUI() {
    document.getElementById('btn-start').classList.add('hidden');
    document.getElementById('btn-stop').classList.remove('hidden');
    
    // Oblicz sekundy od startu (uproszczone)
    state.timerSeconds = 0;
    if (state.timerInterval) clearInterval(state.timerInterval);
    
    state.timerInterval = setInterval(function() {
        state.timerSeconds++;
        document.getElementById('timer-clock').innerText = formatTime(state.timerSeconds);
    }, 1000);
}

function stopTimerUI() {
    document.getElementById('btn-start').classList.remove('hidden');
    document.getElementById('btn-stop').classList.add('hidden');
    if (state.timerInterval) clearInterval(state.timerInterval);
    document.getElementById('timer-clock').innerText = '00:00:00';
}

// --- PREMIERE INTEGRATION ---
function loadPremiereContext() {
    csInterface.evalScript('getPremiereContext()', function(result) {
        try {
            var ctx = JSON.parse(result);
            if (ctx.error) return;
            
            state.premiereContext = ctx;
            document.getElementById('premiere-seq').innerText = 'Sekwencja: ' + ctx.sequenceName;
            document.getElementById('premiere-tc').innerText = 'TC: ' + ctx.timecode;
            document.getElementById('current-project-name').innerText = ctx.projectName;
        } catch (e) {}
    });
}

// --- HELPERS ---
function updateUI() {
    document.getElementById('current-task-name').innerText = state.activeTaskName;
}

function formatTime(totalSeconds) {
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    return pad(h) + ':' + pad(m) + ':' + pad(s);
}

function pad(n) { return n < 10 ? '0' + n : n; }
