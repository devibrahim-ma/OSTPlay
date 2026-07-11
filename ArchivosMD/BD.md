# 📂 Plan de Automatización para audioUrl (Sin Spoilers) - OSTPlay

Este documento detalla las soluciones para poblar automáticamente el campo `audioUrl` de tus niveles en Firestore usando **YouTube** como fuente principal, evitando tener que meterlos uno a uno y previniendo spoilers.

---

## 🛠️ Alternativas Propuestas

A continuación tienes las dos mejores formas de resolver el problema del audio de iTunes:

### Opción A: Integrar un Reproductor de YouTube Oculto en el Frontend (Recomendada)
En lugar de descargar o buscar archivos de audio directo, guardamos el **YouTube Video ID** (ej: `dQw4w9WgXcQ`) en Firestore. El frontend de Angular cargará la API del reproductor de YouTube (`YT.Player`) de forma invisible, permitiéndote controlar el play, pause, volumen y límites de tiempo (2s, 5s, etc.) exactamente como lo haces ahora, pero con el catálogo infinito de YouTube.

* **Pros:**
  * Catálogo infinito de bandas sonoras (incluyendo covers, temas oficiales y versiones extendidas).
  * No consume almacenamiento en Firebase.
  * No requiere descargar ni recortar audios localmente.
* **Contras:**
  * Hay que adaptar ligeramente el componente `PlayerComponent` para interactuar con la API del Iframe de YouTube en lugar del elemento `<audio>`.

### Opción B: Script Local de Descarga y Corte (Para mantener el `<audio>` actual)
Un script en Node.js que corre localmente en tu ordenador. Lee la base de datos de Firestore, busca cada título en YouTube, descarga el audio usando `yt-dlp`, recorta los primeros 30-45 segundos a un archivo `.mp3`/`.webm` super ligero, lo sube automáticamente a tu Firebase Storage, y guarda la URL pública en `audioUrl`.

* **Pros:**
  * No tienes que tocar ni una línea del código del reproductor en Angular (sigue usando `<audio>`).
  * Tiempos de carga ultra rápidos (los archivos están optimizados y recortados a 30s).
* **Contras:**
  * Requiere tener instalado `ffmpeg` y `yt-dlp` en tu sistema.
  * Ocupa espacio en Firebase Storage (aunque 500 audios de 30s ocupan solo ~100 MB, que entra de sobra en los 5 GB gratis).

---

## 📋 Pasos para la Opción A: Integración con YouTube Player (La más robusta)

Para implementar esta solución sin spoilearte de las películas que tienes en la base de datos, sigue estos pasos:

### Paso 1: Crear el Script de Poblado Automático en Firestore
Crearemos un script que lee todos los documentos en tu colección `levels`, busca en YouTube `"[Título] OST BSO"` de forma automática en segundo plano usando una librería de búsqueda libre de cuotas (como `yt-search`), obtiene el primer video y guarda su ID en un nuevo campo `youtubeId` en tu base de datos Firestore.

1. Instala las dependencias necesarias en la carpeta del proyecto:
   ```bash
   npm install firebase-admin yt-search
   ```
2. Descarga el archivo JSON de credenciales de tu cuenta de servicio de Firebase (ve a *Configuración del proyecto -> Cuentas de servicio -> Generar nueva clave privada* en la consola de Firebase) y guárdalo como `firebase-key.json` en la raíz del proyecto (este archivo está en `.gitignore` para no subirlo a GitHub).
3. Crea y ejecuta el script de actualización automática (tienes el código completo más abajo).

### Paso 2: Modificar el Reproductor en Angular para usar YouTube
Reemplazaremos el elemento `<audio>` clásico por el script de la API de YouTube. La lógica de reproducción respetará los límites de tiempo del juego (`playbackLimits`).

---

## 📝 Código del Script para poblar Firestore (`scripts/populate-youtube-ids.js`)

Crea un archivo llamado `scripts/populate-youtube-ids.js` y pega el siguiente código para rellenar la base de datos automáticamente sin spoilers:

```javascript
const admin = require('firebase-admin');
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
```

---

## 🛠️ Cómo implementar el Reproductor de YouTube en Angular (Frontend)

Para reproducir los audios usando el `youtubeId` en el frontend, aquí tienes las modificaciones necesarias:

### 1. Cargar la API de YouTube en el index.html
Añade este script en tu `src/index.html` para precargar la API del reproductor:
```html
<script src="https://www.youtube.com/iframe_api"></script>
```

### 2. Modificar el PlayerComponent
En tu [player.component.ts](file:///d:/Escritorio/proyectos%20personales/OSTPlay/src/app/components/player/player.component.ts), en lugar de usar un elemento HTML5 `<audio>`, inicializamos un reproductor de YouTube oculto.

Aquí tienes el prototipo de cómo quedaría la integración en el componente:

```typescript
// Declaración global para TypeScript
declare var YT: any;

// ... dentro de tu componente PlayerComponent:
private ytPlayer: any;

initYoutubePlayer(youtubeId: string) {
  // Asegúrate de tener un div con id="yt-player-element" oculto en el HTML
  this.ytPlayer = new YT.Player('yt-player-element', {
    height: '0',
    width: '0',
    videoId: youtubeId,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0
    },
    events: {
      onReady: () => {
        this.isAudioLoaded = true;
        this.totalDuration = this.ytPlayer.getDuration();
        this.ytPlayer.setVolume(this.volume * 100); // YT usa escala 0-100
      },
      onStateChange: (event: any) => {
        // Control de estados de reproducción
        if (event.data === YT.PlayerState.PLAYING) {
          this.isPlaying = true;
          this.startTrackingTime();
        } else {
          this.isPlaying = false;
        }
      }
    }
  });
}

play() {
  if (this.ytPlayer) {
    this.ytPlayer.seekTo(this.startOffset, true);
    this.ytPlayer.playVideo();
  }
}

pause() {
  if (this.ytPlayer) {
    this.ytPlayer.pauseVideo();
  }
}
```

---

## 💬 ¿Qué opción prefieres aplicar?
Si decides ir por la **Opción A (YouTube Player)** o la **Opción B (Descargar a Storage)**, confírmamelo y nos ponemos a codificar y configurar los scripts necesarios para automatizar todo en un instante sin spoilers.
