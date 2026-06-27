// Leaflet Interop for Blazor WebAssembly - Meseta Inclinada
window.leafletInterop = {
    maps: {},
    gpxLayers: {},
    radarLayers: {},  // círculos y marcadores de cumbres FDMESCYL por mapa
    gastroLayers: {}, // marcadores 🍽️ de sitios gastronómicos por mapa
    _secGen: {},      // generación por mapa — descarta cargas GPX de filtros anteriores

    // Calcula el desnivel positivo con algoritmo "local-min":
    // - Rastrea el mínimo local; solo cuenta ganancia cuando la subida supera el umbral
    // - Filtra ruido GPS sin perder ganancias reales (fix del bug anterior que reseteaba al bajar)
    // - Fallback a get_elevation_gain() si no hay datos de altitud en los puntos
    _calcElevGain(layer, threshold = 5) {
        // Extraer todos los puntos con altitud de todas las sub-capas recursivamente
        const alts = [];
        const extractAlts = (l) => {
            if (l.getLayers) { l.getLayers().forEach(extractAlts); return; }
            if (!l.getLatLngs) return;
            const latlngs = l.getLatLngs();
            const flat = (arr) => Array.isArray(arr[0]) ? arr.reduce((a, b) => a.concat(flat(b)), []) : arr;
            flat(latlngs).forEach(pt => {
                const alt = pt.alt ?? (pt.meta && pt.meta.ele != null ? parseFloat(pt.meta.ele) : null);
                if (alt != null && !isNaN(alt)) alts.push(alt);
            });
        };
        extractAlts(layer);

        // Fallback si la librería no popula altitudes en los puntos
        if (alts.length === 0) {
            return Math.round(layer.get_elevation_gain?.() || 0);
        }

        // Algoritmo local-min: solo cuenta cuando la subida desde el mínimo supera el umbral
        let gain = 0, localMin = alts[0];
        for (let i = 1; i < alts.length; i++) {
            if (alts[i] < localMin) {
                localMin = alts[i];
            } else if (alts[i] - localMin >= threshold) {
                gain += alts[i] - localMin;
                localMin = alts[i];
            }
        }
        return Math.round(gain);
    },

    initializeMap(mapId, lat, lng, zoom) {
        if (this.maps[mapId]) return;
        const map = L.map(mapId, { zoomControl: false }).setView([lat, lng], zoom);
        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Panes Z-order
        map.createPane('pane-popups');           map.getPane('pane-popups').style.zIndex = 800;
        map.createPane('pane-cumbres-cubiertas'); map.getPane('pane-cumbres-cubiertas').style.zIndex = 700;
        map.createPane('pane-cumbres-pendientes'); map.getPane('pane-cumbres-pendientes').style.zIndex = 650;
        map.createPane('pane-numeros');          map.getPane('pane-numeros').style.zIndex = 630; // marcadores numéricos sobre rutas
        map.createPane('pane-rutas');            map.getPane('pane-rutas').style.zIndex = 600;

        this.maps[mapId] = map;
        this.gpxLayers[mapId] = {};
    },

    // Elimina solo las capas de propuestas secundarias (prefijo 'sec_')
    // sin tocar las rutas verdes ni los radares.
    // Incrementa la generación para invalidar cargas GPX en vuelo del filtro anterior.
    clearSecundarias(mapId) {
        const map = this.maps[mapId];
        if (!map) return;
        this._secGen[mapId] = (this._secGen[mapId] || 0) + 1;
        const layers = this.gpxLayers[mapId] || {};
        Object.keys(layers).filter(k => k.startsWith('sec_')).forEach(k => {
            try { map.removeLayer(layers[k].layer); } catch(e) {}
            delete layers[k];
        });
    },

    clearMap(mapId) {
        const map = this.maps[mapId];
        if (!map) return;
        Object.values(this.gpxLayers[mapId] || {}).forEach(({ layer }) => {
            try { map.removeLayer(layer); } catch(e) {}
        });
        this.gpxLayers[mapId] = {};
    },

    destroyMap(mapId) {
        const map = this.maps[mapId];
        if (map) { map.remove(); delete this.maps[mapId]; delete this.gpxLayers[mapId]; }
    },

    fitAllBounds(mapId) {
        const map = this.maps[mapId];
        if (!map) return;
        const allBounds = Object.values(this.gpxLayers[mapId] || {})
            .filter(({ bounds }) => bounds && bounds.isValid())
            .map(({ bounds }) => bounds);
        if (allBounds.length === 0) return;
        const combined = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0]);
        map.fitBounds(combined, { padding: [20, 20] });
    },

    zoomToRoute(mapId, routeId) {
        const layerData = (this.gpxLayers[mapId] || {})[routeId];
        if (!layerData) return;
        const map = this.maps[mapId];
        if (layerData.bounds?.isValid()) map.fitBounds(layerData.bounds, { padding: [40, 40] });
    },

    _colorPalette: ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'],

    _getDifficultyColor(nivel, nombre) {
        const n = (nombre || '').toLowerCase();
        if (n.includes('ferrata')) return 'black';
        switch ((nivel || '').toLowerCase()) {
            case 'alta': return '#d62728';
            case 'media': return '#f97316';
            case 'baja': return '#2ca02c';
            default: return '#1f77b4';
        }
    },

    _inferLevel(distanciaKm, desnivelM) {
        if (distanciaKm > 20 || desnivelM > 1500) return 'Alta';
        if (distanciaKm > 12 || desnivelM > 800) return 'Media';
        return 'Baja';
    },

    _formatDuration(totalSeconds) {
        if (!totalSeconds || totalSeconds <= 0) return 'N/A';
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        return h > 0 ? `${h} h ${m} min` : `${m} min`;
    },

    // Carga una ruta GPX y notifica a Blazor con los stats cuando termina
    loadGpxLayer(mapId, routeId, gpxUrl, displayIndex, meta, dotNetHelper) {
        const map = this.maps[mapId];
        if (!map) { console.error(`Map ${mapId} not found`); return; }

        const colorIndex = this._colorPalette[displayIndex % this._colorPalette.length];
        const color = this._getDifficultyColor(meta?.dificultad, meta?.nombre) || colorIndex;

        const gpx = new L.GPX(gpxUrl, {
            async: true,
            polyline_options: { color, weight: 3, opacity: 0.8, pane: 'pane-rutas' },
            marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: null }
        });

        gpx.on('loaded', (e) => {
            const layer = e.target;
            const distanceM = layer.get_distance?.() || 0;
            const totalTime = layer.get_total_time?.() || 0;

            const distanciaKm = Math.round(distanceM / 100) / 10;

            // Cálculo de desnivel con umbral mínimo de 5m para filtrar ruido GPS.
            // get_elevation_gain() sin filtrar sobreestima un 30-50% respecto a Garmin.
            const desnivelM = this._calcElevGain(layer, 5);
            const duracionS   = totalTime > 86400000 || totalTime <= 0
                ? Math.round((distanciaKm / 4.5) * 3600)
                : Math.round(totalTime / 1000);
            const nivelInferido = meta?.dificultad || this._inferLevel(distanciaKm, desnivelM);

            const duracionFormateada = this._formatDuration(duracionS);
            const nivelColor = this._getDifficultyColor(nivelInferido, meta?.nombre);

            // ID de álbum: zero-padded a 2 dígitos para la ruta de fotos
            const albumId = String(parseInt(routeId) || 0).padStart(2, '0');

            const popupHtml = `
                <div style="min-width:200px">
                    <div style="font-weight:600;margin-bottom:4px;font-size:14px;">${meta?.nombre || routeId}</div>
                    <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">${meta?.fecha || ''}</div>
                    ${meta?.descripcion ? `<div style="font-size:12px;margin-bottom:6px;">${meta.descripcion}</div>` : ''}
                    <div style="font-size:12px;">
                        <b>Participantes:</b> ${(meta?.participantes || []).join(', ') || '—'}<br>
                        <b>Longitud:</b> ${distanciaKm} km<br>
                        <b>Desnivel:</b> ${desnivelM} m<br>
                        <b>Duración:</b> ${duracionFormateada}<br>
                        <b>Nivel:</b> <span style="color:${nivelColor};font-weight:bold">${nivelInferido}</span>
                    </div>
                    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                        <a href="${gpxUrl}" download>📥 GPX</a>
                        ${meta?.relive ? `<a href="${meta.relive}" target="_blank">▶️ Relive</a>` : ''}
                    </div>
                </div>`;
            layer.bindPopup(popupHtml, { pane: 'pane-popups' });

            const bounds = layer.getBounds();
            this.gpxLayers[mapId][routeId] = { layer, bounds };
            layer.addTo(map);

            // Marcador numerado en el punto de inicio
            const polyline = layer.getLayers().find(l => l instanceof L.Polyline);
            if (polyline) {
                // getLatLngs() puede devolver array plano o array de arrays (multi-segmento)
                const latlngs = polyline.getLatLngs();
                const startLatLng = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];

                const numberMarker = L.marker(startLatLng, {
                    pane: 'pane-numeros',   // z-index 630, por encima de las polilíneas (600)
                    icon: L.divIcon({
                        className: 'route-number-icon',
                        html: `<div class="route-number-circle">${displayIndex + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                });
                numberMarker.addTo(map);
                numberMarker.bindPopup(popupHtml, { pane: 'pane-popups' });

                // Al hacer clic en el marcador: zoom a los bounds de la ruta (igual que original)
                numberMarker.on('click', () => {
                    if (bounds && bounds.isValid()) {
                        map.fitBounds(bounds.pad(0.1));
                    }
                });

                // Color de la polilínea según dificultad
                polyline.setStyle({ color });
            }

            if (dotNetHelper) {
                dotNetHelper.invokeMethodAsync('OnGpxLoaded', {
                    id: routeId,
                    nombre: meta?.nombre || routeId,
                    fecha: meta?.fecha || '',
                    participantes: meta?.participantes || [],
                    distanciaKm, desnivelM, duracionS,
                    duracionFormateada: this._formatDuration(duracionS),
                    nivel: nivelInferido,
                    color, colorIndex,
                    index: displayIndex + 1
                }).catch(err => { if (err && !String(err).includes('disposed')) console.error('OnGpxLoaded (loaded) error:', err); });
            }
        });

        gpx.on('error', (e) => {
            console.error(`❌ GPX mal formado o no encontrado: ${gpxUrl}`, e?.error || e);
            if (dotNetHelper) {
                dotNetHelper.invokeMethodAsync('OnGpxLoaded', {
                    id: routeId, nombre: meta?.nombre || routeId,
                    fecha: meta?.fecha || '', participantes: meta?.participantes || [],
                    distanciaKm: 0, desnivelM: 0, duracionS: 0,
                    duracionFormateada: 'N/A', nivel: meta?.dificultad || '?', color, colorIndex,
                    index: displayIndex + 1
                }).catch(err => { if (err && !String(err).includes('disposed')) console.error('OnGpxLoaded (error) error:', err); });
            }
        });
    },

    // Carga los 30 círculos de radar de cumbres FDMESCYL (con área de 8km)
    loadRadars(mapId, cumbres) {
        const map = this.maps[mapId];
        if (!map) return;
        if (!this.radarLayers[mapId]) this.radarLayers[mapId] = [];

        cumbres.forEach((cumbre, index) => {
            const esCubierta = cumbre.cubierta === true;
            const borderColor = esCubierta ? '#22c55e' : '#6b7280';
            const fillColor   = esCubierta ? '#86efac' : '#d1d5db';

            const circle = L.circle([cumbre.lat, cumbre.lng], {
                radius: 8000,
                color: borderColor, fillColor, fillOpacity: 0.25, weight: 1
            }).addTo(map);

            const pane = esCubierta ? 'pane-cumbres-cubiertas' : 'pane-cumbres-pendientes';
            const iconHtml = esCubierta
                ? `<div class="cumbre-realizada-icon">🤖</div>`
                : `<div class="route-number-circle-candidate">${cumbre.orden}</div>`;

            const marker = L.marker([cumbre.lat, cumbre.lng], {
                pane,
                icon: L.divIcon({ className: 'route-number-icon', html: iconHtml, iconAnchor: [15, 15] })
            }).addTo(map);

            const cercanas = cumbres
                .filter((_, i) => i !== index && this._distKm(cumbre.lat, cumbre.lng, cumbres[i]?.lat, cumbres[i]?.lng) <= 10)
                .map(c => c.nombre);
            let popupHtml = `<strong>${cumbre.nombre}</strong><br>Cumbre #${cumbre.orden}`;
            if (cercanas.length > 0) popupHtml += `<br><span style="color:#f97316;">🟠 Dentro del radar:</span><br>${cercanas.join(', ')}`;
            marker.bindPopup(popupHtml, { pane: 'pane-popups' });

            this.radarLayers[mapId].push(circle, marker);
        });
    },

    setRadarVisibility(mapId, visible) {
        const map = this.maps[mapId];
        const layers = this.radarLayers[mapId] || [];
        layers.forEach(l => visible ? l.addTo(map) : map.removeLayer(l));
    },

    setVerdeVisibility(mapId, visible) {
        const map = this.maps[mapId];
        const layers = this.gpxLayers[mapId] || {};
        Object.keys(layers).filter(k => k.startsWith('verde_')).forEach(k => {
            visible ? layers[k].layer.addTo(map) : map.removeLayer(layers[k].layer);
        });
    },

    _distKm(lat1, lng1, lat2, lng2) {
        if (!lat2 || !lng2) return 999;
        const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    },

    // Carga una ruta secundaria (propuesta) en gris con popup rico.
    // Devuelve una Promise que resuelve cuando el GPX está en el mapa (o falla).
    // Parámetro visible: si false, la capa se carga pero permanece oculta.
    loadRutaSecundaria(mapId, ruta, visible = true) {
        const map = this.maps[mapId];
        if (!map || !ruta.archivoGPX) return Promise.resolve();

        const gen = this._secGen[mapId] || 0;
        const colores = { 'Fácil': '#22c55e', 'Moderada': '#f97316', 'Difícil': '#ef4444', 'Muy difícil': '#1f2937' };
        const color = colores[ruta.dificultad] || '#6b7280';
        const esFuera = ruta.cumbrePrincipal === 'Fuera de Reto';

        return new Promise((resolve) => {
            const timeout = setTimeout(resolve, 15000); // seguridad ante eventos que no disparan
            const done = () => { clearTimeout(timeout); resolve(); };

            const gpx = new L.GPX(ruta.archivoGPX, {
                async: true,
                polyline_options: { color: '#6b7280', weight: 4, opacity: 0.9 },
                marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: null }
            });

            gpx.on('loaded', (e) => {
                // Ignorar si el filtro cambió mientras cargaba
                if ((this._secGen[mapId] || 0) !== gen) { done(); return; }

                const distanciaKm = (e.target.get_distance?.() / 1000 || 0).toFixed(2);
                const desnivelM   = this._calcElevGain(e.target, 5);

                const popupHtml = `
                    <div>
                        <div style="font-weight:600;margin-bottom:4px;">${ruta.nombreRuta}</div>
                        <div style="font-size:12px;color:#6b7280;">${esFuera ? 'Ruta fuera de reto' : `Secundario de: ${ruta.cumbrePrincipal}`}</div>
                        <div style="margin:6px 0;font-size:13px;">
                            <b>Longitud:</b> ${distanciaKm} km<br>
                            <b>Desnivel:</b> ${desnivelM} m<br>
                            <b>Dificultad:</b> <span style="color:${color}">${ruta.dificultad}</span>
                        </div>
                        <div style="font-size:12px;color:#6b7280;">Propuesto por ${ruta.propuestoPor || '—'}</div>
                        <div style="margin-top:4px;">
                            <a href="${ruta.archivoGPX}" download>📥 Descargar GPX</a> ·
                            <a href="${ruta.enlaceWikiloc}" target="_blank">🌐 Wikiloc (${ruta.añoRuta})</a>
                        </div>
                        ${ruta.aviso ? `<div style="margin-top:6px;color:#ef4444;font-weight:bold;">${ruta.aviso}</div>` : ''}
                    </div>`;

                e.target.bindPopup(popupHtml, { pane: 'pane-popups' });
                if (visible) e.target.addTo(map);

                if (!this.gpxLayers[mapId]) this.gpxLayers[mapId] = {};
                // Prefijo tipado: sec_libre_ o sec_reto_ para poder ocultar por grupo
                const prefix = esFuera ? 'sec_libre_' : 'sec_reto_';
                this.gpxLayers[mapId][prefix + ruta.archivoGPX] = { layer: e.target };

                // Marcador de inicio — registrado con el mismo prefijo
                const polyline = e.target.getLayers().find(l => l instanceof L.Polyline);
                if (polyline) {
                    // getLatLngs() puede devolver array plano o array de arrays (multi-segmento Wikiloc)
                    const latlngs = polyline.getLatLngs();
                    const start = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
                    const letra = esFuera ? 'F' : 'S';
                    const marker = L.marker(start, {
                        icon: L.divIcon({
                            className: 'route-number-icon',
                            html: `<div class="ruta-icon" style="background:#6b7280;">${letra}</div>`,
                            iconSize: [22, 22], iconAnchor: [11, 11]
                        })
                    }).bindPopup(popupHtml, { pane: 'pane-popups' });
                    if (visible) marker.addTo(map);
                    this.gpxLayers[mapId][prefix + 'marker_' + ruta.archivoGPX] = { layer: marker };
                }
                done();
            });

            gpx.on('error', () => {
                console.warn(`GPX no encontrado: ${ruta.archivoGPX}`);
                done();
            });
        });
    },

    // Carga rutas realizadas en verde. Las registra con prefijo 'verde_' para poder ocultarlas.
    loadGpxVerde(mapId, routeId, gpxUrl, meta) {
        const map = this.maps[mapId];
        if (!map) return;

        const gpx = new L.GPX(gpxUrl, {
            async: true,
            polyline_options: { color: '#22c55e', weight: 4, opacity: 0.9 },
            marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: null }
        });

        gpx.on('loaded', (e) => {
            const distanciaKm = (e.target.get_distance?.() / 1000 || 0).toFixed(2);
            const desnivelM   = this._calcElevGain(e.target, 5);
            const popupHtml = `
                <div>
                    <div style="font-weight:600">${meta?.nombre || routeId}</div>
                    <div style="font-size:12px;color:#6b7280">${meta?.fecha || ''}</div>
                    <div style="font-size:13px;margin-top:4px">
                        <b>Longitud:</b> ${distanciaKm} km · <b>Desnivel:</b> ${desnivelM} m
                    </div>
                </div>`;

            e.target.bindPopup(popupHtml, { pane: 'pane-popups' });
            e.target.addTo(map);
            if (!this.gpxLayers[mapId]) this.gpxLayers[mapId] = {};
            this.gpxLayers[mapId]['verde_' + routeId] = { layer: e.target, bounds: e.target.getBounds() };

            // Marcador "R" verde — también registrado para poder ocultarlo
            const polyline = e.target.getLayers().find(l => l instanceof L.Polyline);
            if (polyline) {
                // getLatLngs() puede devolver array plano o array de arrays (multi-segmento Wikiloc)
                const latlngsV = polyline.getLatLngs();
                const startV   = Array.isArray(latlngsV[0]) ? latlngsV[0][0] : latlngsV[0];
                const marker = L.marker(startV, {
                    icon: L.divIcon({
                        className: 'route-number-icon',
                        html: `<div class="route-number-circle" style="background:#22c55e;">R</div>`,
                        iconSize: [25, 25], iconAnchor: [12, 12]
                    })
                }).bindPopup(popupHtml, { pane: 'pane-popups' }).addTo(map);
                this.gpxLayers[mapId]['verde_marker_' + routeId] = { layer: marker };
            }
        });

        gpx.on('error', () => console.warn(`GPX verde no encontrado: ${gpxUrl}`));
    },

    // Muestra u oculta las propuestas de tipo reto (prefijo sec_reto_)
    setSecRetoVisibility(mapId, visible) {
        const map = this.maps[mapId];
        const layers = this.gpxLayers[mapId] || {};
        Object.keys(layers).filter(k => k.startsWith('sec_reto_')).forEach(k => {
            try { visible ? layers[k].layer.addTo(map) : map.removeLayer(layers[k].layer); } catch(e) {}
        });
    },

    // Muestra u oculta las propuestas libres / fuera de reto (prefijo sec_libre_)
    setSecLibreVisibility(mapId, visible) {
        const map = this.maps[mapId];
        const layers = this.gpxLayers[mapId] || {};
        Object.keys(layers).filter(k => k.startsWith('sec_libre_')).forEach(k => {
            try { visible ? layers[k].layer.addTo(map) : map.removeLayer(layers[k].layer); } catch(e) {}
        });
    },

    // ── Gastro markers ───────────────────────────────────────────────────────

    loadGastroMarkers(mapId, sitios) {
        const map = this.maps[mapId];
        if (!map) return;
        this.clearGastroMarkers(mapId);
        this.gastroLayers[mapId] = [];

        sitios.forEach(s => {
            if (!s.lat || !s.lng) return;

            const icon = L.divIcon({
                html: '<div style="width:30px;height:30px;border-radius:50%;background:#16a34a;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 1px 4px rgba(0,0,0,0.35);border:2px solid #fff;line-height:1">🍽️</div>',
                className: '',
                iconSize:   [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15]
            });

            const mapsUrl = s.placeId
                ? `https://www.google.com/maps/place/?q=place_id:${s.placeId}`
                : `https://www.google.com/maps?q=${s.lat},${s.lng}`;

            const starsHtml = s.valoracionMedia > 0
                ? `<div style="font-size:13px;color:#f59e0b;margin:3px 0">
                       ${'★'.repeat(Math.round(s.valoracionMedia))}${'☆'.repeat(5 - Math.round(s.valoracionMedia))}
                       <span style="font-size:10px;color:#666"> ${s.valoracionMedia.toFixed(1)} (${s.numResenas || 0})</span>
                   </div>`
                : '';
            const comentPopup = s.ultimoComentario || s.comentario;
            const popup = `
                <div style="max-width:220px;font-family:sans-serif;line-height:1.4">
                    <b style="font-size:13px">${s.nombre}</b>
                    ${s.direccion ? `<div style="font-size:11px;color:#666;margin:2px 0">${s.direccion}</div>` : ''}
                    ${starsHtml}
                    ${comentPopup ? `<p style="font-size:12px;margin:5px 0;color:#333;font-style:italic">"${comentPopup}"</p>` : ''}
                    <a href="${mapsUrl}" target="_blank" rel="noopener"
                       style="font-size:12px;color:#1a73e8;text-decoration:none">
                        📍 Ver en Google Maps
                    </a>
                    <div style="font-size:10px;color:#999;margin-top:3px">
                        ${s.ultimoAutor ? `último: ${s.ultimoAutor}` : (s.nombreCreador ? `por ${s.nombreCreador}` : '')}
                    </div>
                </div>`;

            const marker = L.marker([s.lat, s.lng], { icon }).addTo(map);
            marker.bindPopup(popup, { maxWidth: 220 });
            this.gastroLayers[mapId].push(marker);
        });
    },

    clearGastroMarkers(mapId) {
        const map = this.maps[mapId];
        if (!map) return;
        (this.gastroLayers[mapId] || []).forEach(m => { try { map.removeLayer(m); } catch(e) {} });
        this.gastroLayers[mapId] = [];
    },

    setGastroVisibility(mapId, visible) {
        const map = this.maps[mapId];
        if (!map) return;
        (this.gastroLayers[mapId] || []).forEach(m => {
            try {
                if (visible) m.addTo(map);
                else         map.removeLayer(m);
            } catch(e) {}
        });
    }
};
