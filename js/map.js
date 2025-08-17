export const map = L.map('map', { zoomControl: true }).setView([40.4168, -3.7038], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contrib.'
}).addTo(map);

export function fitAllBounds(bounds) {
    if (bounds) {
        map.fitBounds(bounds.pad(0.1));
    } else {
        map.setView([40.4168, -3.7038], 6);
    }
}
