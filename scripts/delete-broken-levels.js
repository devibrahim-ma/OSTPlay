const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// 1. Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERROR: No se encuentra el archivo 'firebase-key.json' en la raíz del proyecto.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const BROKEN_LEVEL_IDS = [
  'buscando-a-nemo',
  'del-reves-inside-out',
  'mision-imposible-nacion-secreta',
  'padres-forzosos',
  'peter-pan',
  'sucesor-designado'
];

async function deleteBrokenLevels() {
  console.log("🗑️ Iniciando eliminación de niveles rotos en Firestore...");
  const levelsRef = db.collection('levels');

  for (const id of BROKEN_LEVEL_IDS) {
    try {
      console.log(`⏳ Eliminando: "${id}"...`);
      await levelsRef.doc(id).delete();
      console.log(`✅ Documento "${id}" eliminado correctamente.`);
    } catch (err) {
      console.error(`❌ Error eliminando "${id}":`, err.message);
    }
  }
  console.log("\n🎉 Eliminación completada.");
  process.exit(0);
}

deleteBrokenLevels();
