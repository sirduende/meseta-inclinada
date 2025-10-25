﻿// main2026.js


// 🏔️ Lista de cumbres del reto FDMESCYL
const cumbresFDMESCYL = [
    { nombre: "Peña Trevinca", lat: 42.24278, lng: -6.79611 },
    { nombre: "Miravalles", lat: 42.88019, lng: -6.77764 },
    { nombre: "Catoute", lat: 42.80144, lng: -6.32146 },
    { nombre: "Cornón de Peñarrubia", lat: 43.02889, lng: -6.31122 },
    { nombre: "Peña Orniz", lat: 43.03000, lng: -6.29700 },
    { nombre: "Peña Ubiña", lat: 43.01910, lng: -5.95691 },
    { nombre: "Peña la Cruz", lat: 43.05028, lng: -5.21500 },
    { nombre: "Peña Ten", lat: 43.11694, lng: -5.11694 },
    { nombre: "Torre Santa", lat: 43.18750, lng: -4.87500 },
    { nombre: "La Bermeja", lat: 43.18333, lng: -4.88500 },
    { nombre: "Torre del Friero", lat: 43.15728, lng: -4.87518 },
    { nombre: "Llambrión", lat: 43.17083, lng: -4.82361 },
    { nombre: "Torrecerredo", lat: 43.19782, lng: -4.85292 },
    { nombre: "Espigüete", lat: 42.94472, lng: -4.79611 },
    { nombre: "Peña Prieta", lat: 42.97920, lng: -4.66833 },
    { nombre: "Curavacas", lat: 42.97632, lng: -4.67401 },
    { nombre: "San Millán", lat: 42.23157, lng: -3.20633 },
    { nombre: "Urbión", lat: 42.11694, lng: -2.84167 },
    { nombre: "Moncayo", lat: 41.79278, lng: -1.83333 },
    { nombre: "Pico del Lobo", lat: 41.21111, lng: -3.48750 },
    { nombre: "Peñalara", lat: 40.78528, lng: -3.95556 },
    { nombre: "La Pinareja", lat: 40.80000, lng: -4.00000 },
    { nombre: "El Torozo", lat: 40.28333, lng: -5.15000 },
    { nombre: "Torreón de los Galayos", lat: 40.25167, lng: -5.17417 },
    { nombre: "La Mira", lat: 40.25833, lng: -5.24167 },
    { nombre: "Almanzor", lat: 40.24603, lng: -5.29748 },
    { nombre: "La Covacha", lat: 40.24722, lng: -5.31667 },
    { nombre: "La Serrota", lat: 40.51667, lng: -5.23333 },
    { nombre: "El Torreón de Béjar", lat: 40.38333, lng: -5.75000 },
    { nombre: "Castro Valnera", lat: 43.15030, lng: -3.65170 }
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

function cargarRutaSecundaria(meta) {
    const {
        nombreRuta,
        cumbrePrincipal,
        dificultad,
        colorDificultad,
        iconoDificultad,
        añoRuta,
        enlaceWikiloc,
        archivoGPX
    } = meta;

    const gpx = new L.GPX(archivoGPX, {
        async: true,
        polyline_options: { color: colorDificultad, weight: 4, opacity: 0.9 },
        marker_options: { startIconUrl: '', endIconUrl: '', shadowUrl: '' }
    });

    gpx.on('loaded', function (e) {
        const distanciaKm = (e.target.get_distance() / 1000).toFixed(2);
        const desnivelM = Math.round(e.target.get_elevation_gain());

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

    gpx.on('error', () => console.error(`Error cargando GPX: ${archivoGPX}`));
}


document.addEventListener('DOMContentLoaded', () => {
    window.map = L.map('map').setView([42.5, -4.5], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    pintarTodosLosRadars(cumbresFDMESCYL);

    cargarRutaSecundaria({
        nombreRuta: "Pico Picón",
        cumbrePrincipal: "Peña Trevinca",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2022,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/picon-2079-m-pena-vidulante-2053-m-y-pena-surbia-2116-m-desde-alto-canteras-de-la-bana-leon-100675892",
        archivoGPX: "gpx2026/01_picon.gpx"
    });

    cargarRutaSecundaria({
        nombreRuta: "Botete desde el castro de Chano",
        cumbrePrincipal: "Miravalles",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2024,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/botete-desde-el-castro-de-chano-188183488",
        archivoGPX: "gpx2026/02_botete.gpx"
    });

    cargarRutaSecundaria({
        nombreRuta: "Valdiciervo, Valdoso, La Peñona y Tambaron",
        cumbrePrincipal: "Catoute",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2021,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/valdiciervo-1828-valdoso-2009-la-penona-2097-y-tambaron-2102-desde-fasgar-leon-79823426",
        archivoGPX: "gpx2026/03_valdiciervo.gpx"
    });

});