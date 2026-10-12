# Traspaso: publicación de danza-app en Google Play y Apple App Store (vía EAS)

Última actualización: 2026-10-03 (último hecho confirmado en la conversación original: 2026-09-23; hay un hueco de ~10 días sin confirmar con herramientas hasta esta fecha de redacción — revisar builds/estado al retomar).

## 1. Objetivo

Publicar `danza-app` (Expo SDK 52 / React Native, app de descubrimiento de compañías de danza, audiciones y reseñas) en Google Play Store y Apple App Store usando EAS Build/Submit. El trabajo ha sido casi íntegramente de **infraestructura de build y trámites de las tiendas**, no de producto: el código de la app en sí apenas se ha tocado salvo por los fixes descritos abajo.

## 2. Estado actual

### EAS / proyecto
- Proyecto vinculado: `projectId 40d965cc-2b91-409c-8385-ee3b20cc9814`, `owner: danzaapps-team` (cuenta de login: `danzaapp`).
- Variables de entorno **ya registradas en EAS** (producción y preview): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. No hace falta volver a meterlas — comprobar con `npx eas-cli env:list --environment production`.
- Los secretos de servidor (`OPENAI_API_KEY`, `BREVO_API_KEY`, `BREVO_LIST_ID`, `SUPABASE_SERVICE_ROLE_KEY`) siguen solo en `.env` local, no están en EAS ni deben estarlo (no los usa la app nativa).

### Android — build funcionando, en trámite de publicación
- Pipeline de build arreglado tras varias iteraciones (ver §5, "Problemas conocidos" y commits). Último build de producción conocido: **versionCode 7** (2026-09-20), `.aab`, con `targetSdkVersion`/`compileSdkVersion` forzados a **36** vía `expo-build-properties` (ver §4).
- **Pruebas internas**: pista activa, build 7 disponible, funcionando.
- **Pruebas cerradas (Alpha)**: en configuración (borrador) la última vez que se tocó. Pasos del asistente de Play Console: Seleccionar países → Selecciona testers → Crea y lanza una versión → Revisa y confirma → Enviar a revisión. **No se había subido ningún build a esta pista ni añadido testers todavía.**
- Pendiente crítico: Google exige (cuenta de desarrollador nueva) **mínimo 12 testers activos durante 14 días seguidos en pruebas cerradas** antes de desbloquear Producción. El contador no empieza hasta que haya testers reales que acepten la invitación e instalen — no basta con meterlos en la lista.
- Ficha de Play Store: cuestionario de "Seguridad de los datos" completado (ver §4 para el detalle exacto de qué se declaró y por qué). Cuestionario de "Contenido de la app" (clasificación de edad, público objetivo, anuncios) — confirmar si se terminó. Gráfico de funciones (1024×500) e icono de Store — ver "Problemas conocidos", seguían pendientes/con placeholder.

### iOS — más avalado, verificar estado de revisión
- Builds de producción: hasta **build 6** (2026-09-19), todos `FINISHED`.
- Credenciales Apple configuradas en `eas.json` (`appleId`, `ascAppId`, `appleTeamId`).
- **Build 6 ya subido a App Store Connect** vía `eas submit` (confirmado con `submit:list`, status `finished` = subida correcta).
- **No confirmado**: si en App Store Connect se completó la ficha (descripción, capturas, App Privacy, clasificación de edad, texto promocional) ni si se pulsó "Enviar para revisión". Esto se estaba gestionando en **otro chat en paralelo** — al retomar, lo primero es entrar en App Store Connect y comprobar el estado real de la versión.

### Trámites de Google Play ya resueltos en esta conversación
- **Seguridad de los datos**: declarado que la app recoge/comparte — email, ID de usuario, fotos, "otro contenido generado por el usuario" (reseñas), interacciones en la app (favoritos). Todo marcado como "no temporal" (se persiste en Supabase). Decisiones explícitas de **no declarar**: ubicación, info financiera, salud, mensajes, audio, archivos, calendar, contactos, historial de búsquedas (el buscador usa `fuse.js` 100% en el dispositivo, nunca sale de él), navegación web, rendimiento/analítica (no hay SDK de crash/analytics instalado), IDs de publicidad (no hay SDK de anuncios de terceros — `AdsCarousel` es contenido propio desde la tabla `ads`).
- **Cuenta de desarrollador nueva** → requisito obligatorio de 12 testers/14 días en pruebas cerradas antes de producción (ver arriba).
- **Copyright** (App Store Connect): se explicó que debe ser `© 2026 [nombre legal del titular de la cuenta Apple Developer]` — no confirmado si se rellenó.
- **Keywords sugeridas** (ASO): "dance auditions", "dance company reviews", "ballet jobs".
- **Texto promocional** (App Store, 170 car.) — se dieron 3 variantes sin mencionar reseñas (el usuario aclaró que "las reseñas no se están lanzando todavía" como función de marketing) — **no se confirmó si esto significa que la función de reseñas se va a desactivar de verdad en el código, o si solo no se va a anunciar**. Ver "Problemas conocidos", es una decisión pendiente con impacto en la declaración de datos.

## 3. Archivos tocados en esta conversación

| Archivo | Qué cambió |
|---|---|
| `app.config.js` | + `owner: "danzaapps-team"`, + `extra.eas.projectId`, + plugin `expo-build-properties` (android `compileSdkVersion`/`targetSdkVersion: 36`), + `ios.config.usesNonExemptEncryption: false`. (`ios.supportsTablet: false` y el `origin` de `expo-router` los cambió otro chat en paralelo, no esta conversación — solo se documenta aquí porque aparece en el diff actual). |
| `eas.json` | + bloque `submit.production.ios` (appleId/ascAppId/appleTeamId), + `build.production.ios.image`. |
| `package.json` / `pnpm-lock.yaml` | + `expo-image-manipulator`, `expo-gl`, `@react-three/drei`, `@react-three/fiber`, `three`, `@types/three` (dependencias que ya estaban a medio escribir sin commitear, se completaron), + `expo-build-properties`. (`react-native-safe-area-context`, `react-native-svg`, `sharp`, script `migrate-company-logos` los tocó otro chat). |
| `.npmrc` | **Nuevo.** `node-linker=hoisted` — imprescindible, sin esto Metro no resuelve `@babel/runtime` en builds de EAS con pnpm. |
| `.gitignore` | Reescrito desde cero (estaba corrupto: una línea en UTF-16 por un `echo >>` hecho desde PowerShell, que git veía como binario e ignoraba la regla). Añadido `package-lock.json` (proyecto es pnpm-only). |
| `assets/images/icon.png`, `adaptive-icon.png`, `splash-icon.png` | Restaurados — **son copias de `favicon.png`** (928×928, con canal alfa), puestos ahí solo para desbloquear el build. **Son placeholder, no el icono final.** |
| `app/policies/delete-account.tsx` | **Nuevo.** Página pública (sin login) con los pasos para borrar la cuenta, qué datos se borran y cuáles se conservan (ninguno) — exigida por Google Play como "URL de eliminación de cuentas". Debe quedar accesible en `https://danza-app.com/policies/delete-account` tras desplegar. |
| `app/policies/index.tsx` | Añadida una tarjeta/botón "Delete your Account" que enlaza a la página anterior. |

**Nada de esto está commiteado.** El último commit en `main` sigue siendo `1f8866c` (6 de septiembre). Hay 115 archivos modificados/sin trackear en el working tree a fecha de este traspaso, la mayoría de **otros chats** trabajando en el rediseño visual (SiteHeader/Footer, Companies, Insights, etc.) — no son parte de este trabajo de despliegue, pero conviven en el mismo árbol de trabajo sucio. **Antes de lanzar otro build de producción, confirmar qué hay realmente commiteado** — los builds de EAS incluyen el working tree completo (tracked + untracked no-ignorado), así que un build puede incluir cambios de otro chat sin que lo notes.

## 4. Decisiones tomadas (y por qué)

- **Icono de la app = copia del favicon**, por petición explícita del usuario ("no podemos usar el favicon, duplícalo y úsalo como icono"). Se avisó de dos matices: tamaño sub-óptimo (928 vs 1024 recomendado) y canal alfa (Expo lo aplana automáticamente para iOS, así que no bloquea). **Sigue pendiente conseguir un icono de marca real.**
- **`node-linker=hoisted` en `.npmrc`** en vez de parchear dependencias una a una — es la solución recomendada por Expo para proyectos pnpm, porque Metro/autolinking de React Native no soportan bien el `node_modules` simbólico/aislado por defecto de pnpm.
- **`expo-build-properties` para forzar API 36, en vez de actualizar el SDK de Expo** (52 → 58 actual). Se evaluaron las dos opciones explícitamente con el usuario: la actualización de SDK es "la correcta" pero un salto de 6 versiones mayores con cambios rotundos (React 19, Nueva Arquitectura obligatoria, Hermes V1...) y 115 archivos sin commitear de por medio — se decidió probar primero el parche barato (`expo-build-properties`, ~15 min de build para validarlo) antes de embarcarse en la migración grande. **El parche funcionó** (build 7 compiló limpio con API 36). La migración completa de SDK sigue sin hacerse y sigue siendo la solución "de verdad" a medio plazo — no se ha decidido cuándo abordarla.
- **No declarar "historial de búsquedas"** en Seguridad de los datos de Play porque se verificó en el código (`app/companies/index.tsx`) que `fuse.js` filtra en el dispositivo sobre una lista ya descargada — la búsqueda nunca sale del móvil.
- **No declarar "funcionalidad de la app" para las reseñas... PERO SÍ declarar "otro contenido generado por el usuario"** — porque la función de reseñas sigue viva y accesible en el código, aunque el usuario dijo que "no vamos con reseñas todavía" como mensaje de marketing. Se le preguntó explícitamente si esto significa (a) solo no anunciarlo, o (b) desactivar la función de verdad — **no se obtuvo respuesta clara, queda abierto** (ver siguientes pasos).
- **No declarar el "perfil complementario oculto"** que el usuario mencionó (campos no activos todavía) — instrucción explícita: solo declarar lo que la app hace *ahora*, y recordar que hay que volver a este formulario en cuanto se active esa función.
- **Gráfico de funciones de Play (1024×500)**: se recomendó generarlo con el skill `/design` (no invocable directamente por el agente, requiere que el usuario lo lance) con un prompt ya preparado con la paleta de marca real (negro/blanco + "chrome" plateado + acento morado `#7755FF` muy restringido, tipografía Inter) sacada del skill `design-logic` del repo. Se iteró una vez para pedir máxima simplicidad ("sin detalles, claro y conciso"). **No confirmado si se llegó a generar/exportar.**

## 5. Problemas conocidos

1. **Bug de código sin arreglar (el más importante):** en `providers/AuthProvider.tsx`, `loading` empieza en `true` y solo pasa a `false` cuando resuelve `supabase.auth.getSession()`. En `app/_layout.tsx` (`RootContent`), el render es `{!loading && <AppShell key={sessionKey} />}` — **mientras `loading` sea `true` no se pinta absolutamente nada**, sin spinner, sin mensaje de error, sin timeout. Esto fue la causa real de que la app se quedara "colgada en el logo" cuando faltaban las env vars de Supabase en el build (ya arreglado ese caso concreto), pero el agujero de fondo sigue ahí: cualquier fallo futuro de red/Supabase en producción (para un tester o un usuario real) se verá exactamente igual, sin ninguna pista de qué pasó. **Recomendado antes de ir a producción:** añadir un loader visible mientras `loading` es `true`, y un timeout/catch en el `boot()` de `AuthProvider` para que nunca se quede colgado en silencio.
2. **Icono/adaptive-icon/splash son el favicon duplicado**, no el icono de marca definitivo (ver §4).
3. **Hay dos `AuthProvider`**: `providers/AuthProvider.tsx` (el que de verdad importa `app/_layout.tsx`, vía `@/providers/AuthProvider`) y `providers/auth/AuthProvider.tsx` (no se ha investigado si es código muerto o se usa en otro sitio). Revisar y limpiar si sobra.
4. **El repo tiene dos lockfiles** (`pnpm-lock.yaml` + `package-lock.json`); `package-lock.json` ya está en `.gitignore` pero puede seguir existiendo sin trackear en el filesystem de quien retome esto — el proyecto es pnpm-only, no usar npm aquí.
5. **115 archivos sin commitear** en el repo a fecha de este documento (ver §3) — la mayoría de rediseño visual de otros chats, no de este trabajo. Antes de tocar nada de build/despliegue, conviene que quien retome confirme con el usuario qué hay realmente listo para ir a producción.
6. **Decisión de producto pendiente sobre reseñas** (ver §4) — afecta directamente a si la declaración de Seguridad de los datos de Play sigue siendo correcta.
7. Al menos una vez el agente hizo `git checkout -- package.json` para limpiar artefactos de `expo prebuild` y sin querer también revirtió cambios legítimos sin commitear del usuario — se reconstruyeron a mano comparando con `pnpm-lock.yaml`. **Moraleja para quien retome:** antes de cualquier `git checkout`/`restore`/`clean` sobre archivos con cambios sin commitear, comprobar primero qué hay y considerar un stash, no solo revertir.

## 6. Siguientes pasos (en orden)

1. **Resolver la duda de las reseñas** con el usuario: ¿se desactiva la función en el código para este lanzamiento, o solo no se anuncia? Ajustar la declaración de Seguridad de los datos de Play si hace falta.
2. **Terminar de montar la pista de pruebas cerradas (Alpha) en Android**: países, lista de testers, subir el `.aab` del build 7 (o uno más reciente si se ha compilado otro), enviar a revisión.
3. **Conseguir 12 testers reales** que acepten la invitación y usen la app activamente — el reloj de 14 días no arranca hasta entonces. Cuanto antes se consigan, antes se desbloquea producción en Android.
4. **Verificar estado real en App Store Connect** (iOS): ¿está completa la ficha (capturas, descripción, App Privacy, clasificación, copyright, texto promocional)? ¿Se pulsó "Enviar para revisión"? Esto se llevaba en otro chat, hay que sincronizar.
5. **Terminar la ficha de Play Store** si falta algo: gráfico de funciones 1024×500 (prompt de `/design` ya preparado en el historial, ver §4), icono 512×512, capturas, descripción.
6. **Arreglar el bug de `loading` infinito** en `AuthProvider` (ver §5.1) antes de que cualquier tester real se tope con un fallo de red y vea una app "rota".
7. **Conseguir un icono de marca real** (1024×1024, sin canal alfa para iOS) y sustituir las tres copias del favicon.
8. **Commitear el trabajo de despliegue** de esta lista (§3) — ahora mismo no hay ni un commit de todo esto. Sugerencia de mensaje: algo tipo `fix: EAS deployment pipeline (icons, deps, pnpm linker, API 36, account-deletion page)`.
9. Una vez pasen los 14 días de pruebas cerradas con 12 testers activos → promocionar a Producción en Play Console.

## 7. Referencias

- Proyecto EAS: https://expo.dev/accounts/danzaapps-team/projects/danza-app
- `projectId`: `40d965cc-2b91-409c-8385-ee3b20cc9814` · `owner`: `danzaapps-team` · cuenta de login EAS: `danzaapp`
- Package/bundle id (ambas plataformas): `com.danzaapp.mobile`
- Dominio de producción: `https://danza-app.com` (ver `ALLOWED_ORIGIN` en `api/account/delete.mjs` y `origin` del plugin `expo-router`)
- Política de privacidad: `https://danza-app.com/policies/privacy-policy`
- Página de borrado de cuenta (para Play Console): `https://danza-app.com/policies/delete-account`
- Apple: `appleId danza.app.official@gmail.com` · `ascAppId 6809233172` · `appleTeamId SW9TW8C6KX`
- Requisito de Google Play para cuentas nuevas: mínimo 12 testers activos, 14 días continuos, en pruebas cerradas, antes de poder publicar en producción.
- Comandos útiles:
  ```bash
  npx eas-cli build -p android --profile production
  npx eas-cli build -p ios --profile production
  npx eas-cli submit -p ios --profile production
  npx eas-cli build:list --platform android --limit 5 --json
  npx eas-cli submit:list --platform ios --limit 5
  npx eas-cli env:list --environment production
  npx eas-cli project:info
  ```
- Skill de diseño del repo para cualquier asset de marca futuro (gráfico de funciones, capturas promocionales): `.claude/skills/design-logic` — paleta negro/blanco + "chrome" plateado + acento morado `#7755FF` muy restringido, tipografía Inter.
