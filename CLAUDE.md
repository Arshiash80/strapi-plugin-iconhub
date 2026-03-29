# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
