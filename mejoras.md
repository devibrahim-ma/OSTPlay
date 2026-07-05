# 🚀 Plan de Mejoras y Futuras Implementaciones - OSTPlay

Este documento recopila las propuestas de diseño, correcciones técnicas y nuevas modalidades de juego organizadas en **etapas de desarrollo** para evolucionar **OSTPlay** hacia una plataforma web de primer nivel.

---

## 📅 Etapa 1: Optimización de Componentes Core (Experiencia de Usuario)

### 1.1 Corrección de Fotogramas Recortados (Pista #4)
* **Problema:** Los fotogramas de películas/series en la Pista #4 a veces se recortan bruscamente debido a la regla `object-cover` y restricciones de altura fija.
* **Soluciones:**
  * **Contenedor Responsivo Inteligente:** Cambiar `object-cover` por `object-contain` acompañado de un fondo desenfocado o degradado difuminado del propio fotograma para llenar los bordes vacíos sin deformar la imagen.
  * **Modal de Expansión (Zoom/Lightbox):** Permitir hacer clic en la pista del fotograma para abrir un modal en pantalla completa que revele la imagen completa en alta definición y con la relación de aspecto original.
  * **Controles de Relación de Aspecto:** Utilizar la clase CSS `aspect-video` (16:9) estándar del cine para albergar las imágenes de TMDb.

### 1.2 Inicio de Audio Inteligente (Evitar Silencios/Intros lentas)
* **Problema:** Los fragmentos de iTunes Search API/Spotify suelen empezar desde el segundo `0`, que a menudo consiste en silencios, diálogos iniciales o música muy tenue.
* **Soluciones:**
  * **Offset a la Mitad del Audio:** Programar en el reproductor un inicio automático en el punto medio de la pista de audio (ej. si la pista dura 30 segundos, iniciar en el segundo 15) donde suele ubicarse el clímax o estribillo.
  * **Algoritmo de Detección de Pico:** En los metadatos o mediante la duración de la pista, calcular un inicio estimado: `inicio = Math.floor(duracionTotal * 0.35)` (aproximadamente el 35% de la canción).
  * **Guardar Offset por Nivel:** Permitir añadir en la base de datos un campo opcional `audioStartOffset` (en segundos) para que en niveles muy específicos se defina a mano el momento perfecto de reproducción.

---

## 🎨 Etapa 2: Rediseño y Funcionalidad del Navbar (Barra Cinemática)

Para convertir el navbar en un elemento más funcional e interactivo, proponemos añadir las siguientes características directamente integradas en el diseño translúcido actual:

1. **Panel de Estadísticas Rápidas (Mini Stats):**
   * Un botón con icono de gráfico o trofeo en el navbar que despliegue un panel flotante (dropdown o modal de cristal) con las estadísticas del usuario:
     * Porcentaje de aciertos (movies vs series).
     * Racha de días jugados.
     * Distribución de intentos (cuántas adivinadas al intento 1, 2, etc.).
2. **Control de Sonido Global (Mute):**
   * Un interruptor rápido en el navbar para silenciar/activar todos los sonidos del sistema (sonido de aciertos, fallos y reproductor), guardando el estado en el almacenamiento local.
3. **Buscador Rápido de Niveles / Filtro:**
   * Un icono de lupa que expanda una barra de búsqueda para saltar rápidamente a un nivel numérico concreto (ej: escribir "12" para ir al nivel 12 sin volver a la cartelera).
4. **Indicador de Progreso General:**
   * Una barra de progreso delgada de color cian y morado situada justo debajo del borde inferior del navbar, que muestre visualmente cuántos niveles de la categoría actual se han completado.

---

## 🎮 Etapa 3: Nuevas Modalidades de Juego (Engagement Diario e Infinito)

### 3.1 Modo Daily (Estilo Loldle/Wordle)
* **Mecánica:** Una única banda sonora al día, idéntica para todos los jugadores del mundo. Se reinicia a medianoche.
* **Características:**
  * **Historial Diario:** Grabar los resultados diarios en el navegador para mostrar un calendario con días completados (verde) y fallados (rojo).
  * **Compartir Resultado:** Generar un botón para copiar al portapapeles una cuadrícula de emojis para compartir en redes sociales (ej: `OSTPlay Daily #124 🟩🟥🟩⬛⬛ (3 intentos)`).
  * **Bloqueo tras Finalizar:** Una vez jugado el daily, el usuario debe esperar al día siguiente para volver a intentar el modo diario (se le invita a jugar al modo grid o random mientras tanto).

### 3.2 Modo Random (Infinito y Mezclado)
* **Mecánica:** Modo de juego continuo sin fin. La aplicación selecciona niveles de forma completamente aleatoria de la base de datos completa.
* **Características:**
  * **Mix Total:** Mezcla tanto películas como series sin previo aviso, obligando al usuario a deducir primero la categoría antes de adivinar.
  * **Racha de Aciertos (Streak):** Contador en pantalla de cuántas bandas sonoras logras adivinar seguidas. Si fallas una, el contador se reinicia.
  * **Puntaje Acumulado:** Ganar puntos según la rapidez y el número de intentos utilizados.

---

## 💡 Etapa 4: Propuestas de Innovación e Inspiración (Brainstorming)

Aquí tienes una lista de ideas potentes clasificadas por áreas para inspirar futuras expansiones del juego:

### A. Categorías Especiales (Temáticas)
* **Modo Anime/Manga:** Adivinar openings y bandas sonoras de series de animación japonesa míticas.
* **Modo Retro (80s/90s):** Una selección de clásicos del cine de ciencia ficción y aventura de esas décadas (Terminator, Regreso al Futuro, Indiana Jones).
* **Modo Videojuegos:** Adivinar temas instrumentales de juegos famosos (Zelda, Mario, Skyrim, Halo).
* **Modo Terror:** Canciones ambientales inquietantes de películas de suspenso y terror (Psicosis, Halloween, El Exorcista).

### B. Funcionalidades Sociales y de Usuario
* **Cuentas de Usuario (Firebase Auth):**
  * Permitir registrarse con Google/Email.
  * Guardar el progreso de niveles completados en la nube para poder continuar jugando en el móvil y ordenador indistintamente.
* **Clasificación Global (Leaderboards):**
  * Tabla de clasificación mensual con los mejores tiempos de respuesta y rachas de adivinación del modo Random y Daily.
* **Sistema de Logros e Insignias (Badges):**
  * Desbloquear medallas virtuales al cumplir retos:
    * *Oído de Oro:* Adivinar 10 pistas seguidas al primer intento (pista de 2 segundos).
    * *Crítico de Cine:* Completar 50 niveles de películas.
    * *Maratoniano:* Completar 50 niveles de series.

### C. Experiencia Sonora y Estética
* **Sintetizador Retro / Sound FX:**
  * Sonidos cortos al pulsar botones, fallar respuestas (sonido estilo "zumbador") o acertar (arpegio de sintetizador synthwave).
* **Estilos del Visualizador de Onda:**
  * Permitir cambiar el aspecto del visualizador: cambiar entre ondas clásicas, barras de ecualizador tradicionales o una línea circular concéntrica que pulse al ritmo de la batería.

### D. Multi-idioma (Localización)
* **Selector de Idioma:** Configurar la interfaz y los nombres de las pistas en Español e Inglés.
* **Nombres Alternativos de Títulos:** Manejar sinónimos de títulos según la región (ej: *Die Hard* debe ser aceptado como *Jungla de Cristal* en España y *Duro de Matar* en Latinoamérica).
