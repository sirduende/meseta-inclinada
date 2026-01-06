// main2026.js
import { rutasSecundarias } from './rutasSecundarias.js?v=20260106';


// 🏔️ Lista de cumbres del reto FDMESCYL
const cumbresFDMESCYL = [
    { nombre: "01 Peña Trevinca", lat: 42.24278, lng: -6.79611 },
    { nombre: "02 Miravalles", lat: 42.88019, lng: -6.77764 },
    { nombre: "03 Catoute", lat: 42.80144, lng: -6.32146 },
    { nombre: "04 Cornón de Peñarrubia", lat: 43.02848, lng: -6.30648 },
    { nombre: "05 Peña Orniz", lat: 43.02426, lng: -6.12095 },
    { nombre: "06 Peña Ubiña", lat: 43.01834, lng: -5.95673 },
    { nombre: "07 Peña la Cruz", lat: 43.03131, lng: -5.19122 },
    { nombre: "08 Peña Ten", lat: 43.10349, lng: -5.14182 },
    { nombre: "09 Peña Santa", lat: 43.20195, lng: -4.96219 },
    { nombre: "10 Torre Bermeja", lat: 43.17306, lng: -4.95091 },
    { nombre: "11 Torre del Friero", lat: 43.15727, lng: -4.87524 },
    { nombre: "12 Llambrión", lat: 43.17327, lng: -4.85700 },
    { nombre: "13 Torrecerredo", lat: 43.19776, lng: -4.85287 },
    { nombre: "14 Espigüete", lat: 42.94461, lng: -4.79622 },
    { nombre: "15 Peña Prieta", lat: 43.02385, lng: -4.73001 },
    { nombre: "16 Curavacas", lat: 42.97635, lng: -4.67397 },
    { nombre: "17 San Millán", lat: 42.23190, lng: -3.20630 },
    { nombre: "18 Urbión", lat: 42.01144, lng: -2.87849 },
    { nombre: "19 Moncayo", lat: 41.78717, lng: -1.83969 },
    { nombre: "20 Pico del Lobo", lat: 41.18319, lng: -3.46628 },
    { nombre: "21 Peñalara", lat: 40.85001, lng: -3.95601 },
    { nombre: "22 La Pinareja", lat: 40.81005, lng: -4.09429 },
    { nombre: "23 El Torozo", lat: 40.31771, lng: -4.98664 },
    { nombre: "24 Torreón de los Galayos", lat: 40.26204, lng: -5.17187 },
    { nombre: "25 La Mira", lat: 40.25990, lng: -5.18253 },
    { nombre: "26 Almanzor", lat: 40.24606, lng: -5.29750 },
    { nombre: "27 La Covacha", lat: 40.21662, lng: -5.59881 },
    { nombre: "28 La Serrota", lat: 40.49926, lng: -5.07869 },
    { nombre: "29 El Torreón de Béjar", lat: 40.29217, lng: -5.74084 },
    { nombre: "30 Castro Valnera", lat: 43.14585, lng: -3.68190 }
];

function distanciaKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pintarTodosLosRadars(cumbres) {
    cumbres.forEach((cumbre, index) => {
        const { lat, lng, nombre } = cumbre;

        // 🔘 Radar de 5 km
        L.circle([lat, lng], {
            radius: 8000,
            color: '#f97316',
            fillColor: '#f97316',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(map);

        // 🔵 Marcador numerado
        const marcador = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'route-number-icon',
                html: `<div class="route-number-circle-candidate">${index + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 35]
            })
        }).addTo(map);

        // 📍 Cumbres cercanas
        const cercanas = cumbres
            .filter((otra, i) => i !== index && distanciaKm(lat, lng, otra.lat, otra.lng) <= 10)
            .map(otra => otra.nombre);

        let popup = `<strong>${nombre}</strong><br>Cumbre #${index + 1}`;
        if (cercanas.length > 0) {
            popup += `<br><span style="color:#f97316;">🟠 Dentro del radar:</span><br>${cercanas.join(', ')}`;
        }

        marcador.bindPopup(popup);
    });
}

function getDificultadVisual(dificultad) {
    const niveles = {
        "Fácil": { icono: "🟢", color: "#22c55e" },
        "Moderada": { icono: "🟠", color: "#f97316" },
        "Difícil": { icono: "🔴", color: "#ef4444" },
        "Muy difícil": { icono: "⚫", color: "#1f2937" }
    };
    return niveles[dificultad] || { icono: "⚪", color: "#6b7280" };
}

function cargarRutaSecundaria(meta) {
    const {
        nombreRuta,
        cumbrePrincipal,
        dificultad,
        añoRuta,
        enlaceWikiloc,
        archivoGPX,
        propuestoPor
    } = meta;

    const visual = getDificultadVisual(dificultad);

    const gpx = new L.GPX(archivoGPX, {
        async: true,
        polyline_options: { color: visual.color, weight: 4, opacity: 0.9 },
        marker_options: { startIconUrl: '', endIconUrl: '', shadowUrl: '' }
    });

    gpx.on('loaded', function (e) {
        const distanciaKm = (e.target.get_distance() / 1000).toFixed(2);
        const desnivelM = Math.round(e.target.get_elevation_gain());

        const esFueraDeReto = cumbrePrincipal === "Fuera de Reto";

        let popupHtml = `
          <div>
            <div style="font-weight:600;margin-bottom:4px;">${nombreRuta}</div>
            <div style="font-size:12px;color:#6b7280;">
              ${esFueraDeReto ? "Ruta fuera de reto Secundarias" : `Secundario de: ${cumbrePrincipal}`}
            </div>
            <div style="margin:6px 0;">
              <b>Longitud:</b> ${distanciaKm} km<br>
              <b>Desnivel acumulado:</b> ${desnivelM} m<br>
              <b>Dificultad:</b> <span style="color:${visual.color};">${visual.icono} ${dificultad}</span>
            </div>
            <div style="font-size:12px;color:#6b7280;">Propuesto por ${propuestoPor || "—"}</div>
            <div style="margin-top:4px;">
              <a href="${archivoGPX}" download>📥 Descargar GPX</a>
            </div>
            <div style="margin-top:4px;">
              <a href="${enlaceWikiloc}" target="_blank">🌐 Ver en Wikiloc (${añoRuta})</a>
            </div>
          </div>
        `;


        if (meta.aviso) {
            popupHtml += `
        <div style="margin-top:6px;color:#ef4444;font-weight:bold;">
          ${meta.aviso}
        </div>
      `;
        }

        popupHtml += `</div>`;

        const startLatLng = e.target.getLayers()[0]?.getLatLngs()[0];
        if (startLatLng) {
            const marker = L.marker(startLatLng, {
                icon: L.divIcon({
                    className: 'route-number-icon',
                    html: esFueraDeReto
                        ? `<div class="route-number-circle" style="background:#facc15;">F</div>`
                        : `<div class="route-number-circle">S</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 35]
                })
            }).addTo(map);
            marker.bindPopup(popupHtml);
        }

        e.target.bindPopup(popupHtml);
        e.target.addTo(map);
    });

    gpx.on('error', () => console.error(`Error cargando GPX: ${archivoGPX}`));
}



document.addEventListener('DOMContentLoaded', () => {
    window.map = L.map('map').setView([42.5, -4.5], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    pintarTodosLosRadars(cumbresFDMESCYL);

    rutasSecundarias.forEach(meta => cargarRutaSecundaria(meta));

});