import {
    getNextRutaId, saveRuta, uploadGPX, getParticipantesUnicos, getRutas, deleteRuta
} from './firebase.js';

const form = document.getElementById("ruta-form");
const lista = document.getElementById("rutas-lista");
const checklist = document.getElementById("participantes-checklist");
const nuevoInput = document.getElementById("nuevo-participante");
const agregarBtn = document.getElementById("agregar-participante");
const fechaInput = document.getElementById("ruta-fecha");

let participantesSeleccionados = new Set();

function renderChecklist(nombres) {
    checklist.innerHTML = '';
    nombres.forEach(nombre => {
        const id = `chk-${nombre}`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = id;
        checkbox.value = nombre;
        checkbox.className = "form-check-input me-2";

        const label = document.createElement("label");
        label.htmlFor = id;
        label.className = "form-check-label me-3";
        label.textContent = nombre;

        const wrapper = document.createElement("div");
        wrapper.className = "form-check form-check-inline";
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        checklist.appendChild(wrapper);
    });
}

agregarBtn.addEventListener("click", () => {
    const nuevo = nuevoInput.value.trim();
    if (nuevo) {
        participantesSeleccionados.add(nuevo);
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.disabled = true;
        checkbox.className = "form-check-input me-2";

        const label = document.createElement("label");
        label.className = "form-check-label me-3";
        label.textContent = nuevo;

        const wrapper = document.createElement("div");
        wrapper.className = "form-check form-check-inline";
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        checklist.appendChild(wrapper);
        nuevoInput.value = '';
    }
});

function transformarFecha(fechaInput) {
    const [dia, mes, año] = fechaInput.split("-");
    return `${año}-${mes}-${dia}`; // yyyy-MM-dd
}

async function cargarChecklist() {
    const nombres = await getParticipantesUnicos();
    renderChecklist(nombres);
}

document.addEventListener("DOMContentLoaded", () => {
    const hoy = new Date();

    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11
    const dd = String(hoy.getDate()).padStart(2, '0');

    fechaInput.value = `${yyyy}-${mm}-${dd}`;
});



form.addEventListener("submit", async (e) => {

    e.preventDefault();    

    const id = String(await getNextRutaId());
    
    const participantes = Array.from(document.querySelectorAll("#participantes-checklist input[type=checkbox]:checked"))
        .map(el => el.value)
        .concat(Array.from(participantesSeleccionados));

    const archivo = document.getElementById("ruta-gpx").files[0];
    var archivoName = "";
    if (archivo) {
        uploadGPX(archivo.name, archivo); // no necesitas await
        archivoName = archivo.name;
    } 

    const fechaInput = document.getElementById("ruta-fecha").value; // ej. "12-09-2025"
    
    const data = {
        id, // generado automáticamente
        nombre: document.getElementById("ruta-nombre").value.trim(),
        fecha: fechaInput,
        timestamp: new Date().toISOString(),
        descripcion: document.getElementById("ruta-descripcion").value.trim(),
        dificultad: document.getElementById("ruta-dificultad").value || "",
        relive: document.getElementById("ruta-relive").value.trim() || "",
        archivo: archivoName || null,
        participantes: participantes, // ya procesado como array
    };

    await saveRuta(id, data);

    e.target.reset();
    checklist.innerHTML = '';
    participantesSeleccionados.clear();
    cargarChecklist();
    cargarRutas();
});

async function cargarRutas() {
    const rutas = await getRutas();
    lista.innerHTML = rutas.map(r =>
        `<div class="card mb-2 p-3">
      <h5>${r.nombre}</h5>
      <p>${r.descripcion || ''}</p>
      <small>${r.fecha}</small>
      ${r.gpxUrl ? `<a href="${r.gpxUrl}" target="_blank">Ver GPX</a>` : ''}
      <button class="btn btn-danger btn-sm mt-2" onclick="eliminarRuta('${r.id}')">Eliminar</button>
    </div>`
    ).join('');
}

window.eliminarRuta = async (id) => {
    if (confirm("¿Eliminar esta ruta?")) {
        await deleteRuta(id);
        cargarRutas();
    }
};

cargarRutas();
cargarChecklist();
