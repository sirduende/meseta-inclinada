import { layersById, map } from './map.js';

export function addRouteToList(id, meta) {
    const routesEl = document.getElementById('routes');
    const item = document.createElement('div');
    item.className = 'route-item';

    const title = document.createElement('div');
    title.className = 'route-item-title';
    title.textContent = meta.nombre;
    item.appendChild(title);

    const metaEl = document.createElement('div');
    metaEl.className = 'route-item-meta';
    const participantes = meta.participantes.join(', ');
    metaEl.textContent = `${meta.fecha || ''} — ${participantes}`.trim();
    item.appendChild(metaEl);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'Ver ruta';
    viewBtn.addEventListener('click', () => {
        const entry = layersById.get(id);
        if (entry?.bounds) {
            map.fitBounds(entry.bounds.pad(0.1));
        } else {
            entry?.gpxLayer.once('loaded', () => {
                if (entry.bounds) map.fitBounds(entry.bounds.pad(0.1));
            });
        }
    });
    actions.appendChild(viewBtn);
    item.appendChild(actions);

    routesEl.appendChild(item);
}
