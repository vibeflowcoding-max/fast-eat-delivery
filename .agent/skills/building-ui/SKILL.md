---
name: building-ui
description: Genera componentes UI, páginas web y sistemas completos asegurando una consistencia estricta con el branding, colores, tipografías y sistema de diseño del proyecto. Úsalo cuando el usuario pida crear componentes, páginas, sistemas o mencione "branding", "diseño" o "consistencia visual".
---

# Constructor de UI con Branding

## Cuándo usar este skill
- Cuando el usuario pide crear un nuevo componente (botón, card, navbar, etc.).
- Cuando el usuario pide diseñar o maquetar una página web completa.
- Cuando se necesita asegurar que el código generado cumpla con los estándares visuales de la marca.
- Cuando el usuario menciona "usa el branding", "sigue el diseño" o "estilo visual".

## Flujo de trabajo
1.  **Cargar Branding**: Leer siempre el archivo `.agent/skills/building-ui/resources/branding.json` para obtener los tokens de diseño actuales.
2.  **Analizar Requisitos**: Determinar qué componente o página se necesita y qué rol juega (principal, secundario, informativo, acción).
3.  **Mapear Tokens**: Seleccionar los colores, tipografías y radios de borde del branding que correspondan al elemento.
4.  **Generar Código**: Escribir el código (HTML/CSS/JS o Framework) aplicando los estilos directamente o vía clases utilitarias (e.g., Tailwind) que coincidan con el branding.
5.  **Validar Estética**: Asegurar que el resultado sea visualmente "Premium" y "Wow", respetando la personalidad de la marca ("modern", "medium energy", etc.).

## Instrucciones

### 1. Uso de Colores
Utiliza estrictamente la paleta definida en `branding.colors`.
-   **Primary`**: Para acciones principales, botones destacados, enlaces importantes.
-   **Accent**: Para fondos secundarios, estados de hover sutiles o bordes.
-   **Background**: Para el fondo general de la página o secciones grandes.
-   **Text**: Usa `textPrimary` para contenido legible.

### 2. Tipografía
Respeta las familias y roles definidos en `branding.typography`.
-   Usa la fuente `heading` (e.g., Playfair Display) para títulos y encabezados.
-   Usa la fuente `body` (e.g., Noto Sans JP) para párrafos, inputs y botones.
-   Aplica los tamaños base definidos en `fontSizes` pero escala proporcionalmente para jerarquía.

### 3. Componentes y Espaciado
-   **Border Radius**: Aplica `branding.spacing.borderRadius` (16px) a tarjetas, botones e inputs.
-   **Inputs**: Replica el estilo definido en `branding.components.input` (fondo, borde, radio).
-   **Botones**: Replica el estilo de `branding.components.buttonPrimary` para el CTA principal, incluyendo su sombra específica.

### 4. Estilo y Personalidad
-   El diseño debe reflejar la personalidad: `tone: modern`, `energy: medium`.
-   Usa espacios en blanco generosos (spacing base unit: 8px).
-   Evita colores hardcodeados fuera de la paleta. Si necesitas variación, usa opacidad sobre los colores base.

### 5. Framework
-   Preferencia: Tailwind CSS (según `branding.designSystem.framework`).
-   Si se usa Tailwind, configura o simula la configuración para que `bg-primary` coincida con el hex del branding, o usa valores arbitrarios `bg-[#6A7282]` si no puedes modificar la config global.

## Recursos
-   [.agent/skills/building-ui/resources/branding.json](resources/branding.json)
