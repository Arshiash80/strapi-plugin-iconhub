<!-- Edit this file, then run `npm run docs:readme` to regenerate README.md. -->

# Strapi IconHub

![Strapi IconHub](assets/docs/og-image.jpg)

IconHub is a custom field for Strapi that brings the Iconify catalog into the admin panel. Editors can browse icon sets, search globally, inspect a single set in detail, apply colors, and store either the Iconify name, raw SVG, or both.

[![Strapi](https://img.shields.io/badge/Strapi-v4%20%7C%20v5-2F2E8B?style=flat&logo=strapi)](https://strapi.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Why IconHub

- Built for Strapi editors, not just developers wiring icons in code
- Access to 200,000+ icons through Iconify without shipping a bundled icon pack
- Category-level restrictions in Content-Type Builder to keep fields focused
- Collection-first browsing flow for teams that do not know the exact icon name
- Raw SVG storage support for fast frontend rendering and external-API independence

## Compatibility

- Strapi v4 and v5
- TypeScript-ready admin and server packages
- Frontends that render Iconify names, raw SVG, or both

## Installation

```bash
npm i @arshiash80/strapi-plugin-iconhub
```

Rebuild the admin panel after installation:

```bash
npm run build
npm run develop
```

Verify the plugin in **Settings > Plugins**.

![Plugin verification](assets/docs/plugin-verification.png)

## Add the field to a content type

Open **Content-Type Builder**, add a new custom field, and select **IconHub**.

![Custom field tab](assets/docs/custom-field-tab.png)
![IconHub custom field selection](assets/docs/iconhub-custom-field-selection.png)

The field then appears in the content entry UI like any other Strapi input.

![Empty IconHub field input](assets/docs/icon-custom-field-input.png)

## Field configuration

### Storage strategy

IconHub supports three storage modes:

- `iconName`: store the Iconify identifier, such as `mdi:home`
- `iconData`: store raw SVG markup
- both: keep the identifier and SVG together for maximum flexibility

This is configured in the field settings.

![Configure storage preferences](assets/docs/configure-storage-preferences.png)

### Restrict available icon set categories

In **Basic Settings**, you can decide which Iconify collection categories are available for this field. This is the main control for narrowing the picker to a design system, brand icon family, emoji-only field, and similar editorial use cases.

![Configure available icon set categories](assets/docs/configure-available-icon-set-categories.png)

## Editor workflow

### 1. Browse icon sets

The default picker state is built around icon-set discovery. Editors can browse allowed categories first, then open a set when they want a tighter visual search space.

![Picker default state example 1](assets/docs/icon-picker-modal-default-state-with-icons-sets-and-no-search-example.png)
![Picker default state example 2](assets/docs/icon-picker-modal-default-state-with-icons-sets-and-no-search-example-2.png)
![Picker default state example 3](assets/docs/icon-picker-modal-default-state-with-icons-sets-and-no-search-example-3.png)

### 2. Refine the available sets

The discovery view supports metadata-driven filtering for common browsing patterns:

- tag filtering
- grid / icon height filtering
- palette and license filtering

![Filter icon sets by tag](assets/docs/icon-picker-modal-default-state-with-icons-sets-and-no-search-filter-by-tag-example.png)
![Filter icon sets by grid](assets/docs/icon-picker-modal-default-state-with-icons-sets-and-no-search-filter-by-grid-example.png)
![Filter icon sets by palette and license](assets/docs/icon-picker-modal-default-state-with-icons-sets-and-no-search-filter-by-palette-and-license-example.png)

### 3. Search globally or open a specific set

Editors can search across all allowed sets from the main toolbar, or open a single set for focused browsing and in-set search.

![Google Material Icons set view](assets/docs/icon-picker-modal-google-material-icons-icon-set-example-state-for-showing-search-inside-iconset.png)

The set browser keeps the current set context visible:

- set name and author
- icon count
- palette information
- in-set category chips
- set-local search input

### 4. Review different icon families

The picker works well across both monotone and multicolor sets.

![Material Design icons example](assets/docs/icon-picker-modal-icons-demo-material-design-icons-iconset-example.png)
![Fluent UI System Color icons example](assets/docs/icon-picker-modal-icons-demo-fluent-ui-system-color-icons-iconset-example.png)
![Emoji One icons example](assets/docs/icon-picker-modal-icons-demo-emoji-one-icons-iconset-example.png)
![Stickies color icons example](assets/docs/icon-picker-modal-icons-demo-stickies-color-icons-iconset-example.png)

### 5. Edit and customize the selected icon

Once an icon is selected, the field shows the chosen icon in the entry form and exposes an edit action for further adjustments.

![Field input with selected icon and color](assets/docs/icon-custom-field-input-with-selected-icon-and-color.png)
![Edit button on field input](assets/docs/icon-custom-field-input-edit-button.png)

The edit modal includes:

- live preview
- visual color picker
- hex input
- icon name and raw SVG editing controls
- download actions for exported assets

![Icon edit modal](assets/docs/icon-picker-edit-modal.png)
![Visual color picker](assets/docs/icon-picker-edit-modal-color-picker.png)

## Stored value shape

Depending on configuration, IconHub stores some or all of the following fields:

```ts
type IconFieldValue = {
  iconName: string | null;
  iconData: string | null;
  width: number | null;
  height: number | null;
  color?: string | null;
  isSvgEditable?: boolean;
  isIconNameEditable?: boolean;
};
```

## Frontend rendering

### Render from `iconName`

Use this when you want Iconify to resolve the icon on the frontend:

```tsx
import { Icon } from '@iconify/react';

type IconValue = {
  iconName: string | null;
  width: number | null;
  height: number | null;
  color?: string | null;
};

export function IconFromName({ value }: { value: IconValue }) {
  if (!value.iconName) return null;

  return (
    <Icon
      icon={value.iconName}
      width={value.width ?? 24}
      height={value.height ?? 24}
      color={value.color ?? undefined}
    />
  );
}
```

### Render from `iconData`

Use this when you want full control over the SVG and do not want runtime icon lookups:

```tsx
type IconValue = {
  iconData: string | null;
  width: number | null;
  height: number | null;
  color?: string | null;
};

export function IconFromSvg({ value }: { value: IconValue }) {
  if (!value.iconData) return null;

  return (
    <svg
      width={value.width ?? 24}
      height={value.height ?? 24}
      viewBox={`0 0 ${value.width ?? 24} ${value.height ?? 24}`}
      style={{ color: value.color ?? undefined }}
      dangerouslySetInnerHTML={{ __html: value.iconData }}
    />
  );
}
```

## Development

Useful local commands:

```bash
npm run build
npm run watch
npm run watch:link
npm run verify
npm run docs:readme
```

Type-checking can be run directly with `tsc`:

```bash
npx tsc -p admin/tsconfig.json --noEmit
npx tsc -p server/tsconfig.json --noEmit
```

## Documentation assets

Documentation images are stored in `assets/docs/`. Update `README.source.md`, then regenerate the published README:

```bash
npm run docs:readme
```

The generated `README.md` rewrites local screenshot paths to jsDelivr URLs so the images render correctly on GitHub, npm, and the Strapi marketplace.

## License

MIT
