// routes-view-model.js

// 🎨 Paleta de colores para rutas
const palette = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

// 🔧 Funciones auxiliares (privadas)
function colorForIndex(i) {
    return palette[i % palette.length];
}

function formatDuracion(segundos) {
    if (!segundos || segundos <= 0) return 'N/A';
    const h = Math.floor(segundos / 3600);
    const m = Math.round((segundos % 3600) / 60);
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function getDifficulty(meta, distanciaKm, desnivelM) {
    const dificultad = meta.dificultad;
    const nombre = meta.nombre?.toLowerCase() || '';
    const dist = parseFloat(distanciaKm);
    const desn = parseFloat(desnivelM);

    if (nombre.includes("ferrata")) return { color: "black", nivel: "Ferrata" };
    if (dificultad === "Alta" || dist > 20 || desn > 1500) return { color: "red", nivel: "Alta" };
    if (dist < 12 && desn < 1000) return { color: "green", nivel: "Baja" };
    return { color: "#f97316", nivel: "Media" };
}

function calcularDuracionEstimada(distanciaKm) {
    const velocidadMediaKmH = 4.5;
    const durH = distanciaKm / velocidadMediaKmH;
    return durH * 3600;
}

function normalizarDuracion(durTotalS, distanciaKm) {
    const maxSegundosRazonable = 24 * 3600;
    if (durTotalS > maxSegundosRazonable || durTotalS <= 0) {
        return calcularDuracionEstimada(distanciaKm);
    }
    return durTotalS;
}

function enriquecer(meta, index, gpxStats) {
    const distanciaKm = parseFloat(gpxStats.distanciaKm);
    const desnivelM = parseFloat(gpxStats.desnivelM);
    const duracionS = normalizarDuracion(gpxStats.duracionTotalS, distanciaKm);

    const { color, nivel } = getDifficulty(meta, distanciaKm, desnivelM);
    const duracionFormateada = formatDuracion(duracionS);
    const colorIndex = colorForIndex(index);

    return {
        ...meta,
        index,
        distanciaKm: distanciaKm.toFixed(2),
        desnivelM: desnivelM.toFixed(0),
        duracionS,
        duracionFormateada,
        nivel,
        color,
        colorIndex
    };
}

export function enriquecerListado(rutas, gpxStatsPorId) {
    return rutas.map((meta, index) => {
        const stats = gpxStatsPorId[meta.id || meta.archivo];
        const idx = meta.index ?? index; // usa meta.index si existe, si no usa el índice del map
        return enriquecer(meta, idx, stats);
    });
}
