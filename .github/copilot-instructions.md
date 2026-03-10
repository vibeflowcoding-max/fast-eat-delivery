# Copilot Instructions — fast-eat-delivery

> Read [AGENT.md](../AGENT.md) for the full guidelines. This file is a summary for VS Code Copilot.

---

## Database & Supabase Queries

- **Never use `select *`**. Always list only the columns the component/screen actually uses.
- Join related tables with minimal fields too — e.g., `customer:customers(id, name, phone)` not `customer:customers(*)`.
- Realtime listeners that re-fetch a row must also use the minimal select.
- Handle `PGRST116` (row not found) by returning `null`, not throwing.
- All Supabase calls must live in `src/services/`. **Components never import `supabase` directly.**

## Components

- **Before creating a new component**, search `src/components/` for an existing one to reuse.
- If the same UI block appears in 2+ places → extract a shared component to `src/components/`.
- Keep components **under ~200 lines**. If a feature needs more code, create a sub-folder:
  ```
  app/order-details/
    index.tsx
    AuctionSection.tsx
    OrderMetrics.tsx
  ```
- All components must have a typed `Props` interface — no untyped `any` in props.
- Use `StyleSheet.create` + tokens from `src/constants/Theme.ts`. No inline objects, no hardcoded hex colors.

## Services & Logic

- Business logic (price calc, distance math, status mapping) goes in `src/services/` or `src/utils/`, not in components.
- If a screen needs different fields than an existing service method, add a **new method** — don't change the existing one.

## Naming

| Type | Convention |
|---|---|
| Component | `PascalCase.tsx` |
| Service | `PascalCase + Service.ts` |
| Screen (Expo Router) | `kebab-case.tsx` |
| Hook | `useCamelCase.ts` |
| Type/Interface | `PascalCase` |

## General

- No `console.log` in production code.
- No secrets or API keys in source — use `EXPO_PUBLIC_*` env vars.
- TypeScript `any` casts need an inline comment explaining why.
