const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERROR: No se encuentra el archivo 'firebase-key.json'.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function setDefaultOffsets() {
  console.log("🔍 Obteniendo todos los niveles de Firestore...");
  const levelsRef = db.collection('levels');
  const snapshot = await levelsRef.get();
  
  const toUpdate = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    // Identificar los niveles que tienen 'audioStartOffset' como undefined o null
    if (data.audioStartOffset === undefined || data.audioStartOffset === null) {
      toUpdate.push({ id: doc.id, title: data.title });
    }
  });

  console.log(`📊 Se encontraron ${toUpdate.length} niveles sin offset configurado (que muestran 'Auto').`);
  
  if (toUpdate.length === 0) {
    console.log("✅ Todos los niveles ya tienen un offset configurado. No hay nada que actualizar.");
    return;
  }

  console.log("⚙️ Iniciando actualización masiva en lotes (batches)...");
  
  // Procesar en lotes de 400 (el límite de Firestore es 500 por lote)
  const batchSize = 400;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = db.batch();
    const chunk = toUpdate.slice(i, i + batchSize);
    
    chunk.forEach(item => {
      const docRef = levelsRef.doc(item.id);
      batch.update(docRef, { audioStartOffset: 0 });
    });

    await batch.commit();
    console.log(`⚡ Lote procesado: ${i + chunk.length} / ${toUpdate.length} niveles actualizados.`);
  }

  console.log(`\n🎉 ¡Actualización finalizada con éxito! ${toUpdate.length} niveles se establecieron en segundo 0.`);
}

setDefaultOffsets().catch(err => {
  console.error("❌ Error durante la ejecución del script:", err);
  process.exit(1);
});
