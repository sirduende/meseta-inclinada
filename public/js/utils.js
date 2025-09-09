// 🎨 Devuelve un color según el índice, usando una paleta fija
export function colorForIndex(i) {
    const palette = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
    return palette[i % palette.length];
}

// 🔍 Comprueba si hay intersección entre dos arrays
export function intersects(a, b) {
    return a.some(x => b.includes(x));
}

// ⏱️ Formatea duración en segundos a "X h Y min"
export function formatDuracion(segundos) {
    if (!segundos || segundos <= 0) return 'N/A';
    const h = Math.floor(segundos / 3600);
    const m = Math.round((segundos % 3600) / 60);
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
