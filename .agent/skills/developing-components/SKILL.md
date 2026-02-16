---
name: developing-components
description: Genera código UI robusto, mantenible y escalable en Next.js (App Router) y TypeScript. Prioriza la reutilización, atomicidad y tipado estricto. Úsalo para crear componentes complejos o cuando se requiera nivel "Senior Frontend Architect".
---

# Desarrollador de Componentes UI (Senior Architect)

## Cuándo usar este skill
- Cuando el usuario pide crear un nuevo componente o feature en Next.js.
- Cuando se requiere código de alta calidad, robusto y escalable.
- Cuando el usuario menciona "Senior Frontend Architect", "Atomicidad", o "Best Practices".

## Flujo de trabajo
1.  **Análisis Previo**:
    -   ¿Qué pide el usuario? -> Desglose de UI.
    -   **CRÍTICO**: ¿Existe algo en `@/components/shared` o `@/components/ui` que sirva? -> Búsqueda.
    -   ¿Es un componente Server o Client? -> Decisión de arquitectura.
2.  **Estrategia de Atomicidad**:
    -   Si el componente excede ~150 líneas -> Dividir en subcomponentes (`FeatureHeader.tsx`, `FeatureBody.tsx`).
    -   Si hay lógica compleja -> Extraer a Custom Hook (`useFeatureLogic.ts`).
3.  **Generación de Código**:
    -   Escribir interfaces de props exportadas.
    -   Implementar componente principal y subcomponentes.
    -   Aplicar Tailwind CSS y clsx/tailwind-merge.

## Instrucciones

### 1. Reglas de Oro (Estrictas)
-   **No Duplicar**: Antes de codificar, escanea componentes existentes. Si uno sirve al 80%, extiéndelo.
-   **Atomicidad**: Máximo 150 líneas por archivo. Divide y vencerás. Co-loca subcomponentes en la carpeta del feature.
-   **Tipado Estricto**:
    -   Usa `interface` para Props.
    -   Prohibido `any`. Usa `unknown` + validación si es necesario.
    -   Retornos explícitos: `: JSX.Element` o `: React.ReactNode`.
    -   Estados finitos: Usa Union Types (`status: 'loading' | 'success' | 'error'`).
-   **App Router**:
    -   Por defecto: **Server Component**.
    -   Solo usa `"use client"` si es estrictamente necesario (hooks, eventos DOM).
    -   Mueve la interactividad a las hojas (leaf components).
-   **Estilos**: Tailwind CSS. Usa `clsx` o `tailwind-merge` para clases dinámicas. Evita `style={{}}`.

### 2. Formato de Salida
Al entregar el código, estructura la respuesta así:
1.  **Explicación Arquitectónica**: Breve justificación de qué se crea y qué se reutiliza.
2.  **Código**: Componente principal, subcomponentes e interfaces.

## Recursos
-   [Documentación Next.js App Router](https://nextjs.org/docs/app)
-   [TypeScript Handbook](https://www.typescriptlang.org/docs/)
