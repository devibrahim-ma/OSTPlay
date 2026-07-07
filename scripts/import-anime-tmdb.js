const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Validar parámetros
const apiKey = process.argv[2];
if (!apiKey) {
  console.error("❌ ERROR: Debes pasar tu clave API de TMDb como argumento.");
  console.error("Uso: node scripts/import-anime-tmdb.js TU_API_KEY_DE_TMDB");
  process.exit(1);
}

// 2. Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERROR: No se encuentra el archivo 'firebase-key.json' en la raíz del proyecto.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 3. Leer y parsear datos3.md para extraer la lista de animes
console.log("📖 Leyendo 'datos3.md'...");
const datosPath = path.join(__dirname, '..', 'datos3.md');
if (!fs.existsSync(datosPath)) {
  console.error("❌ ERROR: No se encuentra el archivo 'datos3.md' en la raíz.");
  process.exit(1);
}
const fileContent = fs.readFileSync(datosPath, 'utf8');
const codeBlockMatch = fileContent.match(/```javascript([\s\S]*?)```/);
if (!codeBlockMatch) {
  console.error("❌ ERROR: No se encontró el bloque de código javascript en datos3.md");
  process.exit(1);
}

const codeText = codeBlockMatch[1];
let animeList = [];
try {
  // Envolver en función para evaluar el "return [ ... ]" de n8n
  const getItems = new Function(codeText);
  const items = getItems();
  animeList = items.map(item => item.json);
  console.log(`✅ Se cargaron ${animeList.length} animes de 'datos3.md'.`);
} catch (error) {
  console.error("❌ ERROR al evaluar el código de datos3.md:", error.message);
  process.exit(1);
}

// Helper para hacer peticiones HTTP en NodeJS (usando https nativo)
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

// Función principal
async function importAnimes() {
  console.log("\n🚀 Iniciando importación y consulta a TMDb...");
  const levelsRef = db.collection('levels');
  let successCount = 0;

  for (let i = 0; i < animeList.length; i++) {
    const anime = animeList[i];
    const { nombre, categoria, isAnime } = anime;
    const isMovie = categoria === 'movies';
    console.log(`\n🔍 [${i + 1}/${animeList.length}] Buscando: "${nombre}" (${categoria})...`);

    let tmdbData = null;
    try {
      // Paso A: Buscar ID en TMDb
      const searchType = isMovie ? 'movie' : 'tv';
      const searchUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${apiKey}&query=${encodeURIComponent(nombre)}&language=es`;
      const searchResult = await httpGet(searchUrl);

      if (searchResult.results && searchResult.results.length > 0) {
        const tmdbId = searchResult.results[0].id;
        
        // Paso B: Obtener detalles y créditos
        const detailsUrl = `https://api.themoviedb.org/3/${searchType}/${tmdbId}?api_key=${apiKey}&language=es&append_to_response=credits`;
        tmdbData = await httpGet(detailsUrl);
      }
    } catch (err) {
      console.warn(`⚠️ Advertencia buscando "${nombre}" en TMDb:`, err.message);
    }

    // Paso C: Normalizar y construir objeto de nivel
    const cleanTitle = tmdbData ? (isMovie ? tmdbData.title : tmdbData.name) : nombre;
    const frameUrl = tmdbData?.backdrop_path 
      ? `https://image.tmdb.org/t/p/w780${tmdbData.backdrop_path}` 
      : (tmdbData?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : "");
    const plot = tmdbData?.overview || "Sinopsis no disponible";

    let director = "Información no disponible";
    if (tmdbData) {
      if (isMovie) {
        if (tmdbData.credits && tmdbData.credits.crew) {
          const dirObj = tmdbData.credits.crew.find(c => c.job === 'Director');
          if (dirObj) director = dirObj.name;
        }
      } else {
        if (tmdbData.created_by && tmdbData.created_by.length > 0) {
          director = tmdbData.created_by.map(c => c.name).join(', ');
        } else if (tmdbData.credits && tmdbData.credits.crew) {
          const execObj = tmdbData.credits.crew.find(c => c.job === 'Executive Producer');
          if (execObj) director = execObj.name;
        }
      }
    }

    let actors = "Reparto no disponible";
    if (tmdbData && tmdbData.credits && tmdbData.credits.cast) {
      actors = tmdbData.credits.cast.slice(0, 3).map(a => a.name).join(', ');
    }

    // Respuestas correctas
    const lowerTitle = cleanTitle.toLowerCase().trim();
    const correctAnswers = [lowerTitle];
    const articles = ['el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'the ', 'a '];
    for (const art of articles) {
      if (lowerTitle.startsWith(art)) {
        correctAnswers.push(lowerTitle.substring(art.length));
        break;
      }
    }

    // ID único
    const levelId = lowerTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const documentData = {
      levelId: levelId,
      category: categoria,
      isAnime: isAnime === true,
      title: cleanTitle,
      correctAnswers: correctAnswers,
      hints: {
        actors: actors,
        director: director,
        frameUrl: frameUrl,
        plot: plot
      }
    };

    try {
      // Guardar en Firestore con { merge: true } para actualizar o crear sin sobrescribir audios de YouTube
      await levelsRef.doc(levelId).set(documentData, { merge: true });
      console.log(`✅ Guardado en Firestore: "${cleanTitle}" -> ID: ${levelId}`);
      successCount++;
    } catch (dbErr) {
      console.error(`💥 Error escribiendo "${cleanTitle}" en Firestore:`, dbErr.message);
    }

    // Pequeño retardo para no saturar la API de TMDb
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n🎉 ¡Importación finalizada! Se procesaron con éxito ${successCount} de ${animeList.length} niveles.`);
  process.exit(0);
}

importAnimes();
