import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, 'README.source.md');
const outputPath = path.join(repoRoot, 'README.md');
const packageJsonPath = path.join(repoRoot, 'package.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const repositoryUrl = packageJson.repository?.url ?? '';
const repositoryMatch = repositoryUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);

if (!repositoryMatch) {
  throw new Error(`Could not determine GitHub repository from package.json: ${repositoryUrl}`);
}

const repositorySlug = repositoryMatch[1];
const cdnRef = process.env.README_CDN_REF || 'main';
const cdnBaseUrl = `https://cdn.jsdelivr.net/gh/${repositorySlug}@${cdnRef}/`;

const encodeRepoPath = (filePath) =>
  filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const rewriteMarkdownImage = (_, altText, imagePath) => {
  const absoluteUrl = `${cdnBaseUrl}${encodeRepoPath(imagePath)}`;
  return `![${altText}](${absoluteUrl})`;
};

const rewriteMarkdownAssetLink = (_, linkText, assetPath) => {
  const absoluteUrl = `${cdnBaseUrl}${encodeRepoPath(assetPath)}`;
  return `[${linkText}](${absoluteUrl})`;
};

const rewriteMarkdownLinkedImage = (_, imageMarkdown, assetPath) => {
  const absoluteUrl = `${cdnBaseUrl}${encodeRepoPath(assetPath)}`;
  return `[${imageMarkdown}](${absoluteUrl})`;
};

const rewriteMarkdownMediaLink = (_, assetPath) => {
  const absoluteUrl = `${cdnBaseUrl}${encodeRepoPath(assetPath)}`;
  return `](${absoluteUrl})`;
};

const rewriteHtmlAssetSrc = (_, prefix, assetPath, suffix) => {
  const absoluteUrl = `${cdnBaseUrl}${encodeRepoPath(assetPath)}`;
  return `${prefix}${absoluteUrl}${suffix}`;
};

const source = fs.readFileSync(sourcePath, 'utf8');
const rewritten = source
  .replace(
    /\[(!\[[^\]]*\]\([^)]+\))\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+)\)/g,
    rewriteMarkdownLinkedImage
  )
  .replace(
    /!\[([^\]]*)\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+)\)/g,
    rewriteMarkdownImage
  )
  .replace(
    /(?<attr>src|poster)="((?:assets\/docs|docs\/screenshots)\/[^"]+)"/g,
    (_, attr, assetPath) => `${attr}="${cdnBaseUrl}${encodeRepoPath(assetPath)}"`
  )
  .replace(
    /\[([^\]]+)\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+)\)/g,
    rewriteMarkdownAssetLink
  )
  .replace(
    /\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+\.(?:mp4|webm|mov))\)/g,
    rewriteMarkdownMediaLink
  )
  .replace(
    /(src=")((?:assets\/docs|docs\/screenshots)\/[^"]+)(")/g,
    rewriteHtmlAssetSrc
  );

const banner = [
  '<!-- This file is generated from README.source.md. -->',
  '<!-- Run `npm run docs:readme` after updating docs or screenshots. -->',
  '',
].join('\n');

fs.writeFileSync(outputPath, `${banner}${rewritten}`);

console.log(`Generated README.md with CDN image URLs using ref "${cdnRef}".`);
