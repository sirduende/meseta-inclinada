// firebase.js
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, getDoc, doc, setDoc, updateDoc, addDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
    getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import {
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDKawxuPWz7mXIhy5bXTyEXLwjQWLqT2WY",
    authDomain: "mesetainclinada.firebaseapp.com",
    projectId: "mesetainclinada",
    storageBucket: "mesetainclinada.firebasestorage.app",
    messagingSenderId: "1021207844016",
    appId: "1:1021207844016:web:b201c11b0ef9a8c39d5775",
    measurementId: "G-2J00EBRTNF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🔐 Iniciar sesión con Google
export function loginWithGoogle() {
    return signInWithPopup(auth, provider);
}

// 🔓 Verificar si el usuario tiene rol de administrador
export async function isAdmin(uid) {
    try {
        const docRef = doc(db, "roles", uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() && docSnap.data().admin === true;
    } catch (error) {
        console.error("❌ Error al verificar rol:", error);
        return false;
    }
}

// 🔄 Escuchar cambios de sesión
export function onUserChange(callback) {
    onAuthStateChanged(auth, callback);
}

// 🔒 Cerrar sesión
export function logout() {
    return signOut(auth);
}

// 📍 Obtener rutas ordenadas
export async function getRutas() {
    const snapshot = await getDocs(collection(db, "rutas"));
    const rutas = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    rutas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return rutas;
}

export async function getRutasByYear(year = null) {
    const snapshot = await getDocs(collection(db, "rutas"));
    const rutas = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    if (!year) {
        console.log("Devolver todas. Total rutas:", rutas.length);
        return rutas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    const yearStr = String(year);
    console.log("Filtrar por año", yearStr, "Total rutas antes de filtrar:", rutas.length);

    const filtradas = rutas.filter(ruta => {
        const f = ruta.fecha;

        let rutaYear = null;

        // Caso 1: Timestamp de Firestore (tiene .toDate)
        if (f && typeof f.toDate === "function") {
            rutaYear = f.toDate().getFullYear().toString();
        }
        // Caso 2: Date nativo
        else if (f instanceof Date) {
            rutaYear = f.getFullYear().toString();
        }
        // Caso 3: string "YYYY-MM-DD"
        else if (typeof f === "string") {
            rutaYear = f.substring(0, 4);
        }

        console.log("Ruta:", ruta.id, "fecha:", f, "rutaYear:", rutaYear);

        return rutaYear === yearStr;
    });

    console.log("Rutas tras filtrar por", yearStr, ":", filtradas.length);

    return filtradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}


// 📁 Obtener URL de archivo GPX (primero local y en caso contrario remoto)
export async function getGPXUrl(nombreArchivo) {
    const localUrl = `./gpx/${nombreArchivo}`;
    try {
        const response = await fetch(localUrl);
        if (response.ok) {
            const text = await response.text();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "application/xml");
            const root = xmlDoc.documentElement.nodeName.toLowerCase();

            // Validar si parece un GPX/XML
            if (root === "gpx") {
                console.log(`📂 Ok GPX local válido: ${nombreArchivo}`);
                return localUrl;
            } else {
                console.warn(`⚠️ GPX local inválido: ${nombreArchivo}`);
            }
        } else {
            console.warn(`⚠️ GPX local no encontrado: ${nombreArchivo}`);
        }
    } catch (error) {
        console.warn(`⚠️ Error al verificar GPX local: ${nombreArchivo}`, error);
    }

    // Fallback a Firebase
    const archivoRef = ref(storage, 'gpx/' + nombreArchivo);
    try {
        const remoteUrl = await getDownloadURL(archivoRef);
        console.log(`☁️ Cargando GPX desde Firebase: ${nombreArchivo}`);
        return remoteUrl;
    } catch (error) {
        console.error("❌ Error al obtener la URL del GPX desde Firebase:", error);
        return null;
    }
}


// 🔄 Crear o actualizar ruta
export async function saveRuta(id, data) {
    try {
        await setDoc(doc(db, "rutas", id), data);
        return id;
    } catch (error) {
        console.error("❌ Error al guardar ruta:", error.code, error.message);
        throw error;
    }
}


export async function getNextRutaId() {
    try {
        const snapshot = await getDocs(collection(db, "rutas"));
        const ids = snapshot.docs
            .map(doc => parseInt(doc.data().id)) // ← accede al campo interno
            .filter(n => !isNaN(n));

        const maxId = ids.length ? Math.max(...ids) : 0;
        return (maxId + 1).toString();
    } catch (error) {
        console.error("❌ Error al obtener id:", error);
        throw error;
    }
}

export async function getParticipantesUnicos() {
    const snapshot = await getDocs(collection(db, "rutas"));
    const nombres = new Set();

    snapshot.docs.forEach(doc => {
        const ruta = doc.data();
        if (Array.isArray(ruta.participantes)) {
            ruta.participantes.forEach(nombre => nombres.add(nombre));
        }
    });

    const nombresOrdenados = Array.from(nombres).sort();
    return nombresOrdenados;
}

export async function getCumbresFDMESCYL() {
    const snapshot = await getDocs(collection(db, "cumbresFDMESCYL"));
    const lista = [];

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        lista.push({
            id: Number(doc.id),
            nombre: data.nombre,
            lat: data.lat,
            lng: data.lng,
            cubierta: data.cubierta === true,
            orden: data.orden ?? Number(doc.id)
        });
    });

    // Ordenar por el número original (1–30)
    lista.sort((a, b) => a.orden - b.orden);

    return lista;
}


// 🗑️ Eliminar ruta
export async function deleteRuta(id) {

    const rutaRef = doc(db, "rutas", id);
    await deleteDoc(rutaRef);
}

// 📤 Subir archivo GPX
export async function uploadGPX(nombreArchivo, archivo) {

    if (!archivo) {
        console.warn("⚠️ No se ha seleccionado ningún archivo");
        return null;
    }
    console.log("📤 Intentando subir archivo:", nombreArchivo);

    const archivoRef = ref(storage, 'gpx/' + nombreArchivo);
    try {
        await uploadBytes(archivoRef, archivo);
        console.log("✅ Archivo subido correctamente:", nombreArchivo);
        return nombreArchivo;
    } catch (error) {
        console.error("❌ Error al subir GPX:", error.code, error.message);
        throw error;
    }
}

//Temporal, queda aquí como copia de seguridad
export async function importarCumbresFDMESCYL() { const cumbres = [{ id: 1, nombre: "01 Peña Trevinca", lat: 42.24278, lng: -6.79611 }, { id: 2, nombre: "02 Miravalles", lat: 42.88019, lng: -6.77764 }, { id: 3, nombre: "03 Catoute", lat: 42.80144, lng: -6.32146 }, { id: 4, nombre: "04 Cornón de Peñarrubia", lat: 43.02848, lng: -6.30648 }, { id: 5, nombre: "05 Peña Orniz", lat: 43.02426, lng: -6.12095 }, { id: 6, nombre: "06 Peña Ubiña", lat: 43.01834, lng: -5.95673 }, { id: 7, nombre: "07 Peña la Cruz", lat: 43.03131, lng: -5.19122 }, { id: 8, nombre: "08 Peña Ten", lat: 43.10349, lng: -5.14182 }, { id: 9, nombre: "09 Peña Santa", lat: 43.20195, lng: -4.96219 }, { id: 10, nombre: "10 Torre Bermeja", lat: 43.17306, lng: -4.95091 }, { id: 11, nombre: "11 Torre del Friero", lat: 43.15727, lng: -4.87524 }, { id: 12, nombre: "12 Llambrión", lat: 43.17327, lng: -4.85700 }, { id: 13, nombre: "13 Torrecerredo", lat: 43.19776, lng: -4.85287 }, { id: 14, nombre: "14 Espigüete", lat: 42.94461, lng: -4.79622 }, { id: 15, nombre: "15 Peña Prieta", lat: 43.02385, lng: -4.73001 }, { id: 16, nombre: "16 Curavacas", lat: 42.97635, lng: -4.67397 }, { id: 17, nombre: "17 San Millán", lat: 42.23190, lng: -3.20630 }, { id: 18, nombre: "18 Urbión", lat: 42.01144, lng: -2.87849 }, { id: 19, nombre: "19 Moncayo", lat: 41.78717, lng: -1.83969 }, { id: 20, nombre: "20 Pico del Lobo", lat: 41.18319, lng: -3.46628 }, { id: 21, nombre: "21 Peñalara", lat: 40.85001, lng: -3.95601 }, { id: 22, nombre: "22 La Pinareja", lat: 40.81005, lng: -4.09429 }, { id: 23, nombre: "23 El Torozo", lat: 40.31771, lng: -4.98664 }, { id: 24, nombre: "24 Torreón de los Galayos", lat: 40.26204, lng: -5.17187 }, { id: 25, nombre: "25 La Mira", lat: 40.25990, lng: -5.18253 }, { id: 26, nombre: "26 Almanzor", lat: 40.24606, lng: -5.29750 }, { id: 27, nombre: "27 La Covacha", lat: 40.21662, lng: -5.59881 }, { id: 28, nombre: "28 La Serrota", lat: 40.49926, lng: -5.07869 }, { id: 29, nombre: "29 El Torreón de Béjar", lat: 40.29217, lng: -5.74084 }, { id: 30, nombre: "30 Castro Valnera", lat: 43.14585, lng: -3.68190 }]; for (const c of cumbres) { await setDoc(doc(db, "cumbresFDMESCYL", String(c.id)), { nombre: c.nombre, lat: c.lat, lng: c.lng, cubierta: false, orden: c.id }); console.log("Subida:", c.nombre); } console.log("✔️ Importación completada"); }


