# Agent Guidelines — fast-eat-delivery

> **READ THIS BEFORE MAKING ANY CHANGE.**
> These rules apply to all AI agents: Antigravity, GitHub Copilot, or any other assistant working on this codebase.

---

## 1. Database & API Queries

### 1.1 Select Only What You Need
- **Never use `select *`** on Supabase queries. Always specify the exact column list.
- For related tables (foreign key joins), only include columns that are actually rendered or used in logic.
- If a column is not referenced in the component or service consuming the data, do not include it.

```ts
// ❌ Bad
supabase.from('orders').select('*, customer:customers(*), restaurant:restaurants(*)')

// ✅ Good
supabase.from('orders').select(`
  id,
  status_id,
  delivery_address,
  source,
  customer:customers(id, name, phone),
  restaurant:restaurants(name, address, latitude, longitude)
`)
```

### 1.2 Realtime Subscriptions
- Any realtime `INSERT` listener that re-fetches a row must also use the minimal select, not `*`.
- Same rules apply to `subscribeToAuctions`, `subscribeToOrder`, and any similar subscription helpers.

### 1.3 Null / Error Handling
- Always handle `PGRST116` (not found) gracefully — return `null` instead of throwing.
- Never assume a nullable column is present. Use optional chaining (`?.`).

---

## 2. Components — Frontend

### 2.1 Reuse Before Creating
- **Before creating any new component**, search the codebase for an existing one that does the same or similar thing.
  - Look in `src/components/` first.
  - Check if a slight prop addition to an existing component would cover the new use case.
- Only create a new component if no reasonable reuse exists.

### 2.2 Shared Components
- If the same markup/logic appears in **2 or more places**, extract it into `src/components/` as a shared component immediately.
- Shared components must:
  - Accept props for all variable parts (text, colors, callbacks, etc.)
  - Not have any hardcoded business-specific strings or IDs.
  - Be placed in `src/components/[ComponentName].tsx`.

```
src/
  components/
    OrderCard.tsx       ← shared, used in feed + history
    NavModal.tsx        ← shared navigation modal
    RouteInfoRow.tsx    ← shared route distance display
```

### 2.3 Keep Components Small
- A component file should ideally stay under **200 lines**.
- If a screen or feature requires significantly more code, split it:
  - Create a **sub-folder** for that feature under `app/` or `src/components/`.
  - Extract sub-components into that folder.

```
app/
  order-details/
    index.tsx              ← main screen entry
    AuctionSection.tsx     ← bid form / bid state logic
    OrderMetrics.tsx       ← price / distance display
    NavModal.tsx           ← navigation modal (if not already shared)
```

### 2.4 Props & Types
- Every component must have a typed `Props` interface or `type`. No `any` in component props unless wrapping a third-party type.
- Co-locate the type with the component file unless it is reused elsewhere, in which case move it to `src/types/`.

### 2.5 Styling
- Use `StyleSheet.create` — no inline style objects that recreate on every render.
- Reuse tokens from `src/constants/Theme.ts` (`COLORS`, `SHADOWS`, etc.) — do not hardcode color hex codes outside of the theme file.

---

## 3. Services & Business Logic

### 3.1 Service Layer
- All Supabase calls must live in `src/services/`. Components and screens never import `supabase` directly.
- Each service method must only fetch the fields it documents in its JSDoc/comment.
- If a screen needs different fields than what a service currently provides, add a **new specific method** rather than changing the existing one.

### 3.2 No Business Logic in Components
- Any computation (price calculation, distance math, status label mapping) belongs in a service or a pure helper function in `src/utils/`, not inside JSX.

---

## 4. Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Component files | PascalCase | `OrderCard.tsx` |
| Service files | PascalCase + `Service` suffix | `OrderService.ts` |
| Screen files | kebab-case (Expo Router) | `order-details.tsx` |
| Hook files | camelCase + `use` prefix | `useOrderFeed.ts` |
| Constants | SCREAMING_SNAKE_CASE | `REFRESH_THROTTLE_MS` |
| Type/Interface | PascalCase | `OrderWithExtras` |

---

## 5. General Rules

- **Never commit secrets or API keys**. Use environment variables via `app.config.ts` / `EXPO_PUBLIC_*`.
- **No `console.log` in production code.** Use `console.warn` / `console.error` sparingly and only for actual error cases.
- **Hot-reload safety**: Avoid recreating objects/arrays in render scope without `useMemo`/`useCallback` if they are passed as props or dependencies.
- When adding a new screen, always check if a navigation type update is needed in the router types.
- TypeScript `any` casts should include a comment explaining why it's necessary.
