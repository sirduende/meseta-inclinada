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


