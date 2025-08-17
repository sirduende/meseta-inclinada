// ❌ No hace falta importar Leaflet
// ✅ Usamos directamente L

export const map = L.map('map', { zoomControl: true }).setView([40.4168, -3.7038], 6);

export const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contrib.'
}).addTo(map);

export const layersById = new Map();
export let allBounds = null;

export function fitAllBounds() {
    if (allBounds) {
        map.fitBounds(allBounds.pad(0.1));
    } else {
        map.setView([40.4168, -3.7038], 6);
    }
}

export function setAllBounds(bounds) {
    allBounds = bounds;
}
