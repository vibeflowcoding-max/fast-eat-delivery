---
name: creating-skills
description: Genera directorios .agent/skills/ de alta calidad, predecibles y eficientes. Úsalo cuando el usuario pida crear una nueva skill, capacidad para Antigravity o mencione "Gemini creador de skills".
---

# Creador de Antigravity Skills

## Cuándo usar este skill
- Cuando el usuario dice "crea una skill para X".
- Cuando el usuario pide añadir una nueva capacidad al agente que requiere instrucciones persistentes.
- Cuando el usuario menciona "Gemini creador de skills".

## Flujo de trabajo
1.  **Analizar la solicitud**: Identificar el propósito, los disparadores y el alcance de la nueva skill.
2.  **Determinar el nombre**: Elegir un nombre en gerundio (p. ej., `testing-code`, `managing-databases`) que describa la acción principal. Máx. 64 caracteres. Solo minúsculas, números y guiones.
3.  **Redactar la descripción**: Crear una descripción en tercera persona que incluya disparadores/palabras clave específicas. Máx. 1024 caracteres.
4.  **Estructurar el contenido**:
    -   Organizar en secciones: Título, Cuándo usar, Flujo de trabajo, Instrucciones, Recursos.
    -   Aplicar principios de escritura: Concisión, Divulgación progresiva, Grados de libertad.
5.  **Generar archivos**:
    -   Crear el directorio `.agent/skills/<skill-name>/`.
    -   Crear el archivo `.agent/skills/<skill-name>/SKILL.md` con el contenido generado.
    -   Crear directorios opcionales (`scripts/`, `examples/`, `resources/`) si es necesario.

## Instrucciones

### 1. Requisitos estructurales principales
Cada skill que generes debe seguir esta jerarquía de carpetas:

-   `<skill-name>/`
-   `SKILL.md` (Obligatorio: lógica principal e instrucciones)
-   `scripts/` (Opcional: scripts auxiliares)
-   `examples/` (Opcional: implementaciones de referencia)
-   `resources/` (Opcional: plantillas o recursos)

### 2. Estándares de frontmatter YAML
El `SKILL.md` debe comenzar con frontmatter YAML siguiendo estas reglas estrictas:

-   **name**: En forma de gerundio (p. ej., `testing-code`, `managing-databases`). Máx. 64 caracteres. Solo minúsculas, números y guiones. No incluir “claude” ni “anthropic” en el nombre.
-   **description**: Escrito en **tercera persona**. Debe incluir disparadores/palabras clave específicas. Máx. 1024 caracteres. (p. ej., “Extrae texto de PDFs. Úsalo cuando el usuario mencione procesamiento de documentos o archivos PDF.”)

### 3. Principios de escritura
Al escribir el cuerpo de `SKILL.md`, sigue estas buenas prácticas:

-   **Concisión**: Asume que el agente es inteligente. No expliques conceptos básicos (p. ej., qué es un PDF o un repo de Git). Céntrate solo en la lógica única del skill.
-   **Divulgación progresiva**: Mantén `SKILL.md` por debajo de 500 líneas. Si hace falta más detalle, enlaza a archivos secundarios (p. ej., `[Ver ADVANCED.md](ADVANCED.md)`) solo un nivel de profundidad.
-   **Barras**: Usa siempre `/` para rutas, nunca `\`.
-   **Grados de libertad**:
    -   Usa **viñetas** para tareas de alta libertad (heurísticas).
    -   Usa **bloques de código** para libertad media (plantillas).
    -   Usa **comandos Bash específicos** para baja libertad (operaciones frágiles).

### 4. Flujo de trabajo y bucles de feedback
Para tareas complejas, incluye:

1.  **Checklists**: Una checklist en markdown que el agente pueda copiar y actualizar para seguir el estado.
2.  **Bucles de validación**: Un patrón “Plan-Validate-Execute”. (p. ej., ejecutar un script para comprobar un archivo de configuración ANTES de aplicar cambios).
3.  **Manejo de errores**: Las instrucciones de scripts deben tratarse como “cajas negras”: indica al agente que ejecute `--help` si no está seguro.

### 5. Plantilla de salida
Cuando te pidan crear un skill, entrega el resultado en este formato:

#### [Nombre de la carpeta]
**Ruta:** `.agent/skills/[skill-name]/`

#### [SKILL.md]
```markdown
---
name: [nombre-en-gerundio]
description: [descripción en 3ª persona]
---

# [Título del Skill]

## Cuándo usar este skill
- [Disparador 1]
- [Disparador 2]

## Flujo de trabajo
[Inserta aquí una checklist o guía paso a paso]

## Instrucciones
[Lógica específica, snippets de código o reglas]

## Recursos
- [Enlace a scripts/ o resources/]
```

[Archivos de apoyo]
(Si aplica, incluye el contenido de scripts/ o examples/)
