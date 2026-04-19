import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, 'README.source.md');
const manifestPath = path.join(repoRoot, 'docs', 'readme-media-manifest.json');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(path.join(repoRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env'));

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const uploadRoot = process.env.CLOUDINARY_README_FOLDER || 'strapi-plugin-iconhub/readme';

const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].filter(
  (key) => !process.env[key]
);

if (requiredEnv.length > 0) {
  throw new Error(`Missing Cloudinary environment variables: ${requiredEnv.join(', ')}`);
}

const readmeSource = fs.readFileSync(sourcePath, 'utf8');

const collectAssetPaths = (content) => {
  const patterns = [
    /\[(!\[[^\]]*\]\([^)]+\))\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+)\)/g,
    /!\[[^\]]*\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+)\)/g,
    /\[[^\]]+\]\(((?:assets\/docs|docs\/screenshots)\/[^)]+)\)/g,
    /(?:src|poster)="((?:assets\/docs|docs\/screenshots)\/[^"]+)"/g,
  ];

  const assets = new Set();

  patterns.forEach((pattern) => {
    for (const match of content.matchAll(pattern)) {
      const candidate = match.at(-1);

      if (candidate) {
        assets.add(candidate);
      }
    }
  });

  return [...assets].sort();
};

const getResourceType = (relativePath) => {
  const extension = path.extname(relativePath).toLowerCase();

  if (['.mp4', '.mov', '.webm', '.m4v'].includes(extension)) {
    return 'video';
  }

  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'].includes(extension)) {
    return 'image';
  }

  return 'raw';
};

const computeSha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const buildPublicId = (relativePath) => {
  const normalized = relativePath.replace(/\\/g, '/');
  const withoutExtension = normalized.replace(path.extname(normalized), '');
  return `${uploadRoot}/${withoutExtension}`;
};

const readManifest = () => {
  if (!fs.existsSync(manifestPath)) {
    return { provider: 'cloudinary', assets: {} };
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
};

const writeManifest = (manifest) => {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

const signParams = (params) => {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
};

const uploadAsset = async (absolutePath, relativePath) => {
  const resourceType = getResourceType(relativePath);
  const publicId = buildPublicId(relativePath);
  const timestamp = Math.floor(Date.now() / 1000);

  const params = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp: String(timestamp),
  };

  const signature = signParams(params);
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const fileBuffer = fs.readFileSync(absolutePath);
  const form = new FormData();

  form.set('file', new Blob([fileBuffer]), path.basename(absolutePath));
  form.set('api_key', apiKey);
  form.set('timestamp', params.timestamp);
  form.set('public_id', params.public_id);
  form.set('overwrite', params.overwrite);
  form.set('invalidate', params.invalidate);
  form.set('signature', signature);

  const response = await fetch(endpoint, { method: 'POST', body: form });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed for ${relativePath}: ${JSON.stringify(body)}`);
  }

  return {
    bytes: body.bytes,
    format: body.format,
    publicId: body.public_id,
    resourceType: body.resource_type,
    secureUrl: body.secure_url,
    version: body.version,
  };
};

const assetPaths = collectAssetPaths(readmeSource);
const manifest = readManifest();
const nextAssets = {};

for (const relativePath of assetPaths) {
  const absolutePath = path.join(repoRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`README asset not found: ${relativePath}`);
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const sha256 = computeSha256(fileBuffer);
  const existing = manifest.assets?.[relativePath];

  if (existing?.sha256 === sha256 && existing?.secureUrl) {
    nextAssets[relativePath] = existing;
    console.log(`skip  ${relativePath}`);
    continue;
  }

  console.log(`upload ${relativePath}`);
  const uploaded = await uploadAsset(absolutePath, relativePath);

  nextAssets[relativePath] = {
    ...uploaded,
    sha256,
  };
}

const nextManifest = {
  provider: 'cloudinary',
  generatedAt: new Date().toISOString(),
  uploadRoot,
  assets: nextAssets,
};

writeManifest(nextManifest);

console.log(`Synced ${Object.keys(nextAssets).length} README asset(s) to Cloudinary.`);
