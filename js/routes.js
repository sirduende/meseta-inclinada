import { map } from './map.js';
import { formatFecha } from './utils.js';

export const layersById = new Map();

export function addRouteToList(id, meta) {
    const routesEl = document.getElementById('routes');
    const fechaFmt = meta.fecha ? formatFecha(meta.fecha) : "";

    const btn = document.createElement('button');
    btn.className = 'btn btn-light w-100 text-start route-item-resumen';
    btn.textContent = `${fechaFmt} — ${meta.nombre} (${meta.participantes.length})`;

    btn.addEventListener('click', () => {
        const entry = layersById.get(id);
        if (!entry) return;

        const showBounds = () => {
            const b = entry.bounds;
            if (b && b.isValid() && b.getNorthEast().distanceTo(b.getSouthWest()) > 0) {
                map.fitBounds(b.pad(0.1));
            } else {
                const line = entry.gpxLayer.getLayers().find(l => l instanceof L.Polyline);
                if (line) map.setView(line.getLatLngs()[0], 14);
            }
        };

        entry.bounds ? showBounds() : entry.gpxLayer.once('loaded', showBounds);
    });

    routesEl.appendChild(btn);
}
