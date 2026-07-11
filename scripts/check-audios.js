const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERROR: No se encuentra el archivo 'firebase-key.json' en la raíz del proyecto.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Helper para peticiones GET/HEAD
function checkUrl(url) {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };
    const req = https.request(url, options, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(500));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(408);
    });
    req.end();
  });
}

// Extraer ID de YouTube
function getYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function checkAllAudios() {
  console.log("🔍 Obteniendo niveles de Firestore...");
  const levelsRef = db.collection('levels');
  const snapshot = await levelsRef.get();

  console.log(`📋 Se encontraron ${snapshot.size} niveles en la base de datos.`);
  const brokenLevels = [];
  
  let checked = 0;
  for (const doc of snapshot.docs) {
    checked++;
    const level = doc.data();
    const title = level.title;
    const levelId = doc.id;
    let isBroken = false;
    let reason = "";

    // Determinar origen del audio
    let videoId = level.youtubeId || getYoutubeId(level.audioUrl);
    
    if (videoId) {
      // Validar con la API oEmbed pública de YouTube (no requiere API key)
      const checkUrlString = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const status = await checkUrl(checkUrlString);
      if (status !== 200) {
        isBroken = true;
        reason = `Video de YouTube no disponible (Status oEmbed: ${status})`;
      }
    } else if (level.audioUrl) {
      // Validar URL de audio clásica (ej. iTunes)
      const status = await checkUrl(level.audioUrl);
      if (status !== 200) {
        isBroken = true;
        reason = `URL de audio clásica no disponible (Status HTTP: ${status})`;
      }
    } else {
      isBroken = true;
      reason = "Sin URL de audio ni ID de YouTube configurado";
    }

    if (isBroken) {
      console.log(`❌ [${checked}/${snapshot.size}] Nivel "${title}" (ID: ${levelId}) está ROTO: ${reason}`);
      brokenLevels.push({ id: levelId, title, reason });
    } else {
      console.log(`✅ [${checked}/${snapshot.size}] Nivel "${title}" (ID: ${levelId}) - OK`);
    }

    // Pequeño retardo de 50ms para no saturar las llamadas
    await new Promise(r => setTimeout(r, 50));
  }

  console.log("\n==========================================");
  console.log(`🎉 Chequeo completado. Niveles comprobados: ${checked}`);
  console.log(`⚠️ Niveles rotos encontrados: ${brokenLevels.length}`);
  
  if (brokenLevels.length > 0) {
    console.log("\nLista de niveles rotos:");
    brokenLevels.forEach(l => {
      console.log(`- [${l.id}] ${l.title} -> ${l.reason}`);
    });
  }
  console.log("==========================================");
  process.exit(0);
}

checkAllAudios();
