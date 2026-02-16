---
name: managing-data
description: Gestiona la lógica de backend, interacciones con Supabase y validación de datos. Impone el uso de Zod, Service Layer Pattern y manejo estricto de tipos para asegurar un backend robusto y seguro.
---

# Gestor de Datos y Lógica Backend

## Cuándo usar este skill
- Cuando el usuario pide crear Server Actions, API Routes o lógica de base de datos.
- Cuando se necesita integrar Supabase (Auth, Database, Storage).
- Cuando el usuario menciona "Backend", "Base de Datos", "Validación" o "SOLID".

## Flujo de trabajo
1.  **Definir Esquema (Zod)**: Antes de tocar la DB, define el esquema de validación de entrada y salida en `src/schemas/`.
2.  **Service Layer**: **NUNCA** llames a la DB directamente desde un Server Action o Componente.
    -   Crea un servicio en `src/services/<domain>/<domain>.service.ts`.
    -   Implementa la lógica de negocio y llamadas a Supabase allí.
3.  **Server Action / API**:
    -   Importa el servicio.
    -   Valida la entrada con Zod.
    -   Maneja errores con `try/catch` y devuelve un resultado tipado (`Result<T, E>`).

## Instrucciones

### 1. Arquitectura: Service Layer Pattern
Separación estricta de responsabilidades:
-   **Server Actions (`src/actions/`)**: Solo validan entrada (Zod), verifian sesión (Auth) y llaman al servicio. **No contienen lógica de negocio**.
-   **Services (`src/services/`)**: Contienen toda la lógica de negocio, validaciones complejas y llamadas a la DB (Supabase). Son reutilizables.
-   **Repositories (Opcional)**: Si la query es muy compleja, extráela a `src/repositories/`.

### 2. Supabase & Tipado
-   Usa siempre el cliente tipado: `createClient<Database>()`.
-   **NUNCA** uses `any` para resultados de queries. Usa los tipos generados por Supabase CLI.
-   Maneja el null/undefined explícitamente.

### 3. Validación y Seguridad (Zod)
-   **Todo input es hostil**: Valida argumentos de Server Actions con `schema.parse()` o `schema.safeParse()`.
-   **Tipos inferidos**: Usa `z.infer<typeof schema>` para definir interfaces de TypeScript automáticamente.

### 4. Manejo de Errores
-   Estandariza las respuestas. No lances excepciones al cliente sin control.
-   Usa un objeto de retorno estándar:
    ```typescript
    type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };
    ```

### 5. SOLID & Clean Code
-   **Single Responsibility**: Un servicio hace una cosa (ej: `UserService` gestiona usuarios, no pedidos).
-   **Dependency Injection**: Si es posible, inyecta dependencias para facilitar el testing.

## Formato de Salida
1.  **Esquema Zod**: Definición de tipos y validación.
2.  **Servicio**: Clase o funciones exportadas con la lógica.
3.  **Server Action**: Wrapper seguro que expone el servicio al frontend.

## Recursos
-   [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
-   [Zod Documentation](https://zod.dev/)
