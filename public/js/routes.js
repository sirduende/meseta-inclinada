import { map, layersById, setAllBounds } from './map.js';
import { addRouteToList } from './ui.js';
import { enriquecerListado } from './routes-view-model.js';
import { getRutas, getGPXUrl } from './firebase.js';

function mostrarListadoLateral(rutasRenderizadas) {
    rutasRenderizadas
        .sort((a, b) => b.index - a.index)
        .forEach(r => {
            addRouteToList(r.id || r.archivo, r);
        });
}

export async function loadRoutes() {
    console.log("Cargando rutas");

    const data = await getRutas();
    const totalRutas = data.length;
    let rutasCargadas = 0;
    const loadingStatus = document.getElementById("loading-status");
    loadingStatus.textContent = `🔄 Recopilando datos`;

    const people = new Set();
    const boundsAccumulator = [];
    const gpxStatsPorId = {};
    const rutasRenderizadas = [];

    for (let idx = 0; idx < data.length; idx++) {
        const meta = data[idx];
        const id = meta.id || meta.archivo;
        const displayIndex = data.length - idx - 1;
        meta.index = displayIndex;

        loadingStatus.textContent = `🔄 Cargando ruta ${idx + 1} de ${data.length}: ${meta.nombre}`;

        const url = await getGPXUrl(meta.archivo);
        meta.url = url;

        layersById.set(id, { meta, displayIndex, gpxLayer: null, bounds: null });
        meta.participantes.forEach(p => people.add(p));

        const gpx = new L.GPX(url, {
            async: true,
            polyline_options: { color: 'gray', weight: 4, opacity: 0.9 },
            marker_options: { startIconUrl: '', endIconUrl: '', shadowUrl: '' }
        });

        gpx.on('loaded', function (e) {
  
            const distanciaKm = e.target.get_distance() / 1000;
            const desnivelM = e.target.get_elevation_gain();
            let durTotalS = e.target.get_total_time();
            let durMovS = e.target.get_moving_time();

            gpxStatsPorId[id] = {
                distanciaKm,
                desnivelM,
                duracionTotalS: durTotalS,
                duracionMovS: durMovS
            };

            const enriched = enriquecerListado([meta], gpxStatsPorId)[0];
            rutasRenderizadas.push(enriched);
            rutasCargadas++;

            if (rutasCargadas === totalRutas) {
                mostrarListadoLateral(rutasRenderizadas);
            }

            const polyline = e.target.getLayers().find(l => l instanceof L.Polyline);
            if (polyline) {
                const startLatLng = polyline.getLatLngs()[0];
                const numberMarker = L.marker(startLatLng, {
                    icon: L.divIcon({
                        className: 'route-number-icon',
                        html: `<div class="route-number-circle">${displayIndex + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 35]
                    })
                });
                numberMarker.addTo(map);
                numberMarker.on('click', () => {
                    const entry = layersById.get(id);
                    if (entry?.gpxLayer) entry.gpxLayer.openPopup();
                });

                polyline.setStyle({ color: enriched.color });
            }

            const b = e.target.getBounds();
            layersById.get(id).bounds = b;
            boundsAccumulator.push(b);

            let union = boundsAccumulator[0];
            for (let i = 1; i < boundsAccumulator.length; i++) {
                union = union.extend(boundsAccumulator[i]);
            }
            setAllBounds(union);

            const popupHtml = `
                <div>
                    <div style="font-weight:600;margin-bottom:4px;">${enriched.nombre}</div>
                    <div style="font-size:12px;color:#6b7280;">${enriched.fecha || ''}</div>
                    <div style="margin:6px 0;">${enriched.descripcion || ''}</div>
                    <div style="font-size:12px;"><b>Participantes:</b> ${enriched.participantes.join(', ')}</div>
                    <div style="font-size:12px;"><b>Longitud:</b> ${enriched.distanciaKm} km</div>
                    <div style="font-size:12px;"><b>Desnivel:</b> ${enriched.desnivelM} m</div>
                    <div style="font-size:12px;"><b>Duración total:</b> ${enriched.duracionFormateada}</div>
                    <div style="font-size:12px;"><b>Nivel:</b> ${enriched.nivel}</div>
                    ${enriched.relive ? `<div style="margin-top:4px;"><a href="${enriched.relive}" target="_blank">Ver en Relive</a></div>` : ''}
                </div>
            `;
            e.target.bindPopup(popupHtml);
        });

        gpx.on('error', () => console.error('Error cargando GPX', meta.archivo));

        layersById.get(id).gpxLayer = gpx;
        gpx.addTo(map);
    }

    loadingStatus.textContent = `✅ Rutas cargadas`; 

    return people;
}
