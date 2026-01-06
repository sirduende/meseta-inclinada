import { loadRoutes } from './routes.js';
import { fitAllBounds, map } from './map.js';
import { layersById } from './map.js';

// 🔄 Limpia el mapa antes de recargar rutas
function limpiarMapa() {
    layersById.clear();

    map.eachLayer(layer => {
        if (layer instanceof L.GPX || layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

// 🔄 Limpia el listado lateral
function limpiarSidebar() {
    const routesDiv = document.getElementById("routes");
    if (routesDiv) routesDiv.innerHTML = "";
}

// 🟦 Función para cargar rutas según el año seleccionado
async function cargarRutasSegunAño(year = null) {
    limpiarMapa();
    limpiarSidebar();

    await loadRoutes(year);
    fitAllBounds();
}

// 🟦 Selector de año
const selector = document.getElementById("yearSelector");
const label = document.getElementById("sidebarLabel");

// Año actual
const currentYear = new Date().getFullYear();

// ⚠️ IMPORTANTE: primero fijamos el valor del selector SIN disparar eventos
selector.value = currentYear;

// Actualizamos el título
label.textContent = `Rutas ${currentYear}`;

// Ahora sí, añadimos el listener
selector.addEventListener("change", async () => {
    const year = selector.value || null;
    label.textContent = year ? `Rutas ${year}` : "Todas las rutas";
    await cargarRutasSegunAño(year);
});

// Y por último, cargamos las rutas SOLO UNA VEZ
cargarRutasSegunAño(currentYear);
