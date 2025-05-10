# Strapi IconHub
![iconhb-og](https://github.com/user-attachments/assets/4a7f6113-b836-4740-b06f-1e4d45b18fcc)

A powerful and lightweight icon management plugin for Strapi CMS that supports both raw SVG and the Iconify icon library.

[![Strapi](https://img.shields.io/badge/Strapi-v4%20%7C%20v5-2F2E8B?style=flat&logo=strapi)](https://strapi.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- 🔍 Access 200K+ icons via Iconify integration
- 🎨 Visual icon picker in Strapi admin UI
- 🧩 Dual storage: icon name and raw SVG code
- 🧱 Compatible with all Strapi content types
- ⚙️ Optimized for dynamic frontend rendering
- 🚀 Lightweight and performant

## Installation

```bash
# npm
npm i @arshiash80/strapi-plugin-iconhub

# yarn
yarn add @arshiash80/strapi-plugin-iconhub
```

Rebuild the admin panel:

```bash
# npm
npm run build && npm run develop

# yarn
yarn build && yarn develop
```

## Verification

Navigate to **Settings > Plugins** to confirm IconHub installation.

![Plugin Verification](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746724897/image_b5df49f6af.png)

## Usage

1. Open **Content-Type Builder**
2. Add a new custom field
3. Select **Custom** tab and choose **IconHub**
4. Save schema changes

The icon picker will be available in your content entries:

![Icon Picker UI](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746724949/image_1_d223ac5786.png)

![Icon Selection](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746724970/image_2_ef301e6af3.png)

![Icon Preview](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746725054/image_3_5a16c6ee2c.png)

![Icon Implementation](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746725204/Screenshot_2025_05_08_at_15_50_54_3f8447278e.png)

![Icon Display](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746725074/image_4_fe3a575606.png)

### Data Structure

```typescript
type IconField = {
  iconName: string; // e.g. "mdi:home"
  iconData: string; // Raw SVG string
  width?: number; // Optional width
  height?: number; // Optional height
};
```

## Frontend Implementation

### Next.js Example

```typescript
import { Icon } from "@iconify/react";

type Tag = {
  name: string;
  icon: {
    iconName: string;
    iconData: string;
    width?: number;
    height?: number;
  };
};

export default async function Home() {
  const res = await fetch("http://localhost:1337/api/tags");
  const json = await res.json();
  const tags: Tag[] = json.data;

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center gap-5">
      <h1 className="text-5xl font-semibold mb-10">Strapi IconHub Demo</h1>

      {/* Iconify Implementation */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Iconify Component</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {tags.map((tag, i) => (
            <div key={i} className="bg-gray-800 px-3 py-2 rounded flex items-center gap-2">
              <Icon icon={tag.icon.iconName} />
              <span>{tag.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Raw SVG Implementation */}
      <section className="text-center mt-10">
        <h2 className="text-2xl font-semibold mb-4">Raw SVG</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {tags.map((tag, i) => (
            <div key={i} className="bg-gray-800 px-3 py-2 rounded flex items-center gap-2">
              <svg
                width={tag.icon.width || 16}
                height={tag.icon.height || 16}
                viewBox={`0 0 ${tag.icon.width} ${tag.icon.height}`}
                dangerouslySetInnerHTML={{ __html: tag.icon.iconData }}
              />
              <span>{tag.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

![Frontend Demo](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746725208/Screenshot_2025_05_08_at_20_05_17_9fd16894f2.png)

## Styling

Customize icons using CSS classes or inline attributes:

```typescript
// Iconify
<Icon icon={icon.iconName} className="text-green-500 text-5xl" />

// Raw SVG
<svg
  width={48}
  height={48}
  className="text-green-500"
  viewBox={`0 0 ${icon.width} ${icon.height}`}
  dangerouslySetInnerHTML={{ __html: icon.iconData }}
/>
```

![Styled Icons](https://res.cloudinary.com/dcmxgdy82/image/upload/v1746725268/Screenshot_2025_05_08_at_20_08_04_0419529294.png)

> **Note**: SVGs from Iconify are safe to render with `dangerouslySetInnerHTML`. Only use with trusted content sources.

## Compatibility

- Strapi v4 & v5
- TypeScript
- Modern frontend frameworks (Next.js, Vue, etc.)
