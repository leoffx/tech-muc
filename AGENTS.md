# Repository Guidelines

## Project Structure & Module Organization
The repo splits into `backend` (Express + Drizzle) and `frontend` (React Router + Vite). Backend code lives in `backend/src` (`routes/`, `services/`, `jobs/`, `utils/`, `ws/`); database schema sits in `src/db/` and generated files land in `drizzle/`. Frontend UI sits in `frontend/app` (`components/`, `hooks/`, `routes/`). Static assets stay in `frontend/public`; update routes through `react-router.config.ts`.

## Build, Test, and Development Commands
- `cd backend && npm run dev` — start the API with live reload via `tsx`.
- `cd backend && npm run build` / `npm run start` — compile to `dist/` then launch the server.
- `cd backend && npm run db:generate` followed by `npm run db:migrate` — update Drizzle migrations and apply to Postgres.
- `cd frontend && npm run dev` — run the React Router dev server (Vite powered).
- `cd frontend && npm run build` — produce client and server bundles; `npm run start` serves the build.
- `cd frontend && npm run typecheck` — run route type generation and TypeScript.

## Coding Style & Naming Conventions
We rely on strict TypeScript; use 2-space indentation, single quotes in backend, and kebab-case filenames (`board-router.ts`). React components stay PascalCase, and hooks follow the `useThing` pattern in `frontend/app/hooks`. Frontend data flows through TanStack Query: place fetch logic in a service module, then wrap it in a hook that calls `useQuery`. Avoid `useEffect` for data fetching and minimize `useState`, leaning on query cache and derived values. Import shared modules with the `~/*` alias. Use `logger` helpers rather than `console` in the backend.

## Testing & Docs
Skip automated tests for now; the toolchain is unset and PRs without tests are acceptable. Focus on stable manual verification (run dev servers, check migrations). Avoid adding extra documentation beyond these guidelines to keep maintenance minimal.

## Commit & Pull Request Guidelines
Use imperative commit messages with optional scopes, e.g. `backend: add ticket websocket`. Reference linked issues and call out migration or config impacts. Pull requests should note backend/frontend touchpoints, list verification steps (dev server, migrations, typecheck), and include UI screenshots or API samples when behavior changes.

## Environment & Configuration
Run `docker-compose up postgres` for local Postgres. Backend expects `.env` with `DATABASE_URL` and CORS origins; never commit secrets. Coordinate websocket changes in `ws/server.ts`, and update defaults via `config.ts` instead of hard-coding.
