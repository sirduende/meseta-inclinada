// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyDKawxuPWz7mXIhy5bXTyEXLwjQWLqT2WY",
    authDomain: "mesetainclinada.firebaseapp.com",
    projectId: "mesetainclinada",
    storageBucket: "mesetainclinada.firebasestorage.app",
    messagingSenderId: "1021207844016",
    appId: "1:1021207844016:web:b201c11b0ef9a8c39d5775",
    measurementId: "G-2J00EBRTNF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Función para obtener rutas ordenadas por fecha descendente
export async function getRutas() {
    const snapshot = await getDocs(collection(db, "rutas"));
    const rutas = snapshot.docs.map(doc => {
        const ruta = doc.data();
        ruta.id = doc.id;
        return ruta;
    });

    //Primero rutas recientes
    rutas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return rutas;
}

export async function getGPXUrl(nombreArchivo) {
    const archivoRef = ref(storage, 'gpx/' + nombreArchivo);
    try {
        const url = await getDownloadURL(archivoRef);
        return url;
    } catch (error) {
        console.error("❌ Error al obtener la URL del GPX:", error);
        return null;
    }
}
