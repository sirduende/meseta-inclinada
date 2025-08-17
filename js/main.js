// Importar módulos locales
import { createMap } from './map.js';
import { loadRoutes } from './routes.js';
import { buildParticipantsFilter, setupFilters } from './participants.js';
import { fitAllRoutes } from './utils.js';
import { loadData } from './dataLoader.js';

// Inicializar el mapa
const map = createMap();

// Cargar datos y renderizar
loadData().then(data => {
    const routes = loadRoutes(map, data.routes);
    buildParticipantsFilter(data.participants);
    setupFilters(routes, map);
});

// Botón para quitar filtros
document.getElementById('clearFilters').addEventListener('click', () => {
    setupFilters(null, map); // O una función que limpie los filtros
});

// Botón para ajustar el mapa a todas las rutas
document.getElementById('fitAll').addEventListener('click', () => {
    fitAllRoutes(map);
});
