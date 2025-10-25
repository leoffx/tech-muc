# Repository Guidelines

## Project Structure & Module Organization

- `src/app` houses the Next.js App Router entry points; keep shared UI in `_components` and colocate route-specific logic with its route.
- `src/server` contains tRPC routers; add new procedures under `src/server/api/routers` and expose them via `src/trpc`.
- `convex` stores Convex schemas (`schema.ts`), server functions (`tickets.ts`), and generated client bindings (`_generated`); regenerate bindings when the schema changes.
- `public` holds static assets, and `old_backend` is legacy reference code—modify it only when migrating data forward.

## Build and Development Commands

- `npm run dev` starts the local Next.js dev server with Turbo mode.
- `npm run build` creates an optimized production build; pair with `npm run preview` to verify it locally.
- `npm run lint` (or `npm run lint:fix`) runs the Next.js ESLint suite.
- `npm run check` chains linting with `tsc --noEmit`; treat this as the minimum pre-PR gate.
- `npm run format:write` applies Prettier with the Tailwind plugin; use before committing files that include JSX or Tailwind classes.

## Coding Style & Naming Conventions

- Use TypeScript throughout; React components live in `*.tsx` files and should follow PascalCase names, while hooks start with `use`.
- Allow Prettier to manage formatting (2-space indent, double quotes, Tailwind class sorting) and avoid manual tweaks that fight the formatter.
- Prefer type-only imports (`import type`) and prefix intentionally unused variables with `_` to satisfy ESLint.
- Keep Convex function names action-oriented (e.g., `tickets.list`) and colocate related schema and server logic.
- Avoid `useEffect`, unless for legit cases.
- Minimize `useState` by deriving state when possible.
- Always when possible prefer using ShadCN components instead of creating your own.
- Use skeleton for handling loading states, do not use text like "Loading"
- Handle empty states properly

## Commit & Pull Request Guidelines

- Follow the existing concise, imperative commit style (`integrate convex`, `rename tasks to tickets`).
- Each PR should summarize the change, highlight Convex schema updates, attach UI screenshots or clips when relevant, and link related issues.
- Run `npm run check` (and any new tests) before requesting review, and call out data migrations or environment changes in the PR body.
