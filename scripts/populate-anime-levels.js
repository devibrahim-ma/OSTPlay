const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// 1. Inicializar Firebase Admin
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

const ANIME_OST_LEVELS = [
  {
    levelId: 'anime-naruto',
    category: 'series',
    isAnime: true,
    title: 'Naruto',
    audioUrl: 'https://www.youtube.com/watch?v=pcgarKICN94',
    youtubeId: 'pcgarKICN94',
    correctAnswers: ['naruto', 'naruto shippuden', 'naruto shippūden'],
    hints: {
      actors: 'Naruto Uzumaki, Sasuke Uchiha, Sakura Haruno, Kakashi Hatake',
      director: 'Masashi Kishimoto / Studio Pierrot',
      frameUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=780',
      plot: 'Un joven ninja huérfano con un demonio zorro de nueve colas sellado en su interior busca convertirse en Hokage, el líder de su aldea, para ganarse el respeto de todos.'
    }
  },
  {
    levelId: 'anime-deathnote',
    category: 'series',
    isAnime: true,
    title: 'Death Note',
    audioUrl: 'https://www.youtube.com/watch?v=kYvszG6vAts',
    youtubeId: 'kYvszG6vAts',
    correctAnswers: ['death note', 'cuaderno de la muerte'],
    hints: {
      actors: 'Light Yagami, L Lawliet, Ryuk, Misa Amane',
      director: 'Tsugumi Ohba, Takeshi Obata / Madhouse',
      frameUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=780',
      plot: 'Un brillante estudiante de secundaria encuentra un cuaderno sobrenatural que le permite asesinar a cualquier persona escribiendo su nombre, iniciando una cruzada para purificar el mundo.'
    }
  },
  {
    levelId: 'anime-shingeki',
    category: 'series',
    isAnime: true,
    title: 'Ataque a los Titanes',
    audioUrl: 'https://www.youtube.com/watch?v=8OkpRK2_gME',
    youtubeId: '8OkpRK2_gME',
    correctAnswers: ['ataque a los titanes', 'attack on titan', 'shingeki no kyojin', 'shingeki'],
    hints: {
      actors: 'Eren Yeager, Mikasa Ackerman, Armin Arlert, Levi Ackerman',
      director: 'Hajime Isayama / WIT Studio, MAPPA',
      frameUrl: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=780',
      plot: 'La humanidad vive sitiada dentro de colosales murallas para resguardarse de gigantescos seres devoradores de humanos llamados Titanes, hasta que uno de proporciones nunca vistas destruye el muro.'
    }
  },
  {
    levelId: 'anime-evangelion',
    category: 'series',
    isAnime: true,
    title: 'Neon Genesis Evangelion',
    audioUrl: 'https://www.youtube.com/watch?v=yX7e7PqZ84c',
    youtubeId: 'yX7e7PqZ84c',
    correctAnswers: ['neon genesis evangelion', 'evangelion', 'eva'],
    hints: {
      actors: 'Shinji Ikari, Rei Ayanami, Asuka Langley, Misato Katsuragi',
      director: 'Hideaki Anno / Gainax',
      frameUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=780',
      plot: 'En un mundo post-apocalíptico, una organización recluta a pilotos adolescentes para tripular robots gigantes biológicos llamados EVAs y combatir a los misteriosos Ángeles.'
    }
  },
  {
    levelId: 'anime-dbz',
    category: 'series',
    isAnime: true,
    title: 'Dragon Ball Z',
    audioUrl: 'https://www.youtube.com/watch?v=dfd1L30cWp8',
    youtubeId: 'dfd1L30cWp8',
    correctAnswers: ['dragon ball z', 'bola de dragon z', 'dbz', 'dragon ball'],
    hints: {
      actors: 'Goku, Vegeta, Gohan, Piccolo, Trunks',
      director: 'Akira Toriyama / Toei Animation',
      frameUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=780',
      plot: 'Un valeroso guerrero extraterrestre de la raza Saiyajin defiende el planeta Tierra de tiranos espaciales, androides asesinos y demonios milenarios usando transformaciones de gran poder.'
    }
  },
  {
    levelId: 'anime-onepiece',
    category: 'series',
    isAnime: true,
    title: 'One Piece',
    audioUrl: 'https://www.youtube.com/watch?v=ZwUYx68Sntc',
    youtubeId: 'ZwUYx68Sntc',
    correctAnswers: ['one piece', 'onepiece'],
    hints: {
      actors: 'Monkey D. Luffy, Roronoa Zoro, Nami, Usopp, Sanji',
      director: 'Eiichiro Oda / Toei Animation',
      frameUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=780',
      plot: 'Un chico de goma navega con su tripulación pirata a través de mares peligrosos para encontrar el tesoro legendario del Rey de los Piratas y obtener ese título.'
    }
  },
  {
    levelId: 'anime-demonslayer',
    category: 'series',
    isAnime: true,
    title: 'Demon Slayer',
    audioUrl: 'https://www.youtube.com/watch?v=w5tWYmIpmRA',
    youtubeId: 'w5tWYmIpmRA',
    correctAnswers: ['demon slayer', 'kimetsu no yaiba', 'guardianes de la noche', 'kimetsu'],
    hints: {
      actors: 'Tanjiro Kamado, Nezuko Kamado, Zenitsu Agatsuma, Inosuke Hashibira',
      director: 'Koyoharu Gotouge / Ufotable',
      frameUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=780',
      plot: 'Un joven vende carbón hasta que su familia es asesinada por demonios y su hermana Nezuko es convertida en uno, impulsándolo a unirse a la orden de cazadores para salvarla.'
    }
  },
  {
    levelId: 'anime-myhero',
    category: 'series',
    isAnime: true,
    title: 'My Hero Academia',
    audioUrl: 'https://www.youtube.com/watch?v=2n5n9G8G3P0',
    youtubeId: '2n5n9G8G3P0',
    correctAnswers: ['my hero academia', 'boku no hero academia', 'boku no hero', 'my hero'],
    hints: {
      actors: 'Izuku Midoriya, Katsuki Bakugo, Shoto Todoroki, All Might',
      director: 'Kohei Horikoshi / Bones',
      frameUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=780',
      plot: 'En un mundo donde casi toda la población nace con particularidades o superpoderes, un chico ordinario sin dones es elegido por el héroe número uno para heredar su habilidad.'
    }
  },
  {
    levelId: 'anime-fmab',
    category: 'series',
    isAnime: true,
    title: 'Fullmetal Alchemist: Brotherhood',
    audioUrl: 'https://www.youtube.com/watch?v=X59yeF37Unc',
    youtubeId: 'X59yeF37Unc',
    correctAnswers: ['fullmetal alchemist', 'fullmetal alchemist brotherhood', 'alquimista de acero', 'fmab'],
    hints: {
      actors: 'Edward Elric, Alphonse Elric, Roy Mustang, Winry Rockbell',
      director: 'Hiromu Arakawa / Bones',
      frameUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=780',
      plot: 'Dos hermanos alquimistas sufren un accidente trágico al intentar resucitar a su madre fallecida usando alquimia humana prohibida, y buscan la piedra filosofal para reparar sus cuerpos.'
    }
  },
  {
    levelId: 'anime-cowboybebop',
    category: 'series',
    isAnime: true,
    title: 'Cowboy Bebop',
    audioUrl: 'https://www.youtube.com/watch?v=EL-D9LrFJd4',
    youtubeId: 'EL-D9LrFJd4',
    correctAnswers: ['cowboy bebop', 'cowboybebop', 'bebop'],
    hints: {
      actors: 'Spike Spiegel, Jet Black, Faye Valentine, Ed, Ein',
      director: 'Shinichiro Watanabe / Sunrise',
      frameUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=780',
      plot: 'Un grupo de cazarrecompensas espaciales viaja a bordo del Bebop persiguiendo criminales a lo largo del Sistema Solar en el año 2071, mientras huyen de sus propios pasados.'
    }
  }
];

async function populateAnimeLevels() {
  console.log("🚀 Iniciando carga de niveles de Anime en Firestore...");
  const levelsRef = db.collection('levels');
  
  let successCount = 0;
  
  for (const level of ANIME_OST_LEVELS) {
    try {
      console.log(`📌 Cargando: "${level.title}"...`);
      // Usar levelId como el ID del documento
      await levelsRef.doc(level.levelId).set(level);
      console.log(`✅ Nivel "${level.title}" subido correctamente.`);
      successCount++;
    } catch (error) {
      console.error(`💥 Error subiendo "${level.title}":`, error.message);
    }
  }
  
  console.log(`\n🎉 ¡Carga finalizada! Se subieron ${successCount} niveles.`);
  process.exit(0);
}

populateAnimeLevels();
