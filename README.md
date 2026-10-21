# Mis finanzas

Página web personal para llevar gastos, suscripciones, ahorros (con transferencias entre cuentas), préstamos y metas de ahorro.
Funciona sin servidor propio: HTML + CSS + JavaScript. Los datos se guardan **cifrados en tu navegador** (modo local) o en **Firebase** (modo nube).

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `styles.css`, `app.js`, `icons.js`, `store.js` | La página |
| `config.example.js` | Plantilla de configuración (sin datos reales) |
| `firestore.rules` | Reglas de seguridad de la base de datos (se pegan en Firebase) |
| `.github/workflows/pages.yml` | Publica la página en GitHub Pages y genera `config.js` con tus Secrets |
| `.gitignore` | Evita subir `config.js`, copias de seguridad y notas de traspaso |

## Qué NO se sube a GitHub

* `config.js` (tu configuración real de Firebase). Ya está en `.gitignore`.
* Tus copias de seguridad `copia-finanzas-*.json` (contienen tus finanzas).
* El archivo `traspaso-*.md` si tiene datos de configuración.

## Publicar en GitHub Pages (paso a paso)

1. Crea un repositorio en GitHub (en el plan gratis debe ser público; tus datos NO están en el código).
2. Sube estos archivos tal como están (incluida la carpeta oculta `.github`). **No subas tu `config.js`.**
3. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. En **Settings → Secrets and variables → Actions → New repository secret** crea estos cuatro (valores en Firebase → Configuración del proyecto → Tus apps):
   * `FIREBASE_API_KEY`
   * `FIREBASE_AUTH_DOMAIN`
   * `FIREBASE_PROJECT_ID`
   * `FIREBASE_APP_ID`

   Si no creas secretos, la página se publica en **modo local** (sin nube).
5. Haz un cambio en `main` (o ve a **Actions → Publicar en GitHub Pages → Run workflow**). La dirección queda como `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`.

## Ajustes en Firebase (obligatorios para el modo nube)

1. **Authentication → Settings → Authorized domains → Add domain**: `TU_USUARIO.github.io`.
2. **Firestore Database → Rules**: pega el contenido de `firestore.rules` y publica. Así cada usuario solo accede a sus propios datos.
3. **Google Cloud Console → APIs y servicios → Credenciales → tu clave de API (navegador) → Restricciones de aplicación → Referentes HTTP**: agrega `https://TU_USUARIO.github.io/*` (y `http://localhost:*` si pruebas en tu PC).

### Importante sobre la "API key" de Firebase

La configuración web de Firebase **no es una contraseña**: por diseño viaja dentro de la página y cualquiera puede verla en el navegador.
Lo que protege tus datos son las **reglas de Firestore** (paso 2), los **dominios autorizados** (paso 1) y la **restricción de la clave** (paso 3).
Guardarla en Secrets solo evita que quede escrita en el código y en el historial del repositorio.

## Usar en tu computadora

Copia `config.example.js` como `config.js` y abre `index.html` con un servidor local (por ejemplo `python -m http.server 5500` y entra a `http://localhost:5500`).
El cifrado del modo local necesita `https` o `localhost`.

## Copias de seguridad

Pestaña **Resumen → Descargar copia** guarda un `.json` con todo (gastos, ahorros, préstamos, categorías, suscripciones y metas). Guárdalo fuera del repositorio.
