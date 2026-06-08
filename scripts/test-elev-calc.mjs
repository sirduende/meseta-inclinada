/**
 * test-elev-calc.mjs — Verifica el algoritmo de cálculo de desnivel
 * Uso: node scripts/test-elev-calc.mjs
 */

let passed = 0, failed = 0;

function test(label, fn) {
    try { fn(); console.log(`  ✓  ${label}`); passed++; }
    catch (e) { console.log(`  ✗  ${label}\n     → ${e.message}`); failed++; }
}
function expect(val, expected, msg) {
    if (val !== expected) throw new Error(`${msg}: esperado ${expected}, obtenido ${val}`);
}
function expectRange(val, min, max, msg) {
    if (val < min || val > max) throw new Error(`${msg}: esperado [${min}–${max}], obtenido ${val}`);
}

// ── Reimplementación del algoritmo actual (con el bug) ─────────────────────────
function calcElevGain_actual(alts, threshold = 5) {
    let gain = 0, prev = null, accumulated = 0;
    for (const alt of alts) {
        if (alt == null) continue;
        if (prev === null) { prev = alt; continue; }
        const diff = alt - prev;
        if (diff > 0) {
            accumulated += diff;
            if (accumulated >= threshold) { gain += accumulated; accumulated = 0; }
        } else {
            accumulated = 0;  // ← BUG: resetea al encontrar cualquier bajada
        }
        prev = alt;
    }
    return Math.round(gain);
}

// ── Algoritmo corregido (local-min approach) ──────────────────────────────────
function calcElevGain_fixed(alts, threshold = 5) {
    const pts = alts.filter(a => a != null);
    if (pts.length < 2) return 0;
    let gain = 0;
    let localMin = pts[0];
    for (let i = 1; i < pts.length; i++) {
        if (pts[i] < localMin) {
            localMin = pts[i];
        } else if (pts[i] - localMin >= threshold) {
            gain += pts[i] - localMin;
            localMin = pts[i];
        }
    }
    return Math.round(gain);
}

// ── Suite 1: Demostrar el bug del algoritmo actual ─────────────────────────────
console.log('\n🐛 Suite 1: Bug en el algoritmo actual');

test('Subida limpia: [100→130] debe dar ~30m', () => {
    const alts = [100, 105, 110, 115, 120, 125, 130];
    expect(calcElevGain_actual(alts), 30, 'subida limpia');
});

test('Subida con mini-bajada: pierda ganancia acumulada [BUG]', () => {
    // 100→104 (accumulated=4), luego baja a 103 → reset, pierde los 4m
    // Luego 103→108 = +5, gain=5. Pero el gain real es 100→108=8m
    const alts = [100, 102, 104, 103, 108];
    const actual = calcElevGain_actual(alts);
    const real = 8; // ganancia real (100→108, ignorando el pequeño dip)
    if (actual === real) throw new Error(`¡Coincide! El bug no se reproduce con estos datos`);
    console.log(`     → Algoritmo actual: ${actual}m, ganancia real esperada: ${real}m`);
});

test('Todo null (no hay datos de altitud) → 0', () => {
    expect(calcElevGain_actual([null, null, null]), 0, 'sin datos');
});

test('Ruido GPS en terreno llano → debería ser 0 o muy bajo', () => {
    const noise = [1200, 1201, 1199, 1202, 1198, 1201, 1200];
    const v = calcElevGain_actual(noise, 5);
    if (v > 5) throw new Error(`Ruido GPS sobreestimado: ${v}m (esperado ≤5m)`);
});

// ── Suite 2: Algoritmo corregido ──────────────────────────────────────────────
console.log('\n✅ Suite 2: Algoritmo corregido (local-min)');

test('Subida limpia [100→130] → 30m', () => {
    expect(calcElevGain_fixed([100,105,110,115,120,125,130]), 30, 'subida limpia');
});

test('Subida con mini-bajada → no pierde ganancia', () => {
    // 100→104, baja 103, sube 108. Real=8m. Con localMin=100, 108-100=8>=5 → gain=8
    expect(calcElevGain_fixed([100, 102, 104, 103, 108]), 8, 'subida con dip');
});

test('Ruido GPS (±2m) en llano → 0', () => {
    const noise = [1200, 1201, 1199, 1202, 1198, 1201, 1200];
    expect(calcElevGain_fixed(noise, 5), 0, 'ruido filtrado');
});

test('Ruta de montaña simulada → rango razonable', () => {
    // Simula ~500m de desnivel con algo de ruido
    const ruta = [];
    let alt = 800;
    for (let i = 0; i < 100; i++) {
        alt += (i < 60 ? 8 : -6) + (Math.random() - 0.5) * 3;
        ruta.push(Math.round(alt));
    }
    const gain = calcElevGain_fixed(ruta, 5);
    expectRange(gain, 300, 650, 'ruta simulada de montaña');
    console.log(`     → Desnivel calculado: ${gain}m`);
});

test('Sin datos (array vacío) → 0', () => {
    expect(calcElevGain_fixed([]), 0, 'vacío');
});

test('Un solo punto → 0', () => {
    expect(calcElevGain_fixed([1200]), 0, 'un punto');
});

test('Todos null → 0', () => {
    expect(calcElevGain_fixed([null, null, null]), 0, 'todo null');
});

// ── Suite 3: Compatibilidad con get_elevation_gain() de la librería ───────────
console.log('\n📋 Suite 3: Lógica de fallback cuando no hay altitud en puntos');

test('Si todos los puntos tienen alt=null, el fallback a la librería debe activarse', () => {
    // El algoritmo fijo devuelve 0 cuando no hay datos
    // En el JS real, se verificará si pointsWithAlt===0 para usar get_elevation_gain()
    const pts = [null, null, null];
    const result = calcElevGain_fixed(pts, 5);
    expect(result, 0, 'sin datos debe dar 0 y activar fallback');
});

// ── Resumen ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`  Resultado: ${passed} pasados, ${failed} fallidos`);
if (failed > 0) { console.log('\n  ⚠  Aplicando corrección...'); process.exit(1); }
else { console.log('\n  ✅ Algoritmo corregido validado.'); }
