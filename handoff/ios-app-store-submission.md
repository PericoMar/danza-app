# Handoff: Publicar danza-app en el App Store de Apple vía EAS

## 1. Objetivo

Subir danza-app (Expo SDK 52, EAS Build/Submit) a TestFlight y al App Store. Android
ya funcionaba desde antes; este trabajo ha sido íntegramente sobre iOS: credenciales,
builds, envío a App Store Connect, y rellenar el formulario de ficha/privacidad/
cumplimiento de exportación que pide Apple antes de poder mandar a revisión.

## 2. Estado actual

**Hecho y verificado:**
- Cuenta Apple Developer Program activa, confirmada por el usuario (Team ID
  `SW9TW8C6KX`, titular "Pablo Dorado Calderón", individual).
- App creada en App Store Connect: bundle `com.danzaapp.mobile`, Apple ID de la app
  `6809233172`.
- Credenciales iOS configuradas en EAS (certificado de distribución + provisioning
  profile + App Store Connect API Key), funcionando en modo no interactivo
  (`eas build ... --non-interactive --auto-submit`).
- Build **1.0.0 (6)** es el que está adjunto al borrador de envío en App Store
  Connect — es iPhone-only (`supportsTablet:false`) y compilado con imagen Xcode 26
  (ver sección "Decisiones"). Se confirmó visualmente en ASC que este es el build que
  se revisará.
- TestFlight funcionando: grupo interno **"Team (Expo)"** (autogenerado por
  `eas submit`) con `pedromartinezgon0511@gmail.com` y
  `danza.app.official@gmail.com` como testers; instalado y probado en un iPhone real.
- Icono de App Store corregido: `assets/images/icon.png` aplanado a 1024×1024 RGB sin
  canal alfa (antes era 928×928 RGBA, causa de rechazo automático de Apple).
- Flujo de "App Encryption Documentation" completado: texto de finalidad de la app
  redactado, algoritmo declarado como "estándar vía/además del SO" (no propietario),
  **Francia excluida de la distribución** para evitar la declaración ANSSI (ver
  "Decisiones").
- Cuestionario de App Privacy completado en el chat (no se verificó que se guardara
  en ASC, ver "Problemas conocidos").
- URL de política de privacidad localizada y confirmada viva:
  `https://danza-app.com/policies/privacy-policy` (ya existía, deploy en Vercel).
- Feature de reseñas **desactivada** con un flag (`constants/features.ts`), por
  riesgo de rechazo bajo la Guideline 1.2 de Apple (UGC pública sin moderación/
  reporte/bloqueo). Ver detalle de archivos tocados.

**A medias / sin confirmar** (la sesión terminó aquí el 2026‑09‑21; han pasado ~12
días hasta este traspaso sin que se registrara el resultado):
- No se sabe si Apple ya revisó el build 6 — podría estar aprobado, rechazado o
  seguir en cola. **Esto es lo primero que hay que comprobar.**
- No se confirmó si se rellenó la **cuenta demo** en "App Review Information" (la
  app requiere login — sin esto, rechazo casi seguro por Guideline 2.1).
- No se confirmó si se subieron las **capturas de iPhone 6.5" (1242×2688 px)** a la
  ficha de la versión. Se ofreció ayuda para redimensionarlas pero el usuario nunca
  llegó a pasar las imágenes en el chat.
- No se confirmó el subtítulo final (30 car.) ni Category/Content Rights/Pricing/
  Age Rating — se dieron recomendaciones pero no se verificó que se guardaran.

## 3. Archivos tocados en esta sesión

- **`eas.json`** — añadido `submit.production.ios` (`appleId`, `ascAppId`,
  `appleTeamId`) y `build.production.ios.image: "macos-sequoia-15.6-xcode-26.2"`
  (fuerza Xcode 26 para pasar el requisito de SDK de Apple, ver "Decisiones").
- **`app.config.js`** — añadido `ios.config.usesNonExemptEncryption: false`; cambiado
  `ios.supportsTablet` de `true` a `false`.
- **`assets/images/icon.png`** — reemplazado in-place: 928×928 RGBA → 1024×1024 RGB
  sin alfa (con `sharp-cli`, flatten sobre blanco + resize).
- **`constants/features.ts`** (nuevo) — `export const REVIEWS_ENABLED = false;` con
  comentario explicando el motivo (Guideline 1.2, falta moderación).
- **`app/insights/[companyId].tsx`** — importa `REVIEWS_ENABLED`; `fetchReviews()` no
  llama a Supabase si está desactivado; el bloque de `ReviewCard` +
  `AlreadyReviewedBanner` queda condicionado al flag. Esta pantalla es pública (sin
  login, ver `isPublicRoute()` en `app/_layout.tsx`), por eso era la prioridad real a
  tapar — no el menú.
- **`app/my-reviews/index.tsx`** — añadido `useRouter`; redirige a `/companies` si
  `REVIEWS_ENABLED` es falso (la ruta seguía siendo accesible por URL directa aunque
  no hubiera botón de menú); `return null` de seguridad antes del render normal.
- **`components/modals/MenuModal.tsx`** — el item "My Reviews" (que estaba comentado
  a mano) ahora está envuelto en `{REVIEWS_ENABLED && (...)}` en vez de comentado —
  reactivarlo en el futuro es cambiar una constante, no descomentar código.

**No tocado por esta sesión pero relevante:** el repo tenía ya, antes de empezar este
trabajo, un diff enorme sin commitear (~50 archivos: rediseño de `app/companies`,
`app/home`, `app/insights`, componentes `common/Site*`, etc. — trabajo de otra sesión
anterior). Nada de eso se tocó aquí; sigue sin commitear. Si vas a hacer commit de
los 7 archivos de arriba, revisa `git status`/`git diff` con cuidado para no mezclar
ambos trabajos en el mismo commit.

## 4. Decisiones tomadas

- **Imagen de build Xcode 26 fijada a mano** (`macos-sequoia-15.6-xcode-26.2`): Apple
  exige desde el 28 abril 2026 que todo build se compile con Xcode 26+ (SDK iOS 26).
  El build #3 fue rechazado por Apple con `ITMS-90725` por usar la imagen por defecto
  de SDK 52 (Xcode 16.2). El blog oficial de Expo recomienda esta imagen concreta
  para proyectos en SDK ≤53, pero **avisa de que no garantizan compatibilidad total**
  — si un build futuro falla al compilar (no al subir), la solución real es subir a
  Expo SDK 54+, no seguir tocando la imagen.
- **Soporte de iPad eliminado** (`supportsTablet:false`), decisión explícita del
  usuario vía pregunta directa: la app no tiene layout pensado para tablet, y así se
  evita tener que generar una captura de iPad 13" que Apple exige en cuanto el build
  declara soporte iPad. Esto costó un build nuevo (#6).
- **Capturas de iPhone**: el usuario eligió explícitamente generarlas desde su propio
  iPhone (instalado vía TestFlight) en vez de renderizar la web en headless o pagar
  EAS Simulator — pero nunca llegó a mandarlas en el chat. Pendiente.
- **Reseñas desactivadas con feature flag, no borradas**: el usuario pidió
  explícitamente "hazlo sin preguntar" tras confirmar que, aunque el menú tenía el
  botón comentado, la pantalla de Company Insights (pública, sin login) sí mostraba
  reseñas reales de usuarios — eso es exactamente lo que la Guideline 1.2 de Apple
  penaliza sin un mecanismo de reportar/bloquear. Se decidió apagarlo con un flag
  (reversible en una línea) en vez de borrar código, para poder reactivarlo cuando
  exista moderación.
- **Francia excluida de la distribución**: al marcar "algoritmo estándar" en el
  cuestionario de cifrado, Apple pidió subir una declaración francesa de cifrado real
  (trámite con ANSSI, el organismo francés — no algo que Apple genere automáticamente,
  puede tardar días/semanas). Se decidió excluir Francia para no bloquear el resto
  del mundo; es reversible luego en Pricing & Availability sin rehacer nada más.
- **Checkbox de "algoritmos de encriptación"**: se marcó "estándar, en lugar de o
  además de usar el cifrado del SO" (no "propietario") porque el asistente de Apple
  obligaba a marcar una de las dos opciones para continuar — no había opción de
  "ninguna", al contrario de lo que se pensaba al principio de esa conversación.

## 5. Problemas conocidos / trampas a evitar

- **Lo primero a comprobar en la nueva sesión: el estado real en App Store Connect**
  (Waiting for Review / In Review / Rejected / Ready for Sale) del build 1.0.0 (6).
  No lo des por aprobado ni por rechazado sin mirarlo.
- Si Apple rechazó por no poder iniciar sesión: falta casi seguro la cuenta demo en
  *App Review Information*. Crear un usuario de prueba real en Supabase, verificar
  que funciona, y rellenarlo ahí.
- Si hace falta un build nuevo por cualquier motivo, el comando que ya funciona
  en modo no interactivo (credenciales ya guardadas en EAS, no pide 2FA porque usa
  la App Store Connect API Key) es:
  ```powershell
  npx eas-cli build -p ios --profile production --non-interactive --auto-submit
  ```
- **Ojo con la imagen de Xcode 26 en SDK 52**: si un build futuro falla al *compilar*
  (no al subir a Apple), no sigas iterando con la imagen — es la señal de que toca
  evaluar subir a Expo SDK 54+.
- `app/profile/index.tsx` **sí existe y es independiente** de `app/my-reviews`: tiene
  su propio formulario de nombre/bio/avatar (`formData.name`, `formData.bio`,
  `avatarUrl`, líneas 33‑178 aprox.). Se investigó si al desactivar `/my-reviews`
  se perdía sin querer la edición de perfil — **no es el caso, está a salvo en su
  propia pantalla**. Lo que sí queda pendiente de verificar: el item "My Profile" en
  `MenuModal.tsx` también estaba comentado (bloque separado del de reviews, sin
  tocar en esta sesión) — comprueba si `/profile` tiene algún otro punto de entrada
  en la UI (tap en avatar, etc.) o si también quedó inalcanzable por descuido.
- expo-doctor seguía marcando (no bloqueante, no se llegó a tocar):
  `react-native-safe-area-context` y `react-native-svg` como dependencias peer
  faltantes directas, `@expo/config-plugins@10.x` instalado cuando SDK 52 espera
  `~9.x`, y un par de versiones de `@react-navigation/*` por encima de lo esperado.
  `npx expo install --check` para revisar.
- No pierdas de vista que hay un diff enorme sin commitear ajeno a este trabajo (ver
  sección 3) — no lo commitees por accidente junto con los cambios de App Store.

## 6. Siguientes pasos (en orden)

1. Mirar el estado real del build 1.0.0 (6) en App Store Connect
   (`https://appstoreconnect.apple.com/apps/6809233172/...`) y el Resolution Center
   por si Apple dejó algún mensaje.
2. Si fue rechazado: leer el motivo exacto, corregirlo (el más probable es la cuenta
   demo), y decidir si hace falta build nuevo o solo tocar metadatos.
3. Confirmar/rellenar si falta: cuenta demo en App Review Information, capturas de
   iPhone 6.5" (1242×2688), Category (`Lifestyle` recomendado), Content Rights
   ("No third-party content"), Pricing (`Free`), Age Rating, subtítulo final
   (opciones ya redactadas: ES "Tu guía de audiciones de danza" 30/30, EN "Your
   guide to dance auditions" 29/30).
4. Verificar el punto de entrada (o falta de él) a `/profile` en la UI.
5. Si/cuando se apruebe y esté live: planificar moderación/reporte/bloqueo de
   contenido para poder reactivar `REVIEWS_ENABLED` en `constants/features.ts` con
   seguridad frente a la Guideline 1.2.
6. Cuando haya margen: resolver los avisos de `expo-doctor` pendientes.

## 7. Referencias

- **EAS**: proyecto `@danzaapps-team/danza-app`, `projectId`
  `40d965cc-2b91-409c-8385-ee3b20cc9814`, owner `danzaapps-team`, login EAS
  `danzaapp` (`danza.app.official@gmail.com`).
- **Apple**: Team ID `SW9TW8C6KX`, App Apple ID `6809233172`, bundle
  `com.danzaapp.mobile`.
- **Web live**: `https://danza-app.com` (Vercel, proyecto
  `pedro-martinez-gonzalezs-projects/danza-app`); privacy policy en
  `https://danza-app.com/policies/privacy-policy`.
- **TestFlight**: grupo interno "Team (Expo)" con
  `pedromartinezgon0511@gmail.com` y `danza.app.official@gmail.com` ya añadidos.
- **Historial de builds relevantes**: #3 (primer build iOS, rechazado por
  `ITMS-90725`, SDK antiguo) → #4 (imagen Xcode 26, éxito) → #5 (aún con iPad) → #6
  (iPhone-only, **es el build actual en el borrador de envío**).
- **Comandos útiles**:
  ```powershell
  npx eas-cli build -p ios --profile production --non-interactive --auto-submit
  npx eas-cli submit -p ios --profile production --latest --non-interactive
  npx eas-cli build:list --platform ios --limit 5 --non-interactive
  npx eas-cli submit:list --platform ios --limit 5 --non-interactive
  npx eas-cli env:list --environment production
  ```
- **Fuente del requisito Xcode 26**: blog de Expo "App Store Connect minimum SDK
  requirements update" (deadline 28 abril 2026, Xcode 26 / iOS 26 SDK obligatorio).
- Skill usada en esta sesión: `expo:eas-app-stores` (Claude Code plugin de Expo).
