# Plan de Implementación SEO para OSTPlay 🚀🎬

Este archivo contiene la guía completa y el código necesario para optimizar el SEO de **OSTPlay** en Google y otros buscadores. Al final de este documento tienes el **prompt listo para copiar y enviar** mañana para hacer toda la integración automáticamente.

---

## 📋 Componentes a Crear/Modificar

### 1. Modificaciones en el Encabezado (`src/index.html`)
Debemos añadir las metaetiquetas principales, etiquetas de Open Graph (redes sociales) e integrar una tipografía premium de Google Fonts en lugar de las fuentes estándar si fuera necesario, además de definir el idioma oficial del documento:

```html
<!-- En <head> de index.html -->
<meta name="description" content="OSTPlay - Adivina la banda sonora de tus películas, series y anime favoritos. Pon a prueba tu memoria musical en el reto diario y los modos de supervivencia.">
<meta name="keywords" content="ostplay, adivina la banda sonora, bandas sonoras cine, juegos de musica peliculas, anime opening guesser, trivias de peliculas">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:title" content="OSTPlay - Adivina la Banda Sonora">
<meta property="og:description" content="Pon a prueba tus conocimientos musicales con las bandas sonoras de películas, series y anime. ¿Lograrás completar el reto diario?">
<meta property="og:image" content="https://ostplay.vercel.app/assets/logo.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:title" content="OSTPlay - Adivina la Banda Sonora">
<meta property="twitter:description" content="Pon a prueba tus conocimientos musicales con las bandas sonoras de películas, series y anime. ¿Lograrás completar el reto diario?">
<meta property="twitter:image" content="https://ostplay.vercel.app/assets/logo.png">
```

### 2. Archivo `robots.txt` en la raíz pública (`public/robots.txt`)
Indica a los motores de búsqueda qué partes del sitio rastrear.

```txt
User-agent: *
Allow: /

Sitemap: https://ostplay.vercel.app/sitemap.xml
```

### 3. Archivo `sitemap.xml` en la raíz pública (`public/sitemap.xml`)
El mapa del sitio estructurado para indexar las secciones principales.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ostplay.vercel.app/</loc>
    <lastmod>2026-07-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

---

## 🤖 Prompt para mañana (Copia y pega este texto tal cual)

```text
Hola! Vamos a implementar el plan de SEO que dejamos configurado en el archivo SEO.md. Por favor realiza las siguientes acciones:

1. Modifica "src/index.html" para incluir las metaetiquetas principales (description, keywords, Open Graph para redes sociales) utilizando la URL base de nuestro proyecto en Vercel (https://ostplay.vercel.app).
2. Crea el archivo "public/robots.txt" con los permisos de rastreo globales y la dirección del sitemap.
3. Crea el archivo "public/sitemap.xml" con la URL raíz indexable de OSTPlay.
4. Si es necesario, comprueba que "angular.json" incluye correctamente todos los elementos de la carpeta "public" al exportar el compilado final.
5. Haz un build de producción al terminar para comprobar que se genera todo a la perfección.
```
