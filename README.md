# OST Levels (OSTPlay) 🎵🎮

Infraestructura inicial y esqueleto base para **OST Levels**, un videojuego web interactivo donde los usuarios escuchan fragmentos de bandas sonoras y deben adivinar el título del juego al que pertenecen. 

El juego cuenta con un sistema de intentos (máximo 5), donde cada respuesta incorrecta desbloquea más segundos de reproducción de audio y una pista nueva.

Este proyecto ha sido desarrollado con **Angular**, **TypeScript** y **Tailwind CSS**, estructurado bajo una arquitectura modular y escalable.

---

## 🏗️ Estructura de Carpetas

La arquitectura del proyecto está dividida en módulos de responsabilidad única:

```text
src/app/
├── core/
│   └── game-state.service.ts  # Máquina de estados del juego (Signals) y validación
├── components/                 # Componentes interactivos de UI
│   ├── player/                 # Reproductor HTML5 con límites de tiempo por intento
│   ├── guesser/                # Formulario de texto con autocompletado datalist
│   └── game-status/            # Marcador de intentos, pistas reveladas e historial
├── types/                      # Definiciones e interfaces de TypeScript
│   └── ost-level.model.ts
└── data/                       # Banco de niveles estáticos de prueba
    └── mockLevels.ts           # Niveles de bandas sonoras configurados
```

---

## 🚀 Desarrollo en Local

Sigue estos pasos para probar la aplicación en tu entorno local:

1. **Entrar al directorio del proyecto:**
   ```bash
   cd OSTPlay
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run start
   ```

4. **Acceder a la aplicación:**
   Abre tu navegador en [http://localhost:4200](http://localhost:4200).

---

## 📦 Subir a GitHub

Sigue estos pasos para subir este código a un repositorio nuevo en tu cuenta de GitHub:

1. **Inicializar Git localmente:**
   Asegúrate de estar en la carpeta raíz `OSTPlay` y ejecuta:
   ```bash
   git init
   ```

2. **Añadir archivos y confirmar commit:**
   ```bash
   git add .
   git commit -m "feat: esqueleto base e infraestructura inicial de OSTPlay"
   ```

3. **Crear el repositorio en GitHub:**
   - Ve a [github.com/new](https://github.com/new).
   - Nómbralo `OSTPlay`.
   - Déjalo público o privado y haz clic en **Create repository** sin marcar ninguna inicialización.

4. **Vincular y empujar al repositorio remoto:**
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/OSTPlay.git
   git push -u origin main
   ```

---

## ⚡ Despliegue en Vercel

Vercel detecta automáticamente proyectos creados con Angular.

### Opción A: Despliegue Automático mediante GitHub (Recomendado)
1. Ve a [vercel.com](https://vercel.com).
2. Haz clic en **Add New** > **Project** e importa tu repositorio `OSTPlay` desde GitHub.
3. Vercel configurará automáticamente la compilación de **Angular**:
   - **Framework Preset**: `Angular`
   - **Build Command**: `ng build`
   - **Output Directory**: `dist/OSTPlay/browser` (Vercel lo gestiona solo).
4. Haz clic en **Deploy**. Cada vez que hagas un `git push` a `main`, tu web se actualizará automáticamente.

### Opción B: Despliegue Manual con el CLI de Vercel
1. Instala el CLI de forma global si no lo tienes:
   ```bash
   npm install -g vercel
   ```
2. Ejecuta en la raíz del proyecto:
   ```bash
   vercel
   ```
3. Completa los pasos interactivos. Una vez configurado, realiza despliegues de producción ejecutando:
   ```bash
   vercel --prod
   ```

# n8n

npx n8n

http://localhost:5678

ibra tienes que meter en mp3 en audiourl en firebase



Aplicar script para añadir audios de youtube a los niveles en la raiz del proyecto
```
node scripts/populate-youtube-ids.js
```

te falta pasarlo a app con capacitor


NUEVA MEJORA
anime: Genero
año de lanzamiento
temporada/episodio