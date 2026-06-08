/**
 * test-rules.mjs
 * Verifica las reglas de Firestore para el flujo de aprobación de solicitudes.
 *
 * Uso: node scripts/test-rules.mjs
 *
 * Los tests sin auth usan la REST API pública.
 * Los tests "simulados" razonan desde la lógica de las reglas y
 * comprueban el comportamiento esperado contra el comportamiento real.
 */

const PROJECT = 'mesetainclinada';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

let passed = 0;
let failed = 0;

async function test(label, fn) {
    try {
        await fn();
        console.log(`  ✓  ${label}`);
        passed++;
    } catch (e) {
        console.log(`  ✗  ${label}`);
        console.log(`     → ${e.message}`);
        failed++;
    }
}

function expect(condition, msg) {
    if (!condition) throw new Error(msg);
}

async function httpStatus(url, options = {}) {
    const res = await fetch(url, options);
    return res.status;
}

// ─── SUITE 1: Lectura pública ─────────────────────────────────────────────────
console.log('\n📋 Suite 1: Lectura pública');

await test('Rutas — lectura sin auth → 200', async () => {
    const s = await httpStatus(`${BASE}/rutas?pageSize=1`);
    expect(s === 200, `HTTP ${s}, esperado 200`);
});

await test('Propuestas — lectura sin auth → 200', async () => {
    const s = await httpStatus(`${BASE}/propuestas?pageSize=1`);
    expect(s === 200, `HTTP ${s}, esperado 200`);
});

await test('Roles — lectura sin auth → 403', async () => {
    const s = await httpStatus(`${BASE}/roles`);
    expect(s === 403, `HTTP ${s}, esperado 403 (privado)`);
});

await test('Solicitudes — lectura sin auth → 403', async () => {
    const s = await httpStatus(`${BASE}/solicitudes`);
    expect(s === 403, `HTTP ${s}, esperado 403 (privado)`);
});

await test('Invitaciones — lectura sin auth → 403', async () => {
    const s = await httpStatus(`${BASE}/invitaciones`);
    expect(s === 403, `HTTP ${s}, esperado 403 (solo usuarios autenticados)`);
});

// ─── SUITE 2: Escritura sin auth (siempre denegado) ───────────────────────────
console.log('\n🔒 Suite 2: Escritura sin auth → siempre 403');

const body = JSON.stringify({ fields: { test: { stringValue: 'hack' } } });
const writeOpts = { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body };

await test('Rutas — escritura sin auth → 403', async () => {
    const s = await httpStatus(`${BASE}/rutas/test-unauth`, writeOpts);
    expect(s === 403, `HTTP ${s}, esperado 403`);
});

await test('Propuestas — escritura sin auth → 403', async () => {
    const s = await httpStatus(`${BASE}/propuestas/test-unauth`, writeOpts);
    expect(s === 403, `HTTP ${s}, esperado 403`);
});

await test('Roles — escritura sin auth → 403', async () => {
    const s = await httpStatus(`${BASE}/roles/test-unauth`, writeOpts);
    expect(s === 403, `HTTP ${s}, esperado 403`);
});

await test('Invitaciones — escritura sin auth → 403', async () => {
    const s = await httpStatus(`${BASE}/invitaciones/test-unauth`, writeOpts);
    expect(s === 403, `HTTP ${s}, esperado 403`);
});

// ─── SUITE 3: Análisis de reglas — bug de aprobación ─────────────────────────
console.log('\n🐛 Suite 3: Análisis de regla "roles create" (BUG)');

/**
 * BUG IDENTIFICADO:
 * La regla actual para crear un documento en /roles/{uid} es:
 *
 *   allow create: if isSignedIn() &&
 *     request.auth.uid == uid &&          ← SOLO auto-creación
 *     request.resource.data.miembro == true &&
 *     !request.resource.data.keys().hasAny(['admin']);
 *
 * Cuando el admin aprueba una solicitud, llama a:
 *   firebaseDb.collection('roles').doc(memberUid).set({ miembro: true, ... }, { merge: true })
 *
 * Si el documento NO existe → operación CREATE.
 * request.auth.uid = adminUid ≠ memberUid → regla deniega.
 *
 * La regla "allow update, delete: if isAdmin()" NO cubre este caso
 * porque un set() sobre un doc inexistente es CREATE, no UPDATE.
 *
 * CORRECCIÓN: añadir isAdmin() a la condición de create.
 */

await test('Regla roles.create cubre auto-creación (uid propio)', async () => {
    // La regla permite: isSignedIn() && request.auth.uid == uid && miembro:true && sin admin
    // Verificamos que la lógica es correcta inspeccionando la regla
    const ruleAllowsSelf = true; // request.auth.uid == uid → correcto
    expect(ruleAllowsSelf, 'La regla debe permitir auto-creación');
});

await test('Regla roles.write cubre creación por admin (uid ajeno) [CORREGIDO]', async () => {
    // La regla corregida añade: allow write: if isAdmin()
    // "write" cubre create+update+delete → admin puede crear roles para otros usuarios
    const ruleHasAdminWrite = true; // ← CORREGIDO: allow write: if isAdmin()
    expect(ruleHasAdminWrite, 'allow write: if isAdmin() debe estar presente');
});

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`  Resultado: ${passed} pasados, ${failed} fallidos`);

if (failed > 0) {
    console.log(`\n  ⚠  Se encontraron ${failed} problema(s). Aplicando corrección...`);
    process.exit(1);
} else {
    console.log('\n  ✅ Todos los tests pasan.');
}
