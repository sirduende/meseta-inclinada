// main2026.js


// 🏔️ Lista de cumbres del reto FDMESCYL
const cumbresFDMESCYL = [
    { nombre: "Peña Trevinca", lat: 42.242778, lng: -6.796111 },
    { nombre: "Miravalles", lat: 42.85694, lng: -6.93361 },
    { nombre: "Catoute", lat: 42.783611, lng: -6.335278 },
    { nombre: "Cornón de Peñarrubia", lat: 43.026389, lng: -6.406111 },
    { nombre: "Peña Orniz", lat: 43.030278, lng: -6.297222 },
    { nombre: "Peña Ubiña", lat: 42.995278, lng: -5.984167 },
    { nombre: "Peña la Cruz", lat: 43.050278, lng: -5.215000 },
    { nombre: "Peña Ten", lat: 43.116111, lng: -5.116111 },
    { nombre: "Torre Santa", lat: 43.187222, lng: -4.875000 },
    { nombre: "La Bermeja", lat: 43.183056, lng: -4.885000 },
    { nombre: "Torre del Friero", lat: 43.145000, lng: -4.837222 },
    { nombre: "Llambrión", lat: 43.170000, lng: -4.823056 },
    { nombre: "Torrecerredo", lat: 43.19782, lng: -4.85292 },
    { nombre: "Espigüete", lat: 42.883056, lng: -4.693056 },
    { nombre: "Peña Prieta", lat: 42.936111, lng: -4.722222 },
    { nombre: "Curavacas", lat: 42.882778, lng: -4.781111 },
    { nombre: "San Millán", lat: 42.216389, lng: -3.050000 },
    { nombre: "Urbión", lat: 42.066667, lng: -2.850000 },
    { nombre: "Moncayo", lat: 41.796112, lng: -1.822902 },
    { nombre: "Pico del Lobo", lat: 41.150000, lng: -3.416667 },
    { nombre: "Peñalara", lat: 40.844167, lng: -3.958333 },
    { nombre: "La Pinareja", lat: 40.800000, lng: -4.000000 },
    { nombre: "El Torozo", lat: 40.283333, lng: -5.150000 },
    { nombre: "Torreón de los Galayos", lat: 40.251667, lng: -5.174167 },
    { nombre: "La Mira", lat: 40.258333, lng: -5.241667 },
    { nombre: "Almanzor", lat: 40.246030, lng: -5.297481 },
    { nombre: "La Covacha", lat: 40.247222, lng: -5.316667 },
    { nombre: "La Serrota", lat: 40.516667, lng: -5.233333 },
    { nombre: "El Torreón de Béjar", lat: 40.383333, lng: -5.750000 },
    { nombre: "Castro Valnera", lat: 43.150300, lng: -3.651700 }
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
            radius: 5000,
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

function cargarRutaPicon() {
    const urlGPX = 'gpx2026/01_picon.gpx';
    const enlaceWikiloc = 'https://es.wikiloc.com/rutas-senderismo/picon-2079-m-pena-vidulante-2053-m-y-pena-surbia-2116-m-desde-alto-canteras-de-la-bana-leon-100675892';
    const añoRuta = 2022;
    const dificultad = 'Moderada'; // Asignada manualmente
    const colorDificultad = '#f97316'; // Naranja
    const iconoDificultad = '🟠';

    const gpx = new L.GPX(urlGPX, {
        async: true,
        polyline_options: { color: colorDificultad, weight: 4, opacity: 0.9 },
        marker_options: { startIconUrl: '', endIconUrl: '', shadowUrl: '' }
    });

    gpx.on('loaded', function (e) {
        const distanciaKm = (e.target.get_distance() / 1000).toFixed(2);
        const desnivelM = Math.round(e.target.get_elevation_gain());

        const nombreRuta = "Pico Picón";
        const cumbrePrincipal = "Peña Trevinca";

        const popupHtml = `
            <div>
                <div style="font-weight:600;margin-bottom:4px;">${nombreRuta}</div>
                <div style="font-size:12px;color:#6b7280;">Secundario de: ${cumbrePrincipal}</div>
                <div style="margin:6px 0;">
                    <b>Longitud:</b> ${distanciaKm} km<br>
                    <b>Desnivel acumulado:</b> ${desnivelM} m<br>
                    <b>Dificultad:</b> <span style="color:${colorDificultad};">${iconoDificultad} ${dificultad}</span>
                </div>
                <div style="font-size:12px;color:#6b7280;">Propuesto por Dani</div>
                <div style="margin-top:6px;">
                    <a href="${enlaceWikiloc}" target="_blank">🌐 Ver en Wikiloc (${añoRuta})</a>
                </div>
            </div>
        `;

        const startLatLng = e.target.getLayers()[0]?.getLatLngs()[0];
        if (startLatLng) {
            const marker = L.marker(startLatLng, {
                icon: L.divIcon({
                    className: 'route-number-icon',
                    html: `<div class="route-number-circle">P</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 35]
                })
            }).addTo(map);
            marker.bindPopup(popupHtml);
        }

        e.target.bindPopup(popupHtml);
        e.target.addTo(map);
    });

    gpx.on('error', () => console.error('Error cargando GPX: 01_picon.gpx'));
}


document.addEventListener('DOMContentLoaded', () => {
    window.map = L.map('map').setView([42.5, -4.5], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    pintarTodosLosRadars(cumbresFDMESCYL);
    cargarRutaPicon(); 
});