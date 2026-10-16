---
name: remove-bg
description: Quita el fondo blanco de los logos de compañías y lo sube a producción, revisando cada resultado antes.
disable-model-invocation: true
argument-hint: "[company-id,...]"
allowed-tools: Bash(node scripts/remove-logo-backgrounds.mjs:*), Bash(node .claude/skills/remove-bg/contact-sheet.mjs:*)
---

# Quitar fondos blancos de logos

Recorre las fases de `scripts/remove-logo-backgrounds.mjs` de principio a fin: prueba, revisión, aplicar e informe. Al escribir `/remove-bg` el usuario ya autoriza subir a producción, así que no pidas confirmación antes de aplicar. A cambio, tú eres la revisión: ningún logo se sube sin que lo hayas visto.

Lanza cada comando desde la raíz del proyecto, tal cual y sin `cd` delante: el script lee `.env` del directorio actual y los permisos solo casan con el comando exacto.

IDs pedidos: `$ARGUMENTS` (vacío = todas las compañías).

## 1. Prueba

```
node scripts/remove-logo-backgrounds.mjs [--only <IDs pedidos>]
```

No toca Supabase. Imprime cuántos logos hay por estado y la carpeta de esta ejecución, que usan los pasos siguientes. Si no hay ninguno en "Fondo blanco quitado" ni en "Revisar: casi todo era fondo", salta al informe.

## 2. Revisión

```
node .claude/skills/remove-bg/contact-sheet.mjs <carpeta>
```

Imprime las rutas de las hojas PNG y, debajo de cada una, el nombre e ID de sus logos. Ábrelas todas con Read. Cada fila muestra el original, el resultado sobre el panel claro de la tarjeta (como se verá en la app) y el resultado sobre cuadrícula, donde se ven los halos y los restos de fondo.

Un logo pasa si en las dos columnas de resultado está entero, con bordes limpios y sin restos del fondo. Exclúyelo si:

- tiene halo, bordes irregulares o manchas del fondo (pasa con JPEG pequeños y con ruido);
- ha perdido parte del logo, como trazos claros que tocaban el borde;
- sobre el panel se ve peor que el original.

Los marcados "casi todo era fondo" son sospechosos: solo pasan si se ven claramente bien. "Baja resolución" no basta para excluir, pero menciónalo en el informe.

El paso termina cuando cada logo de las hojas tiene veredicto, y cada exclusión su motivo.

## 3. Aplicar

```
node scripts/remove-logo-backgrounds.mjs --apply <carpeta> [--exclude <id,id,...>]
```

Si has excluido todos, no lo ejecutes.

## 4. Informe

Al usuario, breve:

- logos aplicados;
- excluidos, con su motivo;
- lo que el paso de aplicar imprimió como "saltado" o "error";
- de la prueba, lo que el script no arregla y hay que cambiar a mano: los logos que no se pudieron descargar (`status: "error"` en `<carpeta>/manifest.json`, con su `error`) y los "Logo blanco sobre transparente" (`white-on-transparent`), que no se ven en el panel claro;
- cómo deshacerlo: `node scripts/remove-logo-backgrounds.mjs --rollback <carpeta>`.
