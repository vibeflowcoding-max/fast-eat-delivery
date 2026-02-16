---
name: testing-code
description: Garantiza la robustez y funcionalidad del código mediante pruebas unitarias y de componentes. Impone el uso de Vitest/Jest para lógica y React Testing Library para UI. Úsalo SIEMPRE que se cree o modifique lógica compleja o componentes críticos.
---

# Ingeniero de Pruebas (QA Engineer)

## Cuándo usar este skill
- Cuando se crea un nuevo Servicio (`src/services/`).
- Cuando se crea un Componente UI complejo o reutilizable.
- Cuando se refactoriza código existente (para asegurar que nada se rompa).
- Cuando el usuario menciona "Test", "Pruebas", "Vitest", "Jest" o "QA".

## Flujo de trabajo
1.  **Identificar el tipo de test**:
    -   **Lógica de Negocio/Servicios**: Unit Testing (Vitest/Jest).
    -   **Componentes UI**: Component Testing (React Testing Library).
    -   **Hooks**: Hook Testing (`@testing-library/react-hooks`).
2.  **Preparar el entorno**:
    -   Asegurar que las dependencias estén instaladas (vitest, @testing-library/react, etc.).
    -   Configurar mocks para dependencias externas (Supabase, API calls).
3.  **Escribir el test**:
    -   Seguir el patrón **AAA** (Arrange, Act, Assert).
    -   Probar caminos felices (happy paths) y casos de borde (edge cases).
4.  **Ejecutar y Validar**: Correr los tests y verificar que pasen.

## Instrucciones

### 1. Ubicación de los Tests
-   **Co-locación**: Los archivos de test deben estar junto al archivo fuente.
    -   `UserService.ts` -> `UserService.test.ts`
    -   `Button.tsx` -> `Button.test.tsx`
-   O en una carpeta `__tests__` dentro del módulo si hay muchos archivos auxiliares.

### 2. Unit Testing (Lógica/Servicios)
-   **Objetivo**: Verificar que una función pura o un método de servicio retorne lo esperado dado un input.
-   **Mocking**:
    -   Mockea todas las llamadas a Supabase o APIs externas.
    -   Usa `vi.mock()` (Vitest) o `jest.mock()`.
    -   Nunca hagas llamadas reales a la DB en unit tests.

### 3. Component Testing (UI)
-   **Objetivo**: Verificar que el componente renderice correctamente y responda a interacciones.
-   **Reglas**:
    -   Usa `screen` para consultar elementos (`screen.getByRole`, `screen.getByText`).
    -   Prioriza queries por rol (`getByRole`) o texto visible, evitando selectores CSS frágiles (clases, ids).
    -   Simula eventos de usuario con `userEvent` (no `fireEvent`).

### 4. Buenas Prácticas
-   **Nombres Descriptivos**: `it('should return error when email is invalid', ...)`
-   **Aislamiento**: Cada test debe ser independiente. Limpia mocks entre tests (`afterEach(() => vi.clearAllMocks())`).
-   **No pruebes implementación, prueba comportamiento**: No testeos estados internos, testea lo que el usuario ve o el resultado final.

## Plantilla Básica (Vitest)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myService } from './myService';

describe('myService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should perform expected action', async () => {
        // Arrange
        const input = '...';
        
        // Act
        const result = await myService.action(input);
        
        // Assert
        expect(result).toBeDefined();
    });
});
```

## Recursos
-   [Vitest Documentation](https://vitest.dev/)
-   [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
