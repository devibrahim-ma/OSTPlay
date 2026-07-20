# 🚀 Guía de Configuración: Google Play Console & Closed Testing

Esta guía detalla el proceso paso a paso para configurar tu cuenta de desarrollador de Google Play, declarar las políticas del juego, firmar digitalmente el paquete de la aplicación en formato `.aab` y habilitar el canal de pruebas cerradas para tus 20 testers obligatorios.

---

## 📋 Requisitos Previos
1. Una cuenta de Google (Gmail) para administrar la consola.
2. Un documento de identidad (DNI, Pasaporte o Licencia de Conducir) para la verificación.
3. Una tarjeta de crédito/débito para abonar la tasa única de **25 USD**.
4. Disponer de las 20 direcciones de Gmail de tus amigos que actuarán como probadores oficiales.

---

## 🛠️ Paso a Paso

### Paso 1: Registro en Google Play Console
1. Accede a [Google Play Console](https://play.google.com/console/signup).
2. Inicia sesión con tu cuenta de administrador.
3. Elige el tipo de cuenta: **Cuenta Personal** (Personal Account).
4. Introduce tus datos de contacto y realiza el pago único de **25 USD**.
5. **Verificación de identidad**: Sube una fotografía nítida de tu documento de identidad cuando te lo requiera el sistema. Google tardará entre 24 y 48 horas en validar tu cuenta.

### Paso 2: Creación de la Aplicación
Una vez aprobada tu identidad y con acceso al panel:
1. Haz clic en **Crear aplicación** (Create app) en la esquina superior derecha.
2. Rellena los datos básicos:
   - **Nombre de la app**: `OSTPlay`
   - **Idioma predeterminado**: `Español (España) - es-ES`
   - **Tipo**: `Juego` (Game)
   - **Precio**: `Gratis` (Free)
3. Acepta las declaraciones de políticas obligatorias y haz clic en **Crear aplicación**.

### Paso 3: Declaraciones de Contenido de la Aplicación
En el menú de la izquierda, navega hasta **Contenido de la aplicación** (App content) y completa obligatoriamente cada sección:
* **Política de privacidad**: Introduce el enlace de privacidad generado (puedes subir un HTML sencillo a tu hosting de Vercel y enlazarlo).
* **Anuncios**: Declara que tu aplicación **no contiene anuncios**.
* **Clasificación de contenido**: Rellena el cuestionario sobre temáticas del juego para que Google asigne el rango de edad (PEGI 3).
* **Público objetivo**: Selecciona la franja de **mayores de 13 años o mayores de 16 años** (evita seleccionar menores de 13 para no entrar en regulaciones infantiles sumamente estrictas).
* **Seguridad de datos**: Declara que no compartes datos con terceros si tu base de datos de Firebase solo se usa para autenticación y estadísticas internas del juego.

---

## 📦 Compilación Firmada de la App (`.aab`)

Google Play requiere que subas la aplicación empaquetada como un **Android App Bundle (`.aab`)** firmado digitalmente, no acepta archivos `.apk` directamente.

1. Abre el proyecto Android de tu juego en **Android Studio**.
2. En la barra superior de herramientas, dirígete a: **Build** -> **Generate Signed Bundle / APK...**
3. Elige **Android App Bundle** y haz clic en *Next*.
4. **Keystore (Almacén de claves)**:
   - Si no posees uno, haz clic en **Create new...**.
   - Define una ubicación en tu disco (ej. `ostplay-key.jks`), asigna una contraseña robusta, rellena los campos del certificado (nombre, departamento) y haz clic en *OK*.
   - > ⚠️ **¡IMPORTANTE!** Guarda este archivo `.jks` y sus contraseñas en un lugar seguro. Si lo pierdes, nunca más podrás subir actualizaciones de tu juego a Google Play.
5. Selecciona el alias y la clave del keystore creados y haz clic en *Next*.
6. Selecciona el destino de salida y marca la opción **release**.
7. Pulsa en **Finish**. Android Studio compilará y firmará tu paquete en `android/app/release/app-release.aab`.

---

## 👥 Configuración del Canal de Pruebas Cerradas (20 Testers)

1. En la consola de Google Play, dirígete a **Pruebas** (Testing) -> **Prueba cerrada** (Closed testing).
2. Haz clic en **Crear canal** (Create track) e introduce un nombre (ej. *Canal de Probadores*).
3. Entra en la pestaña **Probadores** (Testers):
   - En la sección *Direcciones de correo electrónico*, crea una nueva lista de correo (ej. *Amigos y Familia*).
   - Añade uno a uno los **20 correos electrónicos de Gmail** de tus probadores y guarda la lista.
4. Entra en la pestaña **Versiones** (Releases) de tu canal y haz clic en **Crear nueva versión**:
   - Sube tu archivo firmado `app-release.aab` generado anteriormente.
   - Introduce un nombre de versión (ej. `1.0.0`) y unas notas de la versión sencillas.
   - Haz clic en **Guardar** -> **Revisar versión** -> **Iniciar lanzamiento hacia Prueba cerrada**.

---

## 📢 Envío e Invitación de Probadores

1. **Revisión de Google**: Al ser la primera subida, Google revisará manualmente tu paquete de aplicación para garantizar que es seguro. Este proceso suele tardar de **2 a 5 días laborables**.
2. **Obtener el enlace de invitación**: Una vez aprobada la versión y con estado *"Activo"* en el canal de pruebas:
   - Dirígete de nuevo a **Prueba cerrada** -> pestaña **Probadores**.
   - Desplázate al final de la página y copia el enlace web del apartado **"Enlace para unirse a través de la Web"** (Join on the web).
3. **Enviar a probadores**: Comparte ese enlace con los 20 probadores que registraste.
4. **Instalación Oficial**: Al entrar al enlace en sus móviles, deberán aceptar la invitación y presionar en **"Descargar en Google Play"**. Google Play descargará el juego en sus dispositivos y comenzará a contar oficialmente el periodo de **14 días obligatorios**.
