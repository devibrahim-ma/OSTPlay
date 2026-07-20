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

async function analyzeLevels() {
  console.log("🔍 Fetching levels from Firestore...");
  const levelsRef = db.collection('levels');
  const snapshot = await levelsRef.get();
  
  const levels = [];
  snapshot.forEach(doc => {
    levels.push({ id: doc.id, ...doc.data() });
  });

  console.log(`📊 Found ${levels.length} levels in Firestore.`);
  
  // Group by category/type
  const movies = [];
  const series = [];
  const anime = [];
  
  levels.forEach(lvl => {
    if (lvl.isAnime) {
      anime.push(lvl);
    } else if (lvl.category === 'movies') {
      movies.push(lvl);
    } else if (lvl.category === 'series') {
      series.push(lvl);
    } else {
      movies.push(lvl);
    }
  });

  console.log(`🎬 Movies: ${movies.length}`);
  console.log(`📺 Series: ${series.length}`);
  console.log(`🌸 Anime: ${anime.length}`);

  // Let's check duplicates by lowercase title
  function checkDuplicates(list) {
    const seen = new Map();
    const duplicates = [];
    list.forEach(item => {
      const titleClean = String(item.title || '').trim().toLowerCase();
      if (seen.has(titleClean)) {
        seen.get(titleClean).push({ id: item.id, title: item.title });
      } else {
        seen.set(titleClean, [{ id: item.id, title: item.title }]);
      }
    });

    for (const [title, items] of seen.entries()) {
      if (items.length > 1) {
        duplicates.push({ title, occurrences: items });
      }
    }
    return duplicates;
  }

  const movieDups = checkDuplicates(movies);
  const seriesDups = checkDuplicates(series);
  const animeDups = checkDuplicates(anime);

  console.log("\n⚠️ DUPLICATES FOUND:");
  console.log("Movies duplicates count:", movieDups.length);
  if (movieDups.length > 0) {
    console.log(JSON.stringify(movieDups, null, 2));
  }
  
  console.log("Series duplicates count:", seriesDups.length);
  if (seriesDups.length > 0) {
    console.log(JSON.stringify(seriesDups, null, 2));
  }

  console.log("Anime duplicates count:", animeDups.length);
  if (animeDups.length > 0) {
    console.log(JSON.stringify(animeDups, null, 2));
  }

  // Write all retrieved levels to a JSON file for analysis
  const outPath = path.join(__dirname, 'db_levels.json');
  fs.writeFileSync(outPath, JSON.stringify(levels, null, 2));
  console.log(`\n💾 Saved all levels to ${outPath}`);
}

analyzeLevels().catch(err => {
  console.error("❌ Error running script:", err);
});
