---
description: Reimplementa una página de Danza App para que coincida visualmente con un diseño de Claude Design, manteniendo toda la funcionalidad y los componentes compartidos
---

# Sincronizar página con diseño

Uso: `/design-page <enlace-claude-design> <página-objetivo>`

Argumentos recibidos: $ARGUMENTS

- Primer argumento: enlace a Claude Design (canvas/artboard con el diseño visual objetivo).
- Segundo argumento: la página a modificar. Puede venir como ruta de la app (`app/companies/index.tsx`), como ruta de navegación (`/companies`) o como nombre corto (`companies`, `perfil`, `landing`). Resuélvelo contra la estructura real de `app/` antes de tocar nada.

Si falta cualquiera de los dos argumentos, pregunta al usuario antes de continuar. No adivines la página si hay ambigüedad (p. ej. "perfil" podría ser `app/profile/index.tsx` o `app/profile/delete-account.tsx`).

## Objetivo

Dejar la página objetivo visualmente igual al diseño de Claude Design, sin romper ni reimplementar nada que ya funcione. Esto es un trabajo de **UI**, no de producto: la lógica de negocio, las llamadas a Supabase/backend y los datos no cambian — solo cómo se presentan.

## Reglas fijas (no negociables)

1. **Cero duplicidad de componentes.** Antes de escribir un componente nuevo, busca con `grep`/`find` en `components/ui/`, `components/common/` y el resto de `components/` si ya existe algo equivalente o muy parecido. Si encuentras algo parecido pero no idéntico, generalízalo (props, variantes) en vez de crear una copia casi igual. Un componente nuevo solo se justifica si de verdad no existe nada reutilizable.
2. **No toques los apartados compartidos entre páginas** (header — `components/RightHeader.tsx`, modales globales como `components/modals/MenuModal.tsx`, providers en `app/_layout.tsx`, tab/nav compartida) salvo que el diseño explícitamente rediseñe ese elemento compartido. Si el diseño sí lo modifica, avisa al usuario de que el cambio afectará a todas las páginas antes de aplicarlo.
3. **No cambies el backend.** Reutiliza los mismos hooks (`hooks/`), servicios (`services/`) y tipos (`types/`) que ya alimentan la página. Si la nueva UI necesita datos que el hook actual no expone, adapta el hook para exponerlos (sin romper a otros consumidores del mismo hook) en lugar de inventar una llamada nueva a Supabase.
4. **Conecta de verdad, no maquetes en falso.** Nada de datos hardcodeados, placeholders estáticos o componentes "bonitos pero muertos". Cada estado visual del diseño (loading, error, vacío, con datos) debe mapear al estado real que ya gestiona el hook/query de esa página.
5. **Respeta la plataforma.** Este es un proyecto Expo (React Native + Web). Los cambios deben funcionar con componentes de React Native / React Native Paper, no HTML/CSS suelto — el resultado tiene que renderizar correctamente tanto en web como en el layout que ya comparten iOS/Android, aunque la verificación visual detallada la hagas en Chrome.
6. **Cero literales mágicos.** Ningún string, número, color o medida repetido o con significado propio va suelto en el JSX/estilos. Colores y tokens de diseño van a `theme/colors.tsx`; medidas de layout/breakpoints a `constants/layout.ts`; el resto de literales reutilizables al fichero de `constants/` que corresponda. Un valor que se usa una sola vez y es trivial (p. ej. un `flex: 1`) no hace falta constantificarlo — usa criterio, el objetivo es evitar "números mágicos" y strings duplicados, no burocracia.
7. **Legibilidad por encima de la brevedad.** Nombres de componentes, props y variables descriptivos; funciones pequeñas con una responsabilidad; sin anidar condicionales/JSX más de lo necesario. Si para encajar el diseño el componente crece demasiado, divídelo en subcomponentes con nombre propio en vez de amontonar todo en un archivo.
8. **Sigue la convención de ubicación existente.** Un componente nuevo va en `components/ui/` (genérico reutilizable en toda la app), `components/common/` (primitivas compartidas) o la carpeta de la feature (`components/auditions/`, `components/landing/`, etc.) según a cuál se parezca más lo que ya hay — nunca una carpeta nueva ad-hoc ni el componente suelto dentro de `app/`.

## Proceso

1. **Localiza la página real.** Usa `find`/`grep` para confirmar el archivo exacto en `app/` y lee sus imports: qué hooks, servicios, tipos y componentes compartidos usa hoy. No empieces a escribir código hasta tener claro el data flow actual.
2. **Mapea qué más depende de lo que vas a tocar.** Antes de modificar un componente, hook o estilo que no sea exclusivo de esta página, busca (`grep` de imports) quién más lo usa. Si otra página depende de ello, o adaptas sin romper a esos otros consumidores, o duplicas el punto concreto que cambia — nunca modifiques a ciegas algo compartido.
3. **Detecta páginas hermanas.** Si la página objetivo comparte layout de sección (un `_layout.tsx` de esa carpeta, o un wrapper visual común) con otras rutas, anótalas: al final del proceso tendrás que comprobar que no se han descuadrado.
4. **Lee el diseño.** Si es una URL de artifact de Claude (`claude.ai/code/artifact/...` o `preview.claude.ai/...`), puedes usar WebFetch directamente. Para un enlace de `claude.ai/design/...` (autenticado, normalmente no legible por WebFetch), el método preferente es abrirlo con la extensión de Claude para Chrome **en una pestaña/ventana aparte** de la que uses para la implementación — esa pestaña navega con tu sesión logueada, así que puede acceder aunque WebFetch no pueda. Déjala abierta: la vas a reutilizar en el paso 8 para comparar en vivo contra la implementación en cada ancho, en vez de fiarte de una lectura única al principio. Si no detectas ninguna herramienta de navegador disponible en esta sesión, dilo explícitamente y pide al usuario una captura o que te describa el diseño — no lo inventes a partir del nombre de la página.
5. **Compara diseño vs. implementación actual** y haz una lista concreta de diffs: layout, espaciados, tipografía, colores, orden de elementos, breakpoints donde cambia la disposición. No implementes todavía.
6. **Captura el "antes".** Con la herramienta de navegador disponible, haz una captura de la página actual en cada uno de los 5 anchos de la sección de verificación (abajo, incluido el suelo de 360px), antes de tocar código. Sirve de referencia para medir el diff real y para el resumen final.
7. **Implementa** los cambios en el/los archivo(s) de esa página (y en componentes nuevos/reutilizados si hace falta), manteniendo intacta la conexión a hooks/servicios existentes y respetando las reglas fijas (sin duplicar componentes, sin literales mágicos, ubicación y nombrado consistentes).
8. **Verifica en el navegador comparando en vivo con el diseño.** Arranca el entorno web si no está corriendo (`pnpm web`) y revisa la página con las herramientas de navegador disponibles en esta sesión (extensión Claude para Chrome u otra herramienta MCP de navegador conectada). Mantén la pestaña del diseño (paso 4) abierta en paralelo a la de la implementación y alterna entre ambas — o colócalas lado a lado si la herramienta lo permite — en vez de comparar de memoria. Si al llegar aquí no detectas ninguna herramienta de navegador disponible, dilo explícitamente y pide al usuario que verifique manualmente antes de dar la tarea por terminada — no la marques como validada sin haberla visto renderizada.
   Los rangos de `constants/layout.ts` marcan dónde cambia el layout, pero no son anchos de prueba concretos — probar solo "un punto cualquiera por debajo de 600px" deja fuera pantallas pequeñas reales. Comprueba, como mínimo, estos anchos exactos:
   - Móvil pequeño: **360px** (suelo — el ancho más estrecho a soportar; aquí es donde antes aparecen overflow o textos cortados)
   - Móvil grande: 599px (justo antes de `MOBILE_BREAKPOINT`, el otro extremo del rango móvil)
   - Tablet: 750px (entre `MOBILE_BREAKPOINT` y `TABLET_BREAKPOINT`)
   - Escritorio estándar: 1100px (entre `TABLET_BREAKPOINT` y `LARGE_SCREEN_BREAKPOINT`)
   - Escritorio grande: 1440px (por encima de `LARGE_SCREEN_BREAKPOINT`)
   En cada ancho: compara visualmente contra el diseño, captura el "después" para el mismo ancho, comprueba que no hay overflow horizontal ni texto cortado, que el header y navegación compartida siguen intactos y funcionales, y que no hay errores en consola. Presta especial atención a 360px: es el que primero revela problemas de espaciado o elementos que no caben. Aprovecha también para comprobar los estados reales de la página (loading, error, vacío, con datos) forzándolos donde puedas (recarga, red lenta, sin resultados) en vez de darlos por buenos solo leyendo el código.
9. **Comprueba coherencia de tema y accesibilidad básica.** Colores y espaciados nuevos deben venir de `theme/colors.tsx`, no de valores sueltos; revisa que el contraste de texto es legible sobre `MD3DarkTheme` (el único tema de la app) y que los estados interactivos (hover/pressed en web) se ven bien. Comprueba también accesibilidad ligera: tamaño táctil mínimo razonable en botones/iconos y que los inputs tengan label o accessibilityLabel — no hace falta una auditoría completa, solo no introducir regresiones evidentes.
10. **Revisa las páginas hermanas** detectadas en el paso 3: ábrelas rápidamente y confirma que el layout compartido no se ha roto visualmente por los cambios.
11. **Verifica la funcionalidad**, no solo el aspecto: interactúa con los elementos de la página (formularios, botones, filtros, modales, favoritos, lo que aplique) y confirma que las llamadas a backend siguen funcionando (datos reales cargan, las mutaciones/acciones tienen efecto, los estados de loading/error se disparan de verdad).
12. **Itera** sobre los diffs encontrados hasta que el resultado coincida con el diseño y todo lo anterior funcione. Si algo del diseño es inviable tal cual (p. ej. rompe accesibilidad, no es viable en RN, o choca con un componente compartido), no lo fuerces: repórtalo al usuario con una alternativa en vez de aplicarlo a medias.
13. **Pasa el gate de calidad** antes de cerrar la tarea — ver checklist final abajo.

## Checklist de calidad final

Antes de cerrar la tarea, corre y confirma:
- `pnpm lint` sin errores nuevos introducidos por tus cambios.
- `npx tsc --noEmit` sin errores nuevos (el proyecto usa TypeScript estricto aunque no tenga script propio de typecheck).
- Sin `console.log`/`console.warn` de depuración, imports sin usar, ni código comentado que dejaste mientras iterabas.
- Ningún literal mágico nuevo que debiera estar en `constants/` o `theme/colors.tsx` (regla 6).
- Ningún componente nuevo que duplique algo ya existente (regla 1).

## Criterio de fin (para el modo loop)

Da la tarea por terminada — y deja de iterar — solo cuando:
- La página coincide visualmente con el diseño en los 5 anchos anteriores, incluido el suelo de 360px.
- No se ha tocado ningún archivo fuera de la página objetivo y sus componentes/hooks directamente relacionados (salvo el caso avisado de elemento compartido rediseñado).
- Las páginas hermanas detectadas en el proceso siguen viéndose bien.
- Todas las llamadas a backend de esa página siguen funcionando con datos reales, sin errores de consola, y los estados (loading/error/vacío/con datos) se han probado de verdad en el navegador.
- No quedan componentes "de mentira" (placeholders, datos falsos, handlers vacíos).
- El checklist de calidad final ha pasado.

Termina tu respuesta con un resumen breve: qué archivos cambiaste, qué diffs quedaron pendientes (si alguno es intencionalmente inviable), en qué anchos verificaste, y adjunta o referencia las capturas antes/después.
