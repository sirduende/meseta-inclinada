export function colorForIndex(i) {
    const palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    return palette[i % palette.length];
}

export function formatFecha(fechaStr) {
    const d = new Date(fechaStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

export function formatDuracion(segundos) {
    if (!segundos || segundos <= 0) return 'N/A';
    const h = Math.floor(segundos / 3600);
    const m = Math.round((segundos % 3600) / 60);
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
