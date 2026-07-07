const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const yts = require('yt-search');
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

async function populateYoutubeIds() {
  console.log("🚀 Iniciando actualización de audios icónicos (intros/openings)...");
  
  const levelsRef = db.collection('levels');
  const snapshot = await levelsRef.get();
  
  if (snapshot.empty) {
    console.log("⚠️ No se encontraron niveles en la base de datos.");
    return;
  }
  
  console.log(`📋 Se encontraron ${snapshot.size} niveles. Filtrando series y anime...`);
  
  let successCount = 0;
  let skippedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const title = data.title;
    const category = data.category || 'movies';
    const isAnime = data.isAnime === true;
    
    // Saltarse películas que ya tienen ID (ya que su banda sonora suele estar bien asignada)
    if (category === 'movies' && !isAnime && data.youtubeId) {
      skippedCount++;
      continue;
    }

    // Mecanismo de reanudación: saltarse series/animes ya procesados hasta buffy-cazavampiros
    const docId = doc.id;
    if ((category === 'series' || isAnime) && docId <= 'buffy-cazavampiros') {
      skippedCount++;
      continue;
    }
    
    // Construir la consulta optimizada para buscar la intro oficial y corta
    let searchQuery = '';
    if (isAnime) {
      searchQuery = `${title} opening theme song`;
    } else if (category === 'series') {
      searchQuery = `${title} intro theme song`;
    } else {
      // Películas nuevas sin youtubeId
      searchQuery = `${title} movie main theme ost`;
    }
      
    try {
      console.log(`🔍 Buscando intro para: "${title}" (${isAnime ? 'anime' : category})...`);
      const r = await yts(searchQuery);
      const videos = r.videos;
      
      if (videos && videos.length > 0) {
        const topVideo = videos[0];
        const youtubeId = topVideo.videoId;
        
        // Guardamos el youtubeId en Firestore
        await doc.ref.update({
          youtubeId: youtubeId,
          audioUrl: `https://www.youtube.com/watch?v=${youtubeId}`
        });
        
        console.log(`   ✅ Asignada intro: "${topVideo.title}" (ID: ${youtubeId})`);
        successCount++;
      } else {
        console.log(`   ❌ No se encontraron resultados para: "${title}"`);
      }
      
      // Delay de seguridad de 800ms para evitar rate-limit de YouTube
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (error) {
      console.error(`   💥 Error buscando para "${title}":`, error.message);
    }
  }
  
  console.log(`\n🎉 ¡Actualización finalizada!`);
  console.log(`✅ Intros/Openings actualizados con éxito: ${successCount}`);
  console.log(`⏭️ Omitidos (Películas con audio existente): ${skippedCount}`);
  process.exit(0);
}

populateYoutubeIds();
