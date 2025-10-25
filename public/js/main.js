import { loadRoutes } from './routes.js';
import { fitAllBounds } from './map.js';


loadRoutes()
    .then(people => {
        fitAllBounds();
    })
    .catch(err => {
        console.error('No se pudo cargar data.json', err);
        alert('No se pudo cargar data.json. Asegúrate de servir los archivos vía HTTP (GitHub Pages o un servidor local).');
    });
