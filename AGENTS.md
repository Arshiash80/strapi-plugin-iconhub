# Repository Guidelines

## Project Structure & Module Organization
This repository is a Strapi plugin with a split admin/server layout. `admin/src/` contains the React-based admin UI, including pages, hooks, reusable icon picker components, and Iconify helpers. `server/src/` contains plugin registration, routes, controllers, services, and config for the Strapi backend. Static documentation images live in `assets/docs/`, and plugin branding assets live under `admin/src/assets/`.

## Build, Test, and Development Commands
Install dependencies with `npm install`.

- `npm run build` builds the plugin for distribution into `dist/`.
- `npm run watch` rebuilds on change during local plugin development.
- `npm run watch:link` watches and links the plugin into a local Strapi app.
- `npm run verify` runs Strapi plugin verification checks before publishing.
- `npm run test:ts:front` type-checks the admin code with `admin/tsconfig.json`.
- `npm run test:ts:back` type-checks the server code with `server/tsconfig.json`.

Use `npm run test:ts:front && npm run test:ts:back` before opening a PR.

## Coding Style & Naming Conventions
The codebase is TypeScript-first and uses Prettier (`prettier@3`) for formatting. Follow the existing style: 2-space indentation, single quotes, semicolons, and trailing commas where Prettier inserts them. Use PascalCase for React components (`IconSetFilterPanel.tsx`), camelCase for hooks and utilities (`useIconCollections.ts`, `iconSetUtils.ts`), and keep Strapi server exports grouped by concern in `controllers/`, `routes/`, and `services/`.

## Testing Guidelines
There is no dedicated unit test suite yet; the current safety net is compile-time validation. Treat both TypeScript checks as required for every change. When editing UI behavior, also verify the flow manually in a local Strapi app: plugin registration, custom field configuration, icon search, filtering, and save behavior.

## Commit & Pull Request Guidelines
Recent history follows short Conventional Commit prefixes such as `feat:`, `fix:`, and `docs:`. Keep commits focused and descriptive, for example `fix: preserve selected prefixes after search`. PRs should include a short summary, testing notes, linked issues when applicable, and screenshots or GIFs for admin UI changes.

## Security & Configuration Tips
Do not hardcode environment-specific URLs or Strapi app paths. Keep external Iconify access isolated to `admin/src/libs/`, and prefer configuration-driven behavior over inline constants when adding plugin options.
