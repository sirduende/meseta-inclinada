import { layersById, map } from './map.js';

export function addRouteToList(id, meta) {
    const routesEl = document.getElementById('routes');

    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-light w-100 text-start mb-2 route-button';
    btn.style.whiteSpace = 'normal';

    console.log(meta);
    const fecha = meta.fecha || '';
    const nombre = meta.nombre || 'Ruta sin nombre';
    const numParticipantes = meta.participantes?.length || 0;
    const numeroRuta = meta.index + 1;

    btn.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div class="fw-bold">${fecha} — ${nombre}</div>
            <div class="badge bg-secondary rounded-pill ms-2">#${numeroRuta}</div>
        </div>
        <div class="text-muted" style="font-size: 12px;">
            ${numParticipantes} participante${numParticipantes !== 1 ? 's' : ''}
        </div>
        <div class="mt-1">
            <span class="badge rounded-pill" style="background-color: ${meta.color}; color: white;">
                Nivel: ${meta.nivel}
            </span>
        </div>
    `;

    btn.addEventListener('click', () => {
        const entry = layersById.get(id);
        if (entry?.bounds) {
            map.fitBounds(entry.bounds.pad(0.1));
            entry.gpxLayer.openPopup();
        } else {
            entry?.gpxLayer.once('loaded', () => {
                if (entry.bounds) {
                    map.fitBounds(entry.bounds.pad(0.1));
                    entry.gpxLayer.openPopup();
                }
            });
        }

        const sidebarEl = document.getElementById('sidebar');
        const sidebar = bootstrap.Offcanvas.getInstance(sidebarEl);
        if (sidebar) sidebar.hide();
    });

    routesEl.appendChild(btn);
}

