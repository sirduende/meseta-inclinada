// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

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

// 📁 Obtener URL de archivo GPX
export async function getGPXUrl(nombreArchivo) {
    const archivoRef = ref(storage, 'gpx/' + nombreArchivo);
    try {
        return await getDownloadURL(archivoRef);
    } catch (error) {
        console.error("❌ Error al obtener la URL del GPX:", error);
        return null;
    }
}
