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

async function initializeUserRoles() {
  console.log("🔍 Obteniendo todos los usuarios de Firestore...");
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  let adminsCount = 0;
  let usersCount = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    const usernameLower = String(data.username || doc.id).trim().toLowerCase();
    
    let targetRole = 'user';
    if (usernameLower === 'ibractus') {
      targetRole = 'admin';
      adminsCount++;
    } else {
      usersCount++;
    }

    // Prepare update operation
    const docRef = usersRef.doc(doc.id);
    batch.update(docRef, { role: targetRole });
  });

  if (snapshot.size === 0) {
    console.log("⚠️ No se encontraron usuarios en la colección 'users'.");
    return;
  }

  console.log(`⚙️ Actualizando roles en lote: ${adminsCount} admins y ${usersCount} usuarios...`);
  await batch.commit();
  console.log("🎉 ¡Actualización finalizada con éxito! Todos los roles de usuario están inicializados.");
}

initializeUserRoles().catch(err => {
  console.error("❌ Error durante la ejecución del script:", err);
  process.exit(1);
});
