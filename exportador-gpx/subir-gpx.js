const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./clave.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "mesetainclinada.appspot.com"
});

const bucket = admin.storage().bucket();
const carpetaLocal = path.join(__dirname, "gpx");

fs.readdirSync(carpetaLocal).forEach(file => {
  const filePath = path.join(carpetaLocal, file);
  const destino = `gpx/${file}`;

  bucket.upload(filePath, {
    destination: destino,
    public: true,
    metadata: {
      cacheControl: "public, max-age=31536000"
    }
  }).then(() => {
    console.log(`✅ Subido: ${file}`);
  }).catch(err => {
    console.error(`❌ Error al subir ${file}:`, err);
  });
});
