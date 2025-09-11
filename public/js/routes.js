// ❌ No importamos Leaflet
// ✅ Usamos directamente L.GPX

import { map, layersById, setAllBounds } from './map.js';
import { addRouteToList } from './ui.js';
import { colorForIndex, formatDuracion } from './utils.js';
import { getRutas, getGPXUrl } from './firebase.js';

function getDifficulty(meta, distanciaKm, desnivelM) {

    const dificultad = meta.dificultad;

    const nombre = meta.nombre.toLowerCase();
    const dist = parseFloat(distanciaKm);
    const desn = parseFloat(desnivelM);

    if (nombre.includes("ferrata")) {
        return { color: "black", nivel: "Ferrata" };
    }
    if (dificultad == "Alta" || dist > 20 || desn > 1500) {
        return { color: "red", nivel: "Alta" };
    }
    if (dist < 12 && desn < 1000) {
        return { color: "green", nivel: "Baja" };
    }
    return { color: "#f97316", nivel: "Media" }; // naranja suave
}


export async function loadRoutes() {

    console.log("Cargando rutas");

    const data = await getRutas();

    // Ahora 'data' es tu array de rutas, igual que antes
    console.log("Rutas cargadas");

    const total = data.length;

    const people = new Set();
    const boundsAccumulator = [];

    //Rellenar urls
    for (const ruta of data) {
        ruta.url = await getGPXUrl(ruta.archivo);
    }

    data.forEach((meta, idx) => {
        
        // Guardar el índice en el mapa para usarlo luego y evitar errores de asincronía
        const id = meta.id || meta.archivo;
        const displayIndex = total - idx - 1;
        layersById.set(id, { meta, displayIndex, gpxLayer: null, bounds: null });        

        meta.participantes.forEach(p => people.add(p));        

        const gpx = new L.GPX(meta.url, {
            async: true,
            polyline_options: {
                color: 'gray', // inicial neutro, luego lo ajustamos
                weight: 4,
                opacity: 0.9
            },
            marker_options: {
                startIconUrl: '',
                endIconUrl: '',
                shadowUrl: ''
            }
        });

        gpx.on('loaded', function (e) {

            const entry = layersById.get(id);
            const idx = entry.displayIndex;

            const polyline = e.target.getLayers().find(l => l instanceof L.Polyline);

            if (polyline) {
                // marcador con número
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
                    if (entry?.gpxLayer) {
                        entry.gpxLayer.openPopup();
                    }
                });
            }

            const b = e.target.getBounds();
            layersById.get(id).bounds = b;
            boundsAccumulator.push(b);

            let union = boundsAccumulator[0];
            for (let i = 1; i < boundsAccumulator.length; i++) {
                union = union.extend(boundsAccumulator[i]);
            }
            setAllBounds(union);

            const distanciaKm = (e.target.get_distance() / 1000).toFixed(2);
            const desnivelM = e.target.get_elevation_gain().toFixed(0);

            // ✅ aplicar color en función de dificultad
            const { color: difficultyColor, nivel } = getDifficulty(meta, distanciaKm, desnivelM);

            // aplicar estilo al polyline
            if (polyline) {
                polyline.setStyle({ color: difficultyColor });
            }

            addRouteToList(id, meta, idx, difficultyColor, nivel);

            let durTotalS = e.target.get_total_time();
            let durMovS = e.target.get_moving_time();

            const maxSegundosRazonable = 24 * 3600;
            if (durTotalS > maxSegundosRazonable || durMovS > maxSegundosRazonable) {
                const velocidadMediaKmH = 4.5;
                const durH = distanciaKm / velocidadMediaKmH;
                durTotalS = durH * 3600;
                durMovS = durH * 3600;
            }

            const duracionTotalStr = formatDuracion(durTotalS);

            const popupHtml = `
                <div>
                    <div style="font-weight:600;margin-bottom:4px;">${meta.nombre}</div>
                    <div style="font-size:12px;color:#6b7280;">${meta.fecha || ''}</div>
                    <div style="margin:6px 0;">${meta.descripcion || ''}</div>
                    <div style="font-size:12px;"><b>Participantes:</b> ${meta.participantes.join(', ')}</div>
                    <div style="font-size:12px;"><b>Longitud:</b> ${distanciaKm} km</div>
                    <div style="font-size:12px;"><b>Desnivel:</b> ${desnivelM} m</div>
                    <div style="font-size:12px;"><b>Duración total:</b> ${duracionTotalStr}</div>
                    <div style="font-size:12px;"><b>Nivel:</b> ${nivel}</div>
                    ${meta.relive ? `<div style="margin-top:4px;"><a href="${meta.relive}" target="_blank">Ver en Relive</a></div>` : ''}
                </div>
            `;
            e.target.bindPopup(popupHtml);
        });

        gpx.on('error', () => console.error('Error cargando GPX', meta.archivo));

        const entry = layersById.get(id);
        entry.gpxLayer = gpx;
        entry.bounds = null;

        gpx.addTo(map);
    });

    return people;
}
