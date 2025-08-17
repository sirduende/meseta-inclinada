// ❌ No importamos Leaflet
// ✅ Usamos directamente L.GPX

import { map, layersById, setAllBounds } from './map.js';
import { addRouteToList } from './ui.js';
import { colorForIndex, formatDuracion, intersects } from './utils.js';

export async function loadRoutes() {
    const response = await fetch('data.json');
    const data = await response.json();

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

            let union = boundsAccumulator[0];
            for (let i = 1; i < boundsAccumulator.length; i++) {
                union = union.extend(boundsAccumulator[i]);
            }
            setAllBounds(union);

            const distanciaKm = (e.target.get_distance() / 1000).toFixed(2);
            const desnivelM = e.target.get_elevation_gain().toFixed(0);

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

        gpx.on('error', () => console.error('Error cargando GPX', meta.archivo));
        layersById.set(id, { gpxLayer: gpx, meta, bounds: null });
        gpx.addTo(map);
    });

    return people;
}
