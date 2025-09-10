// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
