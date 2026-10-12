# Skills copiadas de mattpocock/skills

Origen: https://github.com/mattpocock/skills, commit `49dd158` (2026-10-09). Licencia MIT.
Se copiaron sin las carpetas `agents/` (son config de Codex, no de Claude Code).

| Skill | Upstream | Invocación | Por qué está |
|---|---|---|---|
| grill-me | productivity | usuario | Pedida |
| grilling | productivity | modelo | Dependencia de grill-me e improve-codebase-architecture |
| tdd | engineering | modelo | Pedida |
| codebase-design | engineering | modelo | Dependencia de tdd e improve-codebase-architecture |
| improve-codebase-architecture | engineering | usuario | Pedida |
| domain-modeling | engineering | modelo | Dependencia de improve-codebase-architecture |
| wizard | engineering | modelo | Pedida |
| teach | productivity | usuario | Pedida |
| wait-what | productivity | usuario | Pedida |
| retro | engineering | usuario | Pedida |
| writing-for-agents | productivity | modelo | Dependencia de retro |

`tdd` cita la skill `code-review`: aquí la resuelve el `/code-review` integrado de Claude Code.

## Cambios locales (reaplicar si se actualiza desde upstream)

- `teach/SKILL.md`: el workspace es `.claude/teach/<topic-slug>/` en vez del directorio actual, para no llenar la raíz del repo de `MISSION.md`, `lessons/`, `GLOSSARY.md`…
- `wait-what/SKILL.md`: re-explica en el idioma del usuario (español por defecto) con las reglas de ASD-STE100, en vez de en inglés; `GLOSSARY.md` es opcional.
