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

const source = fs.readFileSync(sourcePath, 'utf8');
const rewritten = source.replace(
  /!\[([^\]]*)\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+)\)/g,
  rewriteMarkdownImage
);

const banner = [
  '<!-- This file is generated from README.source.md. -->',
  '<!-- Run `npm run docs:readme` after updating docs or screenshots. -->',
  '',
].join('\n');

fs.writeFileSync(outputPath, `${banner}${rewritten}`);

console.log(`Generated README.md with CDN image URLs using ref "${cdnRef}".`);
