const fs = require('fs');
const path = require('path');

const dbLevelsPath = path.join(__dirname, 'db_levels.json');
if (!fs.existsSync(dbLevelsPath)) {
  console.error("❌ ERROR: No se encuentra 'db_levels.json'. Corre primero 'query-db-levels.js'.");
  process.exit(1);
}

const levels = JSON.parse(fs.readFileSync(dbLevelsPath, 'utf8'));

// Grouping
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
    movies.push(lvl); // default fallback
  }
});

// Sort helper: Sort by popularity descending (matches level order in game)
const sortByPopularity = (a, b) => (Number(b.popularity || 0) - Number(a.popularity || 0));

movies.sort(sortByPopularity);
series.sort(sortByPopularity);
anime.sort(sortByPopularity);

// Detect duplicates globally and per-category for highlighting
const allSeenTitles = new Map();
levels.forEach(lvl => {
  const clean = String(lvl.title || '').trim().toLowerCase();
  if (!allSeenTitles.has(clean)) {
    allSeenTitles.set(clean, []);
  }
  allSeenTitles.get(clean).push(lvl);
});

function getDuplicateMarker(title) {
  const clean = String(title || '').trim().toLowerCase();
  const occurrences = allSeenTitles.get(clean) || [];
  if (occurrences.length > 1) {
    const categories = occurrences.map(o => o.isAnime ? 'Anime' : (o.category === 'movies' ? 'Película' : 'Serie'));
    const ids = occurrences.map(o => o.levelId || o.id);
    return `⚠️ **[DUPLICADO]** (Encontrado en: ${categories.join(', ')} con IDs: ${ids.join(', ')})`;
  }
  return '';
}

// Generate markdown content
let md = `# Lista de Películas, Series y Anime en OSTPlay

Esta lista contiene todos los niveles actualmente registrados en la base de datos de Firestore.
Hay un total de **${levels.length}** niveles:
- **Películas:** ${movies.length}
- **Series:** ${series.length}
- **Anime:** ${anime.length}

Los elementos marcados con ⚠️ **[DUPLICADO]** aparecen más de una vez en la base de datos (ya sea con el mismo ID, diferente ID, o en diferentes categorías).

---

## 🎬 Películas (${movies.length})

| # | Título | ID de Nivel | Notas / Duplicados |
|---|--------|-------------|--------------------|
`;

movies.forEach((m, idx) => {
  const dup = getDuplicateMarker(m.title);
  md += `| ${idx + 1} | **${m.title}** | \`${m.levelId || m.id}\` | ${dup} |\n`;
});

md += `\n---\n\n## 📺 Series (${series.length})\n\n| # | Título | ID de Nivel | Notas / Duplicados |\n|---|--------|-------------|--------------------|\n`;

series.forEach((s, idx) => {
  const dup = getDuplicateMarker(s.title);
  md += `| ${idx + 1} | **${s.title}** | \`${s.levelId || s.id}\` | ${dup} |\n`;
});

md += `\n---\n\n## 🌸 Anime (${anime.length})\n\n| # | Título | ID de Nivel | Notas / Duplicados |\n|---|--------|-------------|--------------------|\n`;

anime.forEach((a, idx) => {
  const dup = getDuplicateMarker(a.title);
  md += `| ${idx + 1} | **${a.title}** | \`${a.levelId || a.id}\` | ${dup} |\n`;
});

const outputPath = 'd:/Escritorio/Downloads/Proyectos Programacion/OSTPlay/ArchivosMD/lista.md';
fs.writeFileSync(outputPath, md, 'utf8');
console.log(`✅ Archivo lista.md generado con éxito en: ${outputPath}`);
