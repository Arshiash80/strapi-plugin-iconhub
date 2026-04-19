# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Public open-source repo — guardrails

This repo is public (MIT, published as `@arshiash80/strapi-plugin-iconhub`). Treat every change — code, commits, PR text, issue comments, docs — as world-readable and permanent in git history. Before any commit, review the diff for leaks.

### Never commit
- Secrets of any kind: API keys, tokens, passwords, signed URLs, session cookies, OAuth client secrets, private keys, `.env*` files.
- Personal data beyond what's already public in `package.json` / `LICENSE` (maintainer name + email). No other people's emails, usernames, IPs, machine names, or absolute local paths (e.g. `/Users/<name>/...`).
- Internal URLs, private repo links, staging hosts, or anything that identifies non-public infra.
- Real customer data, Strapi admin dumps, database snapshots, or copy-pasted production logs.
- AI-tool artifacts that aren't intentional contributions: local agent caches, `.claude/settings.local.json` (already gitignored globally), transcripts.

### Handling secrets safely
- `.env` is gitignored — keep it that way. If a new script needs config, read from `process.env` and document the required var names in README/AGENTS.md without example values that look real.
- Cloudinary `cloud_name` in `docs/readme-media-manifest.json` is a public identifier, not a secret. `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are secrets and must never appear in tracked files, logs, or error messages.
- If you ever see a secret in a diff, staged file, or committed file: stop, tell the maintainer, and do not push. Rotation first, history rewrite second.
- Don't paste `.env` contents, tokens, or tool outputs containing them into commit messages, PR descriptions, issue comments, or code comments.

### Code & dependencies
- No telemetry, analytics, or outbound network calls beyond the already-documented Iconify API (`https://api.iconify.design`). New endpoints need an explicit maintainer decision and doc update.
- Don't hardcode environment-specific URLs or absolute paths. Use config-driven behavior; isolate external HTTP calls in `admin/src/libs/`.
- Dependency changes: prefer well-maintained, permissively-licensed (MIT/Apache-2.0/ISC/BSD) packages. Flag GPL/AGPL/CC-NC pulls to the maintainer — they're incompatible with this plugin's MIT license.
- Don't add lockfile-only tweaks, postinstall scripts, or binary blobs without explanation.

### Contributor etiquette
- Assume PRs may come from strangers. Be explicit in error messages and README steps; avoid insider shorthand.
- Commit messages and PR bodies are public — focus on the change and its motivation, not internal context or speculation about unrelated users.
- Respect contributor attribution: don't rewrite or squash other people's commits without reason.

## Commands

```bash
# Build the plugin (compiles both admin and server)
npm run build

# Watch mode for development (link to a Strapi project)
npm run watch:link

# Type-check the admin (frontend) TypeScript
npm run test:ts:front

# Type-check the server (backend) TypeScript
npm run test:ts:back

# Verify the plugin package
npm run verify
```

There are no unit tests — TypeScript type checking (`test:ts:front` / `test:ts:back`) is the primary correctness check.

## Architecture

This is a **Strapi v5 plugin** that registers a custom JSON field called `iconhub`. It has two halves:

### `server/` — Strapi server-side plugin
- `src/register.ts`: Registers the `iconhub` custom field with Strapi core as type `json`
- `src/index.ts`: Exports the plugin's lifecycle hooks (register, bootstrap, destroy) and wires together controllers, services, routes, content-types, middlewares, and policies
- The server side is minimal — the plugin has no custom content types or API routes of substance; the real logic is in the admin

### `admin/` — Strapi admin panel UI (React)
- `src/index.ts`: Registers the custom field with the admin app, defines its icon, i18n labels, and advanced options (storage config + validation). Uses `yup` for custom validation ensuring at least one of `storeIconData` / `storeIconName` is selected.
- `src/components/IconHubInput.tsx`: The main field input component. Renders a text field (triggers icon picker modal on click) plus an edit button. Manages all state: selected icon, search results, pagination, and the editable "info modal" for color/SVG/name editing.
- `src/components/IconGrid.tsx`: Grid display of icon search results.
- `src/components/IconPickerIcon.tsx`: Plugin icon shown in the admin UI.
- `src/libs/iconifyApi.ts`: Wraps Iconify's REST API (`https://api.iconify.design`) — `searchIcon` for text search, `getIconSetByPrefixes` for listing collections.

### Data flow
1. User opens the icon picker modal → `searchIcon` hits Iconify API → results rendered in `IconGrid`
2. User selects icon → `getIcon` from `@iconify/react` fetches the SVG body locally → stored per the `storeIconName`/`storeIconData` field options
3. The stored JSON shape is `{ iconName, iconData, width, height, color, isSvgEditable, isIconNameEditable }`

### Key design decisions
- **Storage options**: `storeIconName` (Iconify identifier) and `storeIconData` (raw SVG body) are per-field options configured in Content-Type Builder; defaults are both `true` for backward compatibility
- **Backward compatibility**: The component guards against missing `color`, `isSvgEditable`, and `isIconNameEditable` fields (added in later versions) by defaulting them on read
- **Edit modal**: SVG data and icon name are read-only by default, requiring explicit "Enable Editing" toggle to prevent accidental corruption
- The plugin uses Tailwind CSS v4 (via `@tailwindcss/vite`) alongside Strapi Design System components
