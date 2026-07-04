# Plan de Desarrollo: OSTPlay 🎬🍿

Este documento detalla el plan de trabajo por etapas para transformar **OSTPlay** en un juego completo, con categorías diferenciadas de películas y series (500+ niveles por categoría), y un diseño de interfaz premium e inmersivo.

---

## 🔍 Análisis de APIs: ¿Es TMDb la mejor opción?

Sí, **TMDb (The Movie Database)** es actualmente la mejor opción para este proyecto personal por las siguientes razones:
1. **Límites Generosos:** Su API es 100% gratuita para desarrolladores y proyectos personales, sin límites comerciales restrictivos si el tráfico es moderado.
2. **Calidad de Recursos:** Proporciona imágenes de altísima calidad (posters oficiales y fotogramas/backdrops) a escala mundial.
3. **Consistencia de Datos:** Soporta de forma excelente tanto películas como series de televisión en múltiples idiomas (incluyendo español).

### Alternativas analizadas:
* **OMDb API:** Aunque es fácil de usar, su plan gratuito limita a 1,000 peticiones diarias totales (lo cual se consumiría rápido en pruebas de desarrollo y juego con 1000 niveles) y las imágenes en alta resolución requieren donación.
* **TVmaze API:** Es fantástica para series (no requiere API Key), pero no incluye películas.
* **Wikipedia API:** Es libre y gratuita, pero la estructura de datos es inconsistente y extraer imágenes correctas es sumamente difícil de automatizar.

---

## 🛠️ Etapas del Desarrollo

El desarrollo se dividirá en 5 etapas secuenciales. Una vez que apruebes este plan, podremos ir ejecutando cada una paso a paso.

### 📦 Etapa 1: Flujo de n8n para Poblar la Base de Datos (1000 Niveles sin Spoilers)
Para evitar spoilers y poblar automáticamente la base de datos de películas y series sin ver los datos, configuraremos un flujo en n8n:
1. **Nodo Origen (JSON / Google Sheets):** Entrada con 500 títulos de películas y 500 de series.
2. **Nodo HTTP Request (Búsqueda y Detalles):**
   * **Series:** Consulta a la API de **TVmaze** (`https://api.tvmaze.com/singlesearch/shows?q=TITULO&embed=cast`) para obtener metadatos (reparto, creadores, sinopsis, imagen oficial).
   * **Películas:** Consulta a la API de **OMDb** (`https://www.omdbapi.com/?t=TITULO&plot=short&apikey=TU_KEY`) para obtener póster, reparto, director y sinopsis.
3. **Nodo Base de Datos (Firebase / Supabase / MongoDB):** Inserta cada registro en la colección correspondiente (`movies` y `series`), dejando vacío el campo del audio.
4. **Nota sobre el Audio:** La música (bandas sonoras) se resolverá dinámicamente en el frontend mediante iTunes Search API o Spotify/YouTube en ejecuciones posteriores.


### 🎛️ Etapa 2: Soporte Multicategoría en el Motor del Juego (`GameStateService`)
Modificaremos la lógica central del juego para permitir:
1. Alternar entre las pestañas de **Películas** y **Series**.
2. Gestionar estados de niveles completados de manera independiente para cada categoría.
3. Adaptar las pistas de nivel de series (ej. mostrar "Creador" en lugar de "Director" en el intento 3).
4. Guardar el progreso localmente (`localStorage`) para que el usuario no pierda sus niveles jugados al recargar.

### 🎨 Etapa 3: Rediseño Radical de la Interfaz (Estética Premium "No-IA")
Cambiaremos por completo el look and feel para crear una experiencia inmersiva:
1. **Fondo Dinámico de Cine (Ambient Mode):** Al seleccionar un nivel, el fondo general de la aplicación tendrá un degradado animado con el fotograma de la película desenfocado al 20% de opacidad.
2. **Pestañas de Categoría Cinemáticas:** Un selector superior moderno y minimalista para cambiar entre películas y series con transiciones suaves.
3. **Cartelera de Niveles Interactiva:** En lugar de cajas grises simples, los niveles se verán como pequeños "fotogramas oscuros". Al ganar un nivel, la tarjeta se revelará mostrando la imagen real de la película en miniatura con un borde brillante en color verde esmeralda.
4. **Comandos de Búsqueda Inteligente (Fuzzy Search):** En lugar del buscador simple, crearemos un componente de entrada de texto moderno, con sugerencias flotantes estilizadas.
5. **Tipografía y Paleta Obsidian:** Usaremos una paleta basada en tonos carbón y pizarra profundo, con acentos de color ámbar y esmeralda de alta fidelidad, cargando fuentes modernas de Google Fonts.

### 🎵 Etapa 4: Visualizador de Audio (Audio Waveform Visualizer)
Añadiremos un componente visualizador interactivo:
1. Usando la API de Audio de HTML5 y Canvas, dibujaremos una onda de audio interactiva.
2. Cuando la música suene, la onda vibrará dinámicamente al compás de la música. Si está en pausa o cargando, mostrará una línea sutil con un latido.

### 🧪 Etapa 5: Pulido, Sonidos Retro y Despliegue
1. Añadiremos pequeños efectos de sonido (un "beep" retro al fallar un intento y un acorde triunfal al acertar).
2. Optimizaremos las consultas de iTunes para evitar fallos si un título tiene caracteres especiales.
3. Aseguraremos que el proyecto compile perfectamente para producción con `npm run build`.
