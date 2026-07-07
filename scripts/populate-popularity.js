const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Validar parámetros
const apiKey = '0554cd14a911e41f1caa592119361511'; // Clave API de TMDb proporcionada

// 2. Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERROR: No se encuentra el archivo 'firebase-key.json' en la raíz del proyecto.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Helper para peticiones HTTP
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function startMigration() {
  console.log("🚀 Iniciando migración de popularidad desde TMDb...");
  const levelsRef = db.collection('levels');
  const snapshot = await levelsRef.get();

  console.log(`📋 Total de niveles encontrados en Firestore: ${snapshot.size}`);

  let index = 0;
  for (const doc of snapshot.docs) {
    index++;
    const data = doc.data();
    const title = data.title;
    const category = data.category || 'movies';
    const isMovie = category === 'movies';
    const isAnime = data.isAnime === true;
    
    console.log(`\n🔍 [${index}/${snapshot.size}] Consultando popularidad para: "${title}" (${category})...`);

    let popularity = 0;
    try {
      const searchType = isMovie ? 'movie' : 'tv';
      // Buscar en TMDb
      const searchUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=es`;
      const searchResult = await httpGet(searchUrl);

      if (searchResult.results && searchResult.results.length > 0) {
        popularity = searchResult.results[0].popularity || 0;
        console.log(`⭐ Popularidad encontrada: ${popularity}`);
      } else {
        console.log(`⚠️ No se encontraron resultados en TMDb. Popularidad por defecto: 0`);
      }
    } catch (err) {
      console.warn(`💥 Error buscando en TMDb para "${title}":`, err.message);
    }

    try {
      // Guardar de vuelta en Firestore conservando todo lo demás
      await levelsRef.doc(doc.id).update({ popularity: popularity });
      console.log(`✅ Firestore actualizado para "${title}" (ID: ${doc.id})`);
    } catch (dbErr) {
      console.error(`💥 Error actualizando Firestore para "${title}":`, dbErr.message);
    }

    // Pequeño delay de 80ms
    await new Promise(r => setTimeout(r, 80));
  }

  console.log("\n🎉 ¡Migración de popularidad finalizada con éxito!");
  process.exit(0);
}

startMigration();
