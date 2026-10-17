# Traspaso: Resources — el directorio de servicios, profesionales y escuelas

Última actualización: 2026-10-17. Rama `feat/resources` (5 commits sobre `main` en `4ffdd2e`). **Nada de esto está en producción todavía.**

## 1. Qué es

Un segundo listado en danza-app, al lado del de compañías: escuelas de danza, profesores
freelance, fotógrafos, fisios, estudios de yoga/pilates/barre, entrenadores personales,
nutricionistas y bienestar general. A diferencia de las compañías —que mantenemos
nosotros— **cada profesional escribe su propia ficha** a través de un onboarding por
pasos, y nosotros revisamos y publicamos.

El objetivo de producto declarado al arrancar: **reducir las bajas en el registro**. Casi
todas las decisiones raras de este trabajo se explican por ahí.

## 2. Estado actual

| Paso | Qué | Estado |
|---|---|---|
| 1 | Esquema, vistas, RPC, RLS, tipos y servicios | Hecho y probado contra Postgres real |
| 2 | Registro bifurcado (bailarín / profesional) | Hecho |
| 3 | Onboarding por pasos | Hecho |
| 4 | Listado público `/resources` y ficha `/resources/[slug]` | Hecho |
| 5 | Cola de revisión `/admin/resources` | Hecho |

Verificado: migración aplicada sobre todo el historial, 16 escenarios SQL contra Postgres,
218 tests de Jest, typecheck limpio (los errores que quedan en `tsc` son preexistentes del
repo: `hovered` de Pressable, `boxSizing`, `enableHalfStar`), y el flujo completo recorrido
en un navegador contra el Supabase local.

**Lo que NO está hecho**, por orden de importancia:

- **La migración no está en producción.** Es la primera decisión al retomar.
- Paginación del listado (la constante `RESOURCES_PER_PAGE` existe, no se usa).
- No hay entrada propia de "editar mi ficha" una vez publicada: se edita volviendo a
  `/onboarding`, que reanuda y permite repasar los pasos. Funciona, pero no se anuncia.
- Si en producción está activada la confirmación por email, el profesional vuelve del
  enlace a `/onboarding` (el `emailRedirectTo` ya lo contempla) y recupera su borrador del
  dispositivo. **Sin probar contra producción.**
- Sin reseñas y sin precios: descartados explícitamente por el usuario el 2026-10-17.

## 3. Las tres decisiones que hay que entender antes de tocar nada

Están razonadas en `docs/adr/0002-resources-directory.md`; el vocabulario, en `GLOSSARY.md`.

1. **Una tabla para los ocho tipos**, con los campos "custom" que comparten varios tipos
   como columnas reales (año, fundador, experiencia, método, especialización, relación con
   la danza, estilo de clase). Ni JSONB ni una tabla por tipo.

2. **Qué se le pregunta a cada tipo es un dato, no un `if`.** La tabla
   `resource_type_fields` dice, por tipo: qué campos, en qué pantalla, en qué orden, cuáles
   hacen falta para publicar y con qué mínimo (3 fotos para un fotógrafo). De ahí beben
   cuatro cosas que si no se desincronizarían: el formulario, la validación al publicar, el
   porcentaje de perfil y por dónde se reanuda. La función `resource_field_state()` es la
   única que sabe traducir "campo → ¿está contestado?".

   > Añadir un **tipo** = insertar filas + escribir su copy. Añadir un **campo** = además,
   > enseñárselo a `resource_field_state()` (SQL), a `payloadForFields()` y a
   > `OnboardingField` (cliente). Un campo que la función no conozca cuenta como no
   > contestado y **bloquea publicar**: falla a gritos, no en silencio.

3. **El puesto en el listado se deriva, no se escribe.** `region_scope` manda: `fixed` (1
   región) → `multiple` (2-3) → `nationwide` (ninguna, aparece en todas las de su país).
   No hay columna de ranking que nadie pueda tocar. La vista
   `resource_region_placements` da a cada ficha nacional una fila por región, que es lo que
   permite que el listado filtrado sea un `join` y un `order by`.

## 4. El onboarding, y por qué en ese orden

8 pantallas: **tipo → nombre → [muro de cuenta] → alcance → contacto → lo tuyo → que se te
vea → repasar y enviar.**

- El **tipo primero**: ocho tarjetas, un clic, cero teclado. Es la pregunta que la gente
  quiere contestar.
- El **muro de cuenta es el paso 3, no el 1**, y enseña lo que ya lleva hecho ("Ana García
  Photography · Photographer"). Abandonar cuesta más que seguir.
- Lo elegido antes de tener cuenta vive en el dispositivo (`services/resourceDraft.ts`),
  porque la sesión nueva **remonta todo el árbol de providers** (`key={sessionKey}` en
  `app/_layout.tsx`) y confirmar el email por enlace recarga la app entera.
- Desde ahí, **cada pantalla guarda solo lo suyo**: en `save_resource`, una clave ausente no
  toca lo guardado. Por eso se puede guardar a medias sin borrar el resto.
- **Dónde continuar lo dice la base de datos** (`next_field` / `next_step` en la vista): el
  primer campo que no está ni contestado ni saltado. No hay contador de pasos que pueda
  desincronizarse.
- **"Lo añado luego"** es un botón, se recuerda (`resource_skipped_fields`) y no se vuelve a
  preguntar en el flujo. Saltar retrasa publicar; no exime de nada.
- La **tarjeta en vivo** al lado enseña lo que verán los bailarines mientras escribe.
- La revisión **se avisa en la primera pantalla**, no al final.

El copy vive en `constants/resourceOnboarding.ts` (TypeScript, no base de datos: arreglar
una errata no debería ser una migración). Los `Record<...>` completos hacen que el
compilador avise si se añade un tipo o un campo y se olvida su texto.

## 5. Cómo levantarlo para seguir

```bash
# 1. Base de datos local con esta migración incluida
npx supabase db start          # si no está arriba
npx supabase db reset          # aplica todo el historial, incluida la de Resources

# 2. La app contra ese Supabase local (el .env del worktree ya apunta ahí)
pnpm start --port 8082         # 8081 suele estar ocupado por otra rama

# 3. Las reglas del esquema, contra Postgres de verdad
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f scripts/test-resources.sql
```

`scripts/test-resources.sql` cubre: las reglas de regiones por alcance, publicar
incompleto, publicar/verificar sin ser admin, una segunda ficha en la misma cuenta, ver o
escribir la ficha de otro, el mínimo de fotos del fotógrafo, la mudanza de país y lo que ve
un visitante anónimo. Si tocas el esquema, pásalo.

**Atajo para entrar con sesión sin repetir el alta** (probando contra local): pide el token
a GoTrue (`POST /auth/v1/token?grant_type=password` con la `apikey` anon) y escríbelo en
`localStorage` bajo `sb-127-auth-token` — la clave sale del host, `127.0.0.1` → `sb-127`.

## 6. Decisiones pendientes de confirmar con el usuario

1. **Los emails de contacto se ven sin cuenta.** En audiciones se decidió lo contrario
   (invitados ven los enlaces bloqueados). Aquí se hizo al revés a propósito: una ficha de
   directorio cuyo contacto no se ve no sirve de nada. **Sin confirmar.**
2. **Personal trainer, nutricionista y bienestar general**: el usuario no definió sus
   campos. Heredan el patrón del fisio (experiencia obligatoria; especialización y relación
   con la danza opcionales). **Revisar.**
3. **Regiones**: hay catálogo para 15 países (191 regiones) y la migración solo siembra los
   que ya tienen alguna compañía, como se pidió. Suelta un `raise notice` con los países que
   tienen compañía y no tienen catálogo: mirarlo al aplicar en producción. Un país sin
   regiones no se rompe — sus fichas solo pueden ser `nationwide`.
4. **Desempate dentro del mismo puesto**: hoy `verified` y luego nombre. El usuario dijo que
   no le preocupa; si algún día molesta, la alternativa era rotación diaria.

## 7. Mapa de archivos

```
supabase/migrations/20261016234648_resources.sql   todo el esquema, RLS, RPC y vistas
docs/adr/0002-resources-directory.md               por qué está modelado así
GLOSSARY.md                                        sección "Resources": el vocabulario
scripts/test-resources.sql                         las reglas, contra Postgres

types/resource.ts                 enums como `as const` + el tipo de la vista y del payload
constants/resources.ts            espejos de los CHECK (longitudes, patrón de URL, carpeta)
constants/resourceOnboarding.ts   TODO el copy, por tipo y por campo
services/resources.ts             lo único que habla con Supabase sobre Resources
services/resourceDraft.ts         lo elegido antes de tener cuenta
utils/resourceOnboarding.ts       guion, estado del formulario, payload y validación
utils/resourceErrors.ts           traduce los errores de Postgres a frases

hooks/useResourceOnboarding.ts    el estado del alta
hooks/useResourceDirectory.ts     filtros del listado
app/onboarding/index.tsx          el controlador de las 8 pantallas
app/resources/                    listado y ficha pública
app/admin/resources.tsx           cola de revisión
components/resources/             tarjetas, chips, selector de país; onboarding/ los campos
```

## 8. Trampas conocidas (ya pisadas)

- **`zIndex` y desplegables.** En RN-web los hermanos sin `zIndex` se pintan en orden, así
  que lo que va *debajo* tapa la lista abierta de un `DropDownPicker`. Los campos de cada
  paso llevan `zIndex` descendente y la fila de filtros del listado va por encima de la
  rejilla. Si añades un desplegable nuevo, acuérdate.
- **`flexGrow` reparte el eje principal.** `ChoiceCard` lo usa para repartir ANCHO dentro de
  una fila con wrap. Metida en una columna reparte ALTO y las tarjetas salen estiradas y
  medio vacías (pasó en `/register`).
- **No hagas `supabase db reset` desde otro worktree** mientras pruebas este: el local se
  reconstruye con las migraciones de *esa* rama y Resources desaparece.
- **El `.env` del worktree apunta al Supabase local** y está en `.gitignore`. Contra
  producción, `/resources` y `/onboarding` fallan hasta que la migración esté aplicada.
- El error `Invalid style property of "background"` que sale por consola es **preexistente**
  del repo, no de este trabajo.

## 9. Si lo retoma un LLM

Lee, por este orden: `docs/adr/0002-resources-directory.md` (el porqué), la sección
"Resources" de `GLOSSARY.md` (cómo se llaman las cosas: es **resource**, nunca "listing") y
la cabecera de la migración. Con eso, el resto del código se explica solo.

Dos reglas que este trabajo respeta y conviene no romper:

- **La base de datos es la que valida.** El cliente valida antes para dar buenos mensajes,
  pero la verdad está en los CHECK, los triggers y RLS. No muevas una regla al cliente.
- **Lo que se pregunta es configuración, no código.** Si te encuentras escribiendo
  `if (type === 'photographer')` en una pantalla, casi seguro que lo que quieres es una fila
  en `resource_type_fields`.
