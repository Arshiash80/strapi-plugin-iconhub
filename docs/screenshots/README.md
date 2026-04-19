# Documentation Media Workflow

The published README uses media stored in `assets/docs/`. Keep those files stable and overwrite existing assets when the UI changes, instead of creating dated one-off screenshots. The README generator prefers Cloudinary URLs from `docs/readme-media-manifest.json` and falls back to jsDelivr only when an asset has not been synced yet.

## Current asset groups

- installation and setup
  - `plugin-verification.png`
  - `custom-field-tab.png`
  - `iconhub-custom-field-selection.png`
  - `configure-storage-preferences.png`
  - `configure-available-icon-set-categories.png`
- field and edit flow
  - `icon-custom-field-input.png`
  - `icon-custom-field-input-edit-button.png`
  - `icon-custom-field-input-with-selected-icon-and-color.png`
  - `icon-picker-edit-modal.png`
  - `icon-picker-edit-modal-color-picker.png`
- picker browsing flow
  - `icon-picker-modal-default-state-with-icons-sets-and-no-search-example*.png`
  - `icon-picker-modal-default-state-with-icons-sets-and-no-search-filter-by-*.png`
  - `icon-picker-modal-google-material-icons-icon-set-example-state-for-showing-search-inside-iconset.png`
  - `icon-picker-modal-icons-demo-*.png`
- marketing / cover image
  - `og-image.jpg`
- demo media
  - `IconHubPluginDemo.mp4`

## Capture rules

- Keep browser zoom at `100%`
- Use a stable desktop viewport for README captures
- Prefer clean demo entries and predictable field configuration
- Capture dark mode unless the screenshot is specifically about theme behavior
- Keep naming descriptive, lowercase, and hyphenated

## Updating the README

1. Edit `README.source.md`
2. Reference screenshots with repo-relative paths from `assets/docs/`

```md
![Picker default state](assets/docs/icon-picker-modal-default-state-with-icons-sets-and-no-search-example.png)
```

3. Sync changed README assets to Cloudinary

```bash
export CLOUDINARY_CLOUD_NAME=your-cloud-name
export CLOUDINARY_API_KEY=your-api-key
export CLOUDINARY_API_SECRET=your-api-secret
npm run docs:sync-media
```

Only changed assets are uploaded. The script computes a SHA-256 hash for each README asset, stores the result in `docs/readme-media-manifest.json`, and skips assets whose content hash is unchanged.

4. Regenerate the published README

```bash
npm run docs:readme
```

The generator rewrites local media paths to Cloudinary URLs when they exist in the manifest. If an asset has not been synced yet, it falls back to jsDelivr so GitHub previews still work.

For pull request previews, generate against the current commit SHA so newly added fallback assets render before merge:

```bash
README_CDN_REF=$(git rev-parse HEAD) npm run docs:readme
```

## Optional release flow

If you intentionally want fallback jsDelivr URLs pinned to a release instead of `main`:

```bash
README_CDN_REF=v1.2.0 npm run docs:readme
```
