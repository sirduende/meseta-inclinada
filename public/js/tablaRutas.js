import { rutasSecundarias } from './rutasSecundarias.js?v=20260104';

function getDificultadVisual(dificultad) {
    const niveles = {
        "Fácil": { icono: "🟢", color: "#22c55e" },
        "Moderada": { icono: "🟠", color: "#f97316" },
        "Difícil": { icono: "🔴", color: "#ef4444" },
        "Muy difícil": { icono: "⚫", color: "#1f2937" }
    };
    return niveles[dificultad] || { icono: "⚪", color: "#6b7280" };
}

function extraerNumeroCumbre(cumbre) {
    const match = cumbre.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 999;
}

function cargarGPX(ruta) {
    return new Promise((resolve) => {
        const gpx = new L.GPX(ruta.archivoGPX, {
            async: true,
            marker_options: { startIconUrl: '', endIconUrl: '', shadowUrl: '' }
        });

        gpx.on('loaded', function (e) {
            const distanciaKm = (e.target.get_distance() / 1000).toFixed(2);
            const desnivelM = Math.round(e.target.get_elevation_gain());
            resolve({ ...ruta, distanciaKm, desnivelM });
        });

        gpx.on('error', () => {
            resolve({ ...ruta, distanciaKm: "—", desnivelM: "—" });
        });
    });
}

export async function renderTablaRutas(selector = "#tablaRutas tbody") {
    const tablaBody = document.querySelector(selector);
    if (!tablaBody) return;

    // Procesar todos los GPX primero
    const rutasConDatos = await Promise.all(
        rutasSecundarias.map(ruta => cargarGPX(ruta))
    );

    // Ordenar por número de cumbre
    const rutasOrdenadas = rutasConDatos.sort((a, b) =>
        extraerNumeroCumbre(a.cumbrePrincipal) - extraerNumeroCumbre(b.cumbrePrincipal)
    );

    // Renderizar tabla
    rutasOrdenadas.forEach((ruta, index) => {
        const visual = getDificultadVisual(ruta.dificultad);
        const fila = document.createElement("tr");

        fila.innerHTML = `
      <td>${index + 1}</td>
      <td>${ruta.nombreRuta}</td>
      <td>${ruta.cumbrePrincipal}</td>
      <td><span style="color:${visual.color};">${visual.icono} ${ruta.dificultad}</span></td>
      <td>${ruta.añoRuta}</td>
      <td>${ruta.propuestoPor || "—"}</td>
      <td><a href="${ruta.enlaceWikiloc}" target="_blank">🌐 Ver</a></td>
      <td>${ruta.distanciaKm} km</td>
      <td>${ruta.desnivelM} m</td>
    `;

        tablaBody.appendChild(fila);
    });
}
