import { loadRoutes } from './routes.js';
import { buildParticipantsFilter, updateVisibility } from './participants.js';
import { fitAllBounds } from './map.js';

document.getElementById('clearFilters').addEventListener('click', () => {
    document.querySelectorAll('input[name="person"]').forEach(i => i.checked = false);
    updateVisibility();
});

document.getElementById('fitAll').addEventListener('click', (e) => {
    e.preventDefault();
    fitAllBounds();
});

loadRoutes()
    .then(people => {
        buildParticipantsFilter(people);
        updateVisibility();
    })
    .catch(err => {
        console.error('No se pudo cargar data.json', err);
        alert('No se pudo cargar data.json. Asegúrate de servir los archivos vía HTTP (GitHub Pages o un servidor local).');
    });
