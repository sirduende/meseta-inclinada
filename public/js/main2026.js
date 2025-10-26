// main2026.js


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
    { nombre: "Torrecerredo", lat: 43.19782, lng: -4.85292 },
    { nombre: "Espigüete", lat: 42.94472, lng: -4.79611 },
    { nombre: "Peña Prieta", lat: 42.97920, lng: -4.66833 },
    { nombre: "Curavacas", lat: 42.97632, lng: -4.67401 },
    { nombre: "17 San Millán", lat: 42.23190, lng: -3.20630 },
    { nombre: "18 Urbión", lat: 42.01144, lng: -2.87849 },
    { nombre: "19 Moncayo", lat: 41.78717, lng: -1.83969 },
    { nombre: "20 Pico del Lobo", lat: 41.18319, lng: -3.46628 },
    { nombre: "21 Peñalara", lat: 40.85001, lng: -3.95601 },
    { nombre: "22 La Pinareja", lat: 40.81005, lng: -4.09429 },
    { nombre: "El Torozo", lat: 40.28333, lng: -5.15000 },
    { nombre: "Torreón de los Galayos", lat: 40.25167, lng: -5.17417 },
    { nombre: "La Mira", lat: 40.25833, lng: -5.24167 },
    { nombre: "Almanzor", lat: 40.24603, lng: -5.29748 },
    { nombre: "La Covacha", lat: 40.24722, lng: -5.31667 },
    { nombre: "La Serrota", lat: 40.51667, lng: -5.23333 },
    { nombre: "29 El Torreón de Béjar", lat: 40.29217, lng: -5.74084 },
    { nombre: "30 Castro Valnera", lat: 43.14585, lng: -3.68190 }
];

const rutasSecundarias = [
    {
        nombreRuta: "Pico Picón",
        cumbrePrincipal: "01 Peña Trevinca",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2022,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/picon-2079-m-pena-vidulante-2053-m-y-pena-surbia-2116-m-desde-alto-canteras-de-la-bana-leon-100675892",
        archivoGPX: "gpx2026/01_picon.gpx"
    },
    {
        nombreRuta: "Botete desde el castro de Chano",
        cumbrePrincipal: "02 Miravalles",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2024,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/botete-desde-el-castro-de-chano-188183488",
        archivoGPX: "gpx2026/02_botete.gpx"
    },
    {
        nombreRuta: "Valdiciervo, Valdoso, La Peñona y Tambaron",
        cumbrePrincipal: "03 Catoute",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2021,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/valdiciervo-1828-valdoso-2009-la-penona-2097-y-tambaron-2102-desde-fasgar-leon-79823426",
        archivoGPX: "gpx2026/03_valdiciervo.gpx"
    },
    {
        nombreRuta: "De Genestoso a Cogollo de Cebolledo",
        cumbrePrincipal: "04 Cornón de Peñarrubia",
        dificultad: "Difícil",
        colorDificultad: "#ef4444",
        iconoDificultad: "🟠",
        añoRuta: 2022,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/de-genestoso-a-cogollo-de-cebolledo-2-084-cangas-del-narcea-somiedo-101911817",
        archivoGPX: "gpx2026/04_cebolledo.gpx"
    },
    {
        nombreRuta: "El Puerto - Cornón - Penouta - Las Camposas - El Puerto",
        cumbrePrincipal: "04 Cornón de Peñarrubia",
        dificultad: "Difícil",
        colorDificultad: "#ef4444",
        iconoDificultad: "🔴",
        añoRuta: 2022,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-alpinismo/ruta-el-puerto-cornon-penouta-las-camposas-el-puerto-29953442",
        archivoGPX: "gpx2026/04_cornon.gpx",
        aviso: "⚠️ Tramos expuestos: no recomendable para personas con vértigo"
    },
    {
        nombreRuta: "Ascensión a La Cervata y Laguna Las Verdes desde Torre de Babiao",
        cumbrePrincipal: "05 Peña Orniz",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2022,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/ascension-a-la-cervata-2088-msnm-desde-torre-de-babia-100247962",
        archivoGPX: "gpx2026/05_cervata.gpx",
        aviso: "⚠️ Trepadas a priori sencillas"
    },
    {
        nombreRuta: "Peña Cerreos desde Torrebarrio",
        cumbrePrincipal: "06 Peña Ubiña",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2019,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/pena-cerreos-desde-torrebarrio-36834041",
        archivoGPX: "gpx2026/06_cerreos.gpx",
        aviso: "Verificada en 2025 por otro usuario"
    },
    {
        nombreRuta: "Peña Brava (Macizo del Mampodre)",
        cumbrePrincipal: "07 Peña la Cruz",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2015,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/pena-brava-macizo-del-mampodre-11644451",
        archivoGPX: "gpx2026/07_brava.gpx",
        aviso: "Verificada en 2025. Descenso sin senda"
    },
    {
        nombreRuta: "Peña Pileñes desde la Uña",
        cumbrePrincipal: "08 Peña Ten",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2019,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/la-pena-pilenes-desde-la-una-circular-41592654",
        archivoGPX: "gpx2026/08_pilenes.gpx",
        aviso: "Verificada en 2021. Poco actualizada"
    },
    {
        nombreRuta: "El requexón",
        cumbrePrincipal: "09 Peña Santa",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2016,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/el-requexon-13941295",
        archivoGPX: "gpx2026/09_requexon.gpx",
        aviso: "Sin comentarios ni revisiones. Buzón en cima"
    },
    {
        nombreRuta: "Collado Pambuches desde Posada de Valdeon",
        cumbrePrincipal: "10 Torre Bermeja",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2020,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/2020-09-06-la-travesona-desde-posada-de-valdeon-55952382",
        archivoGPX: "gpx2026/10_pambuches.gpx"
    },
    {
        nombreRuta: "Peña Remona",
        cumbrePrincipal: "11 Torre del Friero",
        dificultad: "Difícil",
        colorDificultad: "#ef4444",
        iconoDificultad: "🔴",
        añoRuta: 2019,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/pico-san-carlos-sagrado-corazon-macizo-de-andara-41008792",
        archivoGPX: "gpx2026/11_pena_remona.gpx"
    },
    {
        nombreRuta: "Cabeza Guilez y Mojón Alto",
        cumbrePrincipal: "17 San Millán",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2017,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/cabeza-aguilez-mojon-alto-remendia-sierra-de-la-demanda-18225576",
        archivoGPX: "gpx2026/17_mojon_alto.gpx"
    },   
    {
        nombreRuta: "Peñas Claras, Picacho, Tres Provincias y Urbión",
        cumbrePrincipal: "18 Urbión",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2024,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/pico-urbion-2228m-penas-claras-2168m-picacho-camperon-2101m-pico-las-tres-provincias-2069m-desde-c-171817551",
        archivoGPX: "gpx2026/18_penas_claras.gpx"
    },  
    {
        nombreRuta: "Lobera. Subida desde Beratón",
        cumbrePrincipal: "19 Moncayo",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2018,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/alto-del-moncayo-lobera-subida-desde-beraton-cabezo-del-cahiz-y-regreso-por-collado-bellido-y-gr-90-24229735",
        archivoGPX: "gpx2026/19_lobera.gpx"
    },  
    {
        nombreRuta: "Picos el Cervunal y los Picachos",
        cumbrePrincipal: "20 Pico del Lobo",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2024,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/picos-el-cervunal-y-los-picachos-desde-rosuero-por-la-canada-real-soriana-occidental-el-gr-88-y-la-176340865",
        archivoGPX: "gpx2026/20_picachos.gpx"
    },  
    {
        nombreRuta: "Peña Citores por Senda del Batallón Alpino",
        cumbrePrincipal: "21 Peñalara",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2019,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/pena-citores-por-senda-del-batallon-alpino-refugio-citores-mirador-del-cancho-fuente-de-la-peseta-d-32362419",
        archivoGPX: "gpx2026/21_citores.gpx"
    },  
    {
        nombreRuta: "Peña del Oso desde las Dehesas de Cercedilla",
        cumbrePrincipal: "22 La Pinareja",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2013,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/pena-del-oso-2-196-m-desde-las-dehesas-de-cercedilla-paso-por-la-pinareja-3877388",
        archivoGPX: "gpx2026/22_oso.gpx"
    }, 
    {
        nombreRuta: "Calvitero y Canchal de la Ceja",
        cumbrePrincipal: "29 Torreón de Béjar",
        dificultad: "Fácil",
        colorDificultad: "#10b981",
        iconoDificultad: "🟢",
        añoRuta: 2020,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/calvitero-y-canchal-de-la-ceja-desde-plataforma-del-travieso-circular-55794170",
        archivoGPX: "gpx2026/29_calvitero.gpx",
        aviso: "Es posible alargar, pero con un diseñador de rutas"
    },     
    {
        nombreRuta: "Picon del Fraile",
        cumbrePrincipal: "30 Castro Valnera",
        dificultad: "Fácil",
        colorDificultad: "#10b981",
        iconoDificultad: "🟢",
        añoRuta: 2017,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/ruta-circular-por-el-picon-del-fraile-16031579",
        archivoGPX: "gpx2026/30_picon_fraile.gpx"
    },
    {
        nombreRuta: "Pico San Carlos 'Sagrado Corazón'",
        cumbrePrincipal: "(Fuera de Reto)",
        dificultad: "Moderada",
        colorDificultad: "#f97316",
        iconoDificultad: "🟠",
        añoRuta: 2019,
        enlaceWikiloc: "https://es.wikiloc.com/rutas-senderismo/pico-san-carlos-sagrado-corazon-macizo-de-andara-41008792",
        archivoGPX: "gpx2026/00_san_carlos.gpx"
    },

    

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

        let popupHtml = `
          <div>
            <div style="font-weight:600;margin-bottom:4px;">${meta.nombreRuta}</div>
            <div style="font-size:12px;color:#6b7280;">Secundario de: ${meta.cumbrePrincipal}</div>
            <div style="margin:6px 0;">
              <b>Longitud:</b> ${distanciaKm} km<br>
              <b>Desnivel acumulado:</b> ${desnivelM} m<br>
              <b>Dificultad:</b> <span style="color:${meta.colorDificultad};">${meta.iconoDificultad} ${meta.dificultad}</span>
            </div>
            <div style="font-size:12px;color:#6b7280;">Propuesto por Dani</div>
            <div style="margin-top:6px;">
              <a href="${meta.enlaceWikiloc}" target="_blank">🌐 Ver en Wikiloc (${meta.añoRuta})</a>
            </div>
        `;

                // Añadir aviso si existe
                if (meta.aviso) {
                    popupHtml += `
            <div style="margin-top:6px;color:#ef4444;font-weight:bold;">
              ${meta.aviso}
            </div>
          `;
        }

        popupHtml += `</div>`; // Cierre final del contenedor


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

    rutasSecundarias.forEach(meta => cargarRutaSecundaria(meta));

});