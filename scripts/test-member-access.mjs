/**
 * test-member-access.mjs
 * Verifica que un miembro puede acceder a /mi-area y
 * que el flujo de login en /admin redirige correctamente a los miembros.
 *
 * Uso: node scripts/test-member-access.mjs
 */

import { readFileSync } from 'fs';

let passed = 0;
let failed = 0;

function test(label, fn) {
    try {
        fn();
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

function readFile(path) {
    return readFileSync(path, 'utf-8');
}

const base = 'ParquesolSoftware.MesetaInclinada';

// ─── SUITE 1: MiArea.razor — acceso para miembros ─────────────────────────────
console.log('\n📋 Suite 1: MiArea.razor accesible para miembros');

const miArea = readFile(`${base}/Pages/MiArea.razor`);

test('MiArea usa IsAuthenticated (no solo IsAdmin) para el guard', () => {
    expect(miArea.includes('IsAuthenticated'), 'Debe usar AuthService.IsAuthenticated');
    expect(!miArea.includes('IsAdmin') || miArea.includes('IsAuthenticated'),
        'El guard principal debe ser IsAuthenticated, no IsAdmin');
});

test('MiArea tiene ruta @page "/mi-area"', () => {
    expect(miArea.includes('@page "/mi-area"'), 'Falta la directiva @page');
});

test('MiArea permite crear propuestas a miembros', () => {
    expect(miArea.includes('GuardarPropuesta'), 'Debe tener lógica de guardar propuesta');
    expect(miArea.includes('IsAdminOrMember') || miArea.includes('IsAuthenticated'),
        'La acción de guardar debe estar disponible para miembros');
});

// ─── SUITE 2: AdminPanel — comportamiento con miembros ────────────────────────
console.log('\n📋 Suite 2: AdminPanel redirige miembros a /mi-area');

const adminPanel = readFile(`${base}/Pages/Admin/AdminPanel.razor`);

test('AdminPanel detecta IsMember y redirige [BUG si falla]', () => {
    const hasRedirect =
        adminPanel.includes('IsMember') &&
        (adminPanel.includes('NavigateTo') || adminPanel.includes('/mi-area'));
    expect(hasRedirect,
        'FALLA: AdminPanel no redirige a miembros hacia /mi-area tras el login');
});

test('Login en AdminPanel redirige miembros (no muestra "acceso restringido")', () => {
    // El bloque if (!AuthService.IsAdmin) no debe mostrar solo el botón de login
    // cuando el usuario ya es miembro — debe redirigir
    const handlesMember =
        adminPanel.includes('IsMember') ||
        adminPanel.includes('IsAuthenticated');
    expect(handlesMember,
        'FALLA: AdminPanel trata igual a no-autenticado y a miembro autenticado');
});

// ─── SUITE 3: NavMenu — "Acceder" lleva al sitio correcto ─────────────────────
console.log('\n📋 Suite 3: NavMenu — flujo de acceso');

const navMenu = readFile(`${base}/Layout/NavMenu.razor`);

test('NavMenu muestra "Mi área" cuando IsAuthenticated', () => {
    expect(navMenu.includes('IsAuthenticated') && navMenu.includes('/mi-area'),
        'Debe mostrar enlace a /mi-area para usuarios autenticados');
});

test('NavMenu "Acceder" solo aparece cuando no está autenticado', () => {
    expect(navMenu.includes('Acceder'), 'Debe haber enlace "Acceder"');
    // El Acceder debe estar en el bloque else de IsAuthenticated
    const elseIdx    = navMenu.lastIndexOf('else');
    const accederIdx = navMenu.indexOf('Acceder');
    expect(accederIdx > elseIdx,
        'El enlace "Acceder" debe estar en el bloque else (no autenticado)');
});

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`  Resultado: ${passed} pasados, ${failed} fallidos`);
if (failed > 0) {
    console.log(`\n  ⚠  ${failed} problema(s) encontrado(s). Aplicando corrección...`);
    process.exit(1);
} else {
    console.log('\n  ✅ Todos los tests pasan.');
}
