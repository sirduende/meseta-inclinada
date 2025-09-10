const admin = require("firebase-admin");
const rutas = require("./data.json");

const serviceAccount = require("./clave.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importarRutas() {
    for (const ruta of rutas) {
        try {
            await db.collection("rutas").add(ruta);
            console.log(`Ruta "${ruta.nombre}" importada correctamente.`);
        } catch (error) {
            console.error("Error al importar:", error);
        }
    }
}

importarRutas();
