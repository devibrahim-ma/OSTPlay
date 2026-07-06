const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

// 1. Inicializar Firebase Admin
// Asegúrate de haber descargado la clave de cuenta de servicio de Firebase y guardarla como 'firebase-key.json' en la raíz.
const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERROR: No se encuentra el archivo 'firebase-key.json' en la raíz del proyecto.");
  console.error("Por favor, descárgalo de Firebase Console -> Configuración -> Cuentas de servicio.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function populateYoutubeIds() {
  console.log("🚀 Iniciando búsqueda de IDs de YouTube para todos los niveles...");
  
  const levelsRef = db.collection('levels');
  const snapshot = await levelsRef.get();
  
  if (snapshot.empty) {
    console.log("⚠️ No se encontraron niveles en la base de datos Firestore.");
    return;
  }
  
  console.log(`📋 Se encontraron ${snapshot.size} niveles. Procesando...`);
  
  let successCount = 0;
  let skippedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const title = data.title;
    const category = data.category || 'movies';
    
    // Si ya tiene un youtubeId válido, nos lo saltamos para ahorrar peticiones
    if (data.youtubeId) {
      skippedCount++;
      continue;
    }
    
    // Construimos la consulta óptima
    const searchQuery = category === 'series' 
      ? `${title} tv series theme soundtrack ost` 
      : `${title} movie ost bso soundtrack`;
      
    try {
      console.log(`🔍 Buscando audio para: "${title}"...`);
      const r = await yts(searchQuery);
      const videos = r.videos;
      
      if (videos && videos.length > 0) {
        const topVideo = videos[0];
        const youtubeId = topVideo.videoId;
        
        // Guardamos el youtubeId en Firestore
        await doc.ref.update({
          youtubeId: youtubeId,
          // Guardamos también la URL por si la necesitamos en el futuro
          audioUrl: `https://www.youtube.com/watch?v=${youtubeId}`
        });
        
        console.log(`✅ Asignado video "${topVideo.title}" (ID: ${youtubeId}) para "${title}"`);
        successCount++;
      } else {
        console.log(`❌ No se encontraron resultados de YouTube para: "${title}"`);
      }
      
      // Delay de seguridad de 1.5s para no saturar a YouTube
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.error(`💥 Error buscando para "${title}":`, error.message);
    }
  }
  
  console.log(`\n🎉 ¡Proceso finalizado!`);
  console.log(`✅ Actualizados con éxito: ${successCount}`);
  console.log(`⏭️ Omitidos (ya tenían ID): ${skippedCount}`);
}

populateYoutubeIds();
