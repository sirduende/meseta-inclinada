import { layersById } from './map.js';
import { map } from './map.js';
import { intersects } from './utils.js';

export function buildParticipantsFilter(people) {
    const container = document.getElementById('participants');
    container.innerHTML = '';
    const sorted = Array.from(people).sort((a, b) => a.localeCompare(b));
    sorted.forEach(name => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';
        label.style.margin = '4px 0';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'person';
        input.value = name;
        input.addEventListener('change', updateVisibility);
        label.appendChild(input);
        const span = document.createElement('span');
        span.textContent = name;
        label.appendChild(span);
        container.appendChild(label);
    });
}

export function updateVisibility() {
    const checked = [...document.querySelectorAll('input[name="person"]:checked')].map(i => i.value);
    layersById.forEach(({ gpxLayer, meta }) => {
        const show = checked.length === 0 || intersects(meta.participantes, checked);
        show ? gpxLayer.addTo(map) : map.removeLayer(gpxLayer);
    });
}
