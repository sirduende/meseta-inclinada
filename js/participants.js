import { map } from './map.js';
import { layersById } from './routes.js';

export function buildParticipantsFilter(people) {
    const select = document.createElement('select');
    select.id = 'participantsSelect';
    select.className = 'form-select form-select-sm';

    select.appendChild(Object.assign(document.createElement('option'), {
        value: "", textContent: "Todos"
    }));

    Array.from(people).sort().forEach(name => {
        select.appendChild(Object.assign(document.createElement('option'), {
            value: name, textContent: name
        }));
    });

    select.addEventListener('change', updateVisibility);
    const container = document.getElementById('participants');
    if (container) container.appendChild(select);

    document.getElementById('clearFilters').addEventListener('click', () => {
        select.value = "";
        updateVisibility();
    });
}

export function updateVisibility() {
    const selected = document.getElementById('participantsSelect').value;
    layersById.forEach(({ gpxLayer, meta }) => {
        const show = selected === "" || meta.participantes.includes(selected);
        show ? gpxLayer.addTo(map) : map.removeLayer(gpxLayer);
    });
}
