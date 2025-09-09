import { layersById } from './map.js';
import { map } from './map.js';

export function buildParticipantsFilter(people) {
    const select = document.getElementById('participantsSelect');
    select.innerHTML = '';

    // Opción "Todos"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Todos';
    select.appendChild(allOption);

    // Participantes ordenados
    Array.from(people).sort((a, b) => a.localeCompare(b)).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });

    select.addEventListener('change', updateVisibility);
}

export function updateVisibility() {
    const selected = document.getElementById('participantsSelect').value;

    layersById.forEach(({ gpxLayer, meta }) => {
        const show = selected === '' || meta.participantes.includes(selected);
        show ? gpxLayer.addTo(map) : map.removeLayer(gpxLayer);
    });
}
