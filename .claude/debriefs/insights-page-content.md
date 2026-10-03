# Página "Insights" de una compañía — `app/insights/[companyId].tsx`

> Documento descriptivo del contenido actual de la pantalla, para pasar a Claude Design.

## Qué es esta página

Es la **pantalla de detalle de una compañía de danza**. Se llega a ella pulsando una tarjeta de compañía (`CompanyCard` → `router.push('/insights/{id}')`). La ruta es pública (`isPublicRoute` la permite sin login), pero **varias partes del contenido están bloqueadas si el usuario no ha iniciado sesión**.

La URL lleva un parámetro `companyId`. Con él se cargan: los datos de la compañía (`useCompany`), sus audiciones (`useCompanyAuditions`), las reviews (consulta directa a Supabase) y los perfiles de los autores de esas reviews.

---

## 1. Estado de carga — Skeleton con shimmer

Mientras cargan los datos de compañía, las reviews o los usuarios (`isLoading || loadingReviews || loadingUsers`), se muestra un **SkeletonLoader a pantalla completa** (fondo blanco) en lugar del contenido real. No es un spinner: es una maqueta gris del layout con **animación shimmer** (opacidad oscilando entre 0.3 y 0.7 en bucle de 1s).

El skeleton reproduce, de arriba a abajo:
- Una **barra de título** (60% de ancho) + un **rectángulo de bandera** al lado.
- Una **fila de ubicación**: círculo (icono) + barra corta de texto (40%).
- **Tres líneas de descripción** de anchos decrecientes (100%, 80%, 60%).
- Una **fila de 3 iconos sociales circulares**.
- **Dos tarjetas grandes** (120px de alto) simulando contenido.

## 2. Estado de error

Si falla la carga de la compañía o no existe, se muestra solo un texto centrado: **"Error loading company details"**.

## 3. Animaciones de la pantalla cargada

- **Fade-in**: cuando los datos están listos, todo el contenedor hace una transición de opacidad 0→1 en 400ms.
- **Header colapsable al hacer scroll**: hay una cabecera fija (sticky, `position: absolute`, arriba) que **se encoge con el scroll**:
  - Altura: de 60px a 40px.
  - Tamaño de fuente del nombre: de 18px a 14px.
  - La interpolación se completa en los primeros 60px de scroll y luego queda fija (clamp).

---

## 4. Header fijo (sticky)

Barra blanca fija en la parte superior, con borde inferior gris muy fino (hairline). Contiene:
- **Nombre de la compañía**, centrado, en negrita, truncado a 1 línea con puntos suspensivos si no cabe (`maxWidth: 850`).
- A la derecha del nombre, la **bandera del país** (`FlagCdn`, 20px) si la compañía tiene `country_iso_code`.

El contenido scrollable lleva un `paddingTop` que deja hueco para este header (76px).

---

## 5. Contenido scrollable (una `FlatList`)

Todo el cuerpo es una `Animated.FlatList` cuyos ítems son **tarjetas de review**. Antes de la lista hay una cabecera (`ListHeaderComponent`) con toda la ficha de la compañía:

### 5.1 Ubicación
Fila con icono de pin (`location-outline`, gris) + texto `company.location` (14px, gris).

### 5.2 Descripción con botón "ver más"
- **En pantallas pequeñas** (`width <= SMALL_SCREEN_BREAKPOINT`): la descripción se muestra **truncada a 2 líneas**. Si el texto tiene más de 140 caracteres, aparece debajo un botón de texto **"view more..."** (12px, gris, subrayado, alineado a la izquierda). Al pulsarlo, el texto se expande completo y el botón pasa a decir **"view less"**. Es un toggle.
- **En pantallas grandes**: la descripción se muestra **siempre completa**, sin botón.
- Estilo del texto de descripción: 12px, color gris.

### 5.3 Fila de redes sociales + favorito
Fila horizontal con `justifyContent: space-between`:
- **Izquierda — `SocialLinks`**: hasta 3 botones circulares (36px, fondo gris claro `#f3f4f6`) con iconos: **web** (`globe-outline`), **Instagram** (`logo-instagram`), **Facebook** (`logo-facebook`). Solo aparecen los que la compañía tenga URL. Abren en pestaña/navegador externo. Si no hay ninguno, no se renderiza nada.
- **Derecha — `FavoriteHeartButton`**: botón de corazón para marcar la compañía como favorita. **Solo se muestra si hay usuario logueado** (`user && ...`).

### 5.4 Sección de audición — `CompanyAuditionSection`
Solo se muestra si la compañía tiene una audición abierta (`hasOpenAudition(company)`), usando `company.auditions[0]`. Es una **tarjeta destacada** con fondo de color propio (`Colors.auditionBgColor`), esquinas redondeadas 12px.

Contenido de la tarjeta:
- **Header**: etiqueta **"🩰 AUDITION"** (pill blanca, mayúsculas, 11px, con letter-spacing) + a la derecha un **status pill** con punto de color:
  - Si el usuario **no está logueado**: el estado se fuerza a **"Locked"** (colores morados, `Colors.purpleLight` / `Colors.purple`).
  - Si está logueado: estado real calculado (`computeStatus`: p. ej. abierta / cerrada / próxima).
- **Título de la audición** (`audition.summary` o "Untitled audition"), 15px, semibold.
- **Location** + **Height requirements** (requisitos de altura por género, formateados tipo "♀ Female: 165–175 cm"). En pantalla grande van en dos columnas; en pequeña, apiladas. Solo aparecen si existen.
- **BLOQUEO POR LOGIN — Fechas**: si hay info de deadline o de fechas de audición:
  - **Usuario NO logueado**: se muestra un **recuadro bloqueado** con borde discontinuo morado (`Colors.purpleSoft`, dashed), icono de **candado** (`lock-closed`), título **"Dates are locked"** y el mensaje *"To view application deadline and audition dates, please:"* seguido de un enlace **"Log in"** (azul, subrayado, con estados hover/pressed) que navega a `/login`.
  - **Usuario logueado**: se muestran las fechas reales:
    - **"Application deadline"**: fecha, "ASAP" o "Always open". Si es fecha fija, es pulsable y abre un evento de calendario (icono `calendar-outline`).
    - **"Audition" / "Audition dates"**: una o varias filas (`single_date`, `to_be_arranged` con nota, o `various_dates` con lista). Las que tienen fecha concreta son pulsables → añadir a calendario.
    - En pantalla grande, deadline y audición van en dos columnas.
- **Description** de la audición (si existe): truncada a 2 líneas con botón **"View more..." / "View less"** si supera 140 caracteres.
- **Contact email** + **Website** (si existen). El website es un enlace subrayado con flecha ↗ y estados hover (cambia a azul), abre externo. En pantalla grande van en dos columnas.
- **Banner de newsletter** (solo si el estado de newsletter del usuario es `not_subscribed`): banner blanco con borde morado tenue, icono de sobre (`mail-outline`) y texto *"Never miss an audition — get weekly alerts"*. Aparece con animación de fade + translateY. Navega a `/newsletter`.

### 5.5 Botones de administración (solo admin)
Si `useRole()` devuelve `isAdmin`, aparece una columna de 3 botones pequeños (alineados a la izquierda, con borde gris fino, icono + texto):
- **"Edit company"** (icono lápiz, fondo blanco) → `/companies/{id}/edit`.
- **"Delete company"** (icono papelera, fondo rojo claro `#fadddd`) → `/companies/{id}/delete`.
- **"Auditions"** (icono notas musicales, fondo lila `#f3f1fe`) → `/companies/{id}/auditions`.

### 5.6 Apartado de Insights (reviews) — el cuerpo de la lista

Los ítems de la `FlatList` son **tarjetas de review** (`ReviewCard`). Además:

- **AI Summary como primera "review"**: si se está generando o ya hay un resumen de IA (`useAiSummary`), se **antepone una tarjeta especial** a la lista con `id: 'ai-summary'`, autor "AI" (avatar propio `ai-summary-profile-pic.png`), y su contenido se va rellenando **en streaming** (SSE desde `/api/summary`), parseando JSON parcial mientras llega.
- **Cada `ReviewCard`** muestra:
  - Avatar + nombre del autor (o **"Anonymous"** si la review es anónima; avatar genérico) + tiempo relativo ("3 days ago", "now", etc.).
  - Contenido estructurado por secciones, cada una con título propio y solo si tiene texto: **Salary & Compensation**, **Repertoire, Operas, Touring & Roles**, **Staff, Classes & Rehearsals**, **Schedule & Holidays**, **Facilities, Wellbeing & Injuries**, **Colleagues & General Mood**, **City, Transport & Living**.
  - Cada sección de más de 300 caracteres se trunca con botón **"See more" / "See less"** (subrayado, gris).
  - **Rating en estrellas** (0–5, con media estrella) si `rating > 0`.
  - Si la review es del usuario actual, aparece un botón de **opciones (⋮)** que abre un menú para **editar** o **borrar** la review (con su modal de confirmación).
  - Las reviews con `hidden: true` no se renderizan.
- **Ordenación**: hay lógica para ordenar por `newest / oldest / highest / lowest` (`selectedFilter`), pero **la barra de filtros está actualmente comentada** en el código (no visible).
- **Estado vacío de la lista**: si no hay reviews, texto centrado **"Insights coming soon"** (16px, gris, margen superior 50px).

> Nota: el botón **"Generate AI Summary"** (`AiButton`, con borde degradado azul/verde/amarillo e icono `sparkles`), el texto de cuota ("You have X of Y left this week…"), la barra de filtros y el botón flotante para crear review **están todos comentados** en el código actual (`{/* COMENTARIO REVIEWS */}`). Existen y están implementados, pero hoy no se muestran. El diseño debería contemplar dónde irían.

---

## 6. Modales (montados, se abren según acción)

- **`InsufficientReviewsModal`**: overlay oscuro + tarjeta blanca centrada. Título **"Oops!"**, mensaje *"Sorry, we don't have enough reviews to generate insights 😅"*, botón azul **"Got it"**. Se dispara al intentar generar el resumen con menos de **3 reviews** (`MINIMUM_REVIEWS_FOR_SUMMARY`).
- **`QuotaModal`**: overlay oscuro + tarjeta **oscura** (`#111`). Título **"AI Summary limit reached"**, texto *"You have used X of Y this week."* + *"You will be able to generate a new summary on {fecha}."*, botón **"OK"** (y opcional **"Upgrade"** azul). Se dispara cuando la cuota de resúmenes IA está agotada (`quota.remaining <= 0`).

## 7. Snackbar

Toast temporal (3s) en la parte superior con icono + mensaje de color (verde éxito, rojo error, ámbar aviso). Se usa para: enviar review, borrar review, actualizar stats de la compañía, etc.

## 8. Banner "ya has opinado"

Si el usuario ya tiene una review para esta compañía (`myReview`), aparece abajo un banner verde claro (`#F0FDF4`) con check verde y texto **"You have already reviewed this company."**

---

## 9. Layout responsive

- En pantallas anchas (`width > LARGE_SCREEN_BREAKPOINT`), el contenedor añade **padding horizontal lateral** proporcional al ancho (`SCREEN_SIDE_PADDING_RATIO`), centrando el contenido.
- El botón flotante (comentado) se reposiciona con ese mismo padding.
- Breakpoints usados: `SMALL_SCREEN_BREAKPOINT` (descripción colapsable, layout de audición), `LARGE_SCREEN_BREAKPOINT` (padding lateral, columnas dobles).

---

## Resumen de bloqueos por autenticación

| Elemento | Sin login | Con login |
|---|---|---|
| Ver la página y descripción | Sí | Sí |
| Botón de favorito (corazón) | Oculto | Visible |
| Estado de la audición | "Locked" (morado) | Estado real |
| Fechas de deadline y audición | Recuadro "Dates are locked" + enlace "Log in" | Fechas reales + añadir a calendario |
| Generar resumen IA (cuando esté activo) | Requiere login ("Not authenticated. Please log in.") | Sujeto a cuota |

---

## Orden visual de la pantalla (de arriba a abajo)

1. Header sticky: nombre de la compañía + bandera (se encoge al hacer scroll).
2. Ubicación (icono pin + ciudad/país).
3. Descripción (colapsable con "view more" en móvil).
4. Fila: iconos de redes sociales (izq) + corazón de favorito (der, solo logueado).
5. Tarjeta de audición (solo si hay audición abierta): estado, título, ubicación, alturas, fechas (bloqueadas si no hay login), descripción, contacto/web, banner newsletter.
6. Botones de admin (solo admin): Edit / Delete / Auditions.
7. Apartado de Insights: tarjeta de resumen IA (si aplica) + lista de reviews, o el texto vacío "Insights coming soon".
8. Overlays: Snackbar (arriba), banner "You have already reviewed this company" (abajo), modales de reviews insuficientes / cuota.
