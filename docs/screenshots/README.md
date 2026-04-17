# Documentation Screenshot Workflow

The published README uses images stored in `assets/docs/`. Keep those files stable and overwrite existing assets when the UI changes, instead of creating dated one-off screenshots.

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

3. Regenerate the published README

```bash
npm run docs:readme
```

The generator rewrites local image paths to jsDelivr URLs so the same README renders correctly on GitHub, npm, and the Strapi marketplace.

For pull request previews, generate against the current commit SHA so newly added screenshots render before merge:

```bash
README_CDN_REF=$(git rev-parse HEAD) npm run docs:readme
```

## Optional release flow

To pin image URLs to a release instead of `main`:

```bash
README_CDN_REF=v1.2.0 npm run docs:readme
```
