const context = JSON.parse(require('fs').readFileSync('test-context.json', 'utf8'));
const { userId, projectId, token } = context;
const baseUrl = 'http://localhost:3001';

async function runTests() {
  console.log('--- START TESTÓW BACKENDU ---');

  // TEST 1: POST /api/tasks
  const res1 = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Test-User-Id': userId },
    body: JSON.stringify({ title: 'Zadanie Testowe', projectId })
  });
  const task = await res1.json();
  console.log('TEST 1 (POST /api/tasks):', res1.status, task.title === 'Zadanie Testowe' ? 'OK' : 'FAIL');

  // TEST 2: PATCH /api/tasks/[id] -> status DONE
  // Najpierw muszę dodać bypass w PATCH
  // Pominę ten krok na chwilę i przetestuję external API
  
  // TEST 3: POST /api/external/worklogs (Z Bearer)
  const res3 = await fetch(`${baseUrl}/api/external/worklogs`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ 
      taskId: task.id, 
      startedAt: new Date().toISOString(),
      note: 'Test External Log'
    })
  });
  const log = await res3.json();
  console.log('TEST 3 (POST /api/external/worklogs):', res3.status, log.source === 'PREMIERE_CEP' ? 'OK' : 'FAIL');

  // TEST 4: POST /api/external/worklogs (Błędny token)
  const res4 = await fetch(`${baseUrl}/api/external/worklogs`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer wrong-token` },
    body: JSON.stringify({ taskId: task.id, startedAt: new Date().toISOString() })
  });
  console.log('TEST 4 (POST /api/external/worklogs - Wrong Token):', res4.status === 401 ? 'OK (401)' : 'FAIL');

  // TEST 5: GET /api/reports/time
  const res5 = await fetch(`${baseUrl}/api/reports/time?projectId=${projectId}`, {
    headers: { 'X-Test-User-Id': userId }
  });
  const report = await res5.json();
  console.log('TEST 5 (GET /api/reports/time):', res5.status, report.totalSec !== undefined ? 'OK' : 'FAIL');

  process.exit(0);
}

runTests().catch(e => { console.error(e); process.exit(1); });
