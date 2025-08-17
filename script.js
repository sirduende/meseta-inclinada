const map = L.map('map', { zoomControl: true }).setView([40.4168, -3.7038], 6);

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contrib.'
}).addTo(map);

const layersById = new Map(); // id -> { gpxLayer, meta, bounds }
let allBounds = null;

function colorForIndex(i) {
    const palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    return palette[i % palette.length];
}

function intersects(a, b) {
    return a.some(x => b.includes(x));
}

function updateVisibility() {
    const selected = document.getElementById('participantsSelect').value;
    layersById.forEach(({ gpxLayer, meta }) => {
        const show = selected === "" ? true : meta.participantes.includes(selected);
        if (show) {
            if (!map.hasLayer(gpxLayer)) gpxLayer.addTo(map);
        } else {
            if (map.hasLayer(gpxLayer)) map.removeLayer(gpxLayer);
        }
    });
}

function fitAllBounds() {
    if (allBounds) {
        map.fitBounds(allBounds.pad(0.1));
    } else {
        map.setView([40.4168, -3.7038], 6);
    }
}

function addRouteToList(id, meta) {
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
        if (entry && entry.bounds) {
            map.fitBounds(entry.bounds.pad(0.1));
        } else {
            const e2 = layersById.get(id);
            if (e2) {
                e2.gpxLayer.once('loaded', () => {
                    if (e2.bounds) map.fitBounds(e2.bounds.pad(0.1));
                });
            }
        }
    });
    actions.appendChild(viewBtn);
    item.appendChild(actions);

    routesEl.appendChild(item);
}

function buildParticipantsFilter(people) {
    const select = document.createElement('select');
    select.id = 'participantsSelect';
    select.className = 'form-select form-select-sm';

    // opción inicial = sin filtro
    const optAll = document.createElement('option');
    optAll.value = "";
    optAll.textContent = "Todos";
    select.appendChild(optAll);

    const sorted = Array.from(people).sort((a, b) => a.localeCompare(b));
    sorted.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    select.addEventListener('change', updateVisibility);
    var participants = document.getElementById('participants');

    if (participants == null) {
        return;
    }
    participants.appendChild(select);

    // Botón quitar filtros
    const clearBtn = document.getElementById('clearFilters');
    clearBtn.addEventListener('click', () => {
        select.value = "";              // volver a "Todos"
        updateVisibility();
    });
}

// botón "Quitar filtros" → resetea el combo
document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('participantsSelect').value = '';
    updateVisibility();
});


document.getElementById('clearFilters').addEventListener('click', () => {
    document.querySelectorAll('input[name="person"]').forEach(i => i.checked = false);
    updateVisibility();
});

document.getElementById('fitAll').addEventListener('click', (e) => {
    e.preventDefault();
    fitAllBounds();
});

// Load metadata and GPX layers
fetch('data.json')
    .then(r => r.json())
    .then(data => {
        const people = new Set();
        const boundsAccumulator = [];

        data.forEach((meta, idx) => {
            const id = meta.id || meta.archivo;
            meta.participantes.forEach(p => people.add(p));
            addRouteToList(id, meta);

            const gpx = new L.GPX('gpx/' + meta.archivo, {
                async: true,
                polyline_options: {
                    color: colorForIndex(idx),
                    weight: 4,
                    opacity: 0.9
                },
                marker_options: {
                    startIconUrl: 'https://unpkg.com/leaflet-gpx@1.7.0/pin-icon-start.png',
                    endIconUrl: 'https://unpkg.com/leaflet-gpx@1.7.0/pin-icon-end.png',
                    shadowUrl: 'https://unpkg.com/leaflet-gpx@1.7.0/pin-shadow.png'
                }
            });

            gpx.on('loaded', function (e) {
                const b = e.target.getBounds();
                layersById.get(id).bounds = b;
                boundsAccumulator.push(b);

                // Actualizar bounds global
                let union = boundsAccumulator[0];
                for (let i = 1; i < boundsAccumulator.length; i++) {
                    union = union.extend(boundsAccumulator[i]);
                }
                allBounds = union;

                // Datos principales
                const distanciaKm = (e.target.get_distance() / 1000).toFixed(2);
                const desnivelM = e.target.get_elevation_gain().toFixed(0);

                let durTotalS = e.target.get_total_time();
                let durMovS = e.target.get_moving_time();

                function formatDuracion(segundos) {
                    if (!segundos || segundos <= 0) return 'N/A';
                    const h = Math.floor(segundos / 3600);
                    const m = Math.round((segundos % 3600) / 60);
                    return h > 0 ? `${h} h ${m} min` : `${m} min`;
                }

                const maxSegundosRazonable = 24 * 3600;
                if (durTotalS > maxSegundosRazonable || durMovS > maxSegundosRazonable) {
                    const velocidadMediaKmH = 4.5;
                    const durH = distanciaKm / velocidadMediaKmH;
                    durTotalS = durH * 3600;
                    durMovS = durH * 3600;
                }

                const duracionTotalStr = formatDuracion(durTotalS);
                const duracionMovStr = formatDuracion(durMovS);

                const popupHtml = `
          <div>
            <div style="font-weight:600;margin-bottom:4px;">${meta.nombre}</div>
            <div style="font-size:12px;color:#6b7280;">${meta.fecha || ''}</div>
            <div style="margin:6px 0;">${meta.descripcion || ''}</div>
            <div style="font-size:12px;"><b>Participantes:</b> ${meta.participantes.join(', ')}</div>
            <div style="font-size:12px;"><b>Longitud:</b> ${distanciaKm} km</div>
            <div style="font-size:12px;"><b>Desnivel:</b> ${desnivelM} m</div>
            <div style="font-size:12px;"><b>Duración total:</b> ${duracionTotalStr}</div>
            ${meta.relive ? `<div style="margin-top:4px;"><a href="${meta.relive}" target="_blank">Ver en Relive</a></div>` : ''}
          </div>
        `;

                e.target.bindPopup(popupHtml);
            });

            gpx.on('error', function () {
                console.error('Error cargando GPX', meta.archivo);
            });

            layersById.set(id, { gpxLayer: gpx, meta, bounds: null });
            gpx.addTo(map);
        });

        buildParticipantsFilter(people);
        updateVisibility();        
    })
    .catch(err => {
        console.error('No se pudo cargar data.json', err);
        alert('No se pudo cargar data.json. Asegúrate de servir los archivos vía HTTP (GitHub Pages o un servidor local).');
    });
