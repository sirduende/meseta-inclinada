// script.js
const map = L.map('map').setView([42.9, -4.3], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap'
}).addTo(map);

const layersById = new Map();
const peaksLayer = L.layerGroup().addTo(map);

// Distancia máxima de un pico a la ruta (en metros)
const MAX_PEAK_DISTANCE = 200;

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const people = new Set();

    data.forEach(meta => {
      const id = meta.id;
      const gpx = new L.GPX(`gpx/${meta.archivo}`, {
        async: true,
        marker_options: { startIcon: null, endIcon: null }
      });

      gpx.on('loaded', e => {
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

        // Guardamos bounds para esta ruta
        const bounds = e.target.getBounds();
        layersById.set(id, { gpxLayer: gpx, meta, bounds });

        // Buscar picos dentro de los bounds de la ruta
        fetchPeaks(bounds, e.target);
      });

      gpx.on('error', function() {
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


// ---------- NUEVO: Cargar picos de OSM ----------
async function fetchPeaks(bounds, gpxLayer) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  // Consulta Overpass: nodos natural=peak en el bounding box
  const query = `
    [out:json][timeout:25];
    node["natural"="peak"](${sw.lat},${sw.lng},${ne.lat},${ne.lng});
    out;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    const data = await res.json();

    data.elements.forEach(el => {
      const latlng = [el.lat, el.lon];
      const name = el.tags?.name || 'Pico sin nombre';
      const ele = el.tags?.ele ? `${el.tags.ele} m` : '';

      // Filtrar por distancia real al track
      if (!isNearTrack(latlng, gpxLayer, MAX_PEAK_DISTANCE)) return;

      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'peak-label',
          html: `<div style="background:white;padding:2px 4px;border-radius:4px;border:1px solid #999;font-size:11px;">
                  ⛰ ${name} ${ele}
                </div>`,
          iconSize: null
        })
      });

      marker.addTo(peaksLayer);
    });
  } catch (err) {
    console.error('Error consultando Overpass API', err);
  }
}

// Función para comprobar si un punto está cerca de la ruta
function isNearTrack(latlng, gpxLayer, maxDist) {
  const line = gpxLayer.getLayers().find(l => l instanceof L.Polyline);
  if (!line) return false;

  const point = L.latLng(latlng);
  const lineLatLngs = line.getLatLngs();

  for (let i = 0; i < lineLatLngs.length - 1; i++) {
    const segStart = lineLatLngs[i];
    const segEnd = lineLatLngs[i + 1];
    const dist = L.GeometryUtil.distanceSegment(map, point, segStart, segEnd);
    if (dist <= maxDist) return true;
  }
  return false;
}