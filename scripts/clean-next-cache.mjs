import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const nextCachePath = path.resolve(projectRoot, '.next');
const forceClean = process.argv.includes('--force');

if (!nextCachePath.startsWith(`${projectRoot}${path.sep}`)) {
  throw new Error(`Refusing to remove unexpected path: ${nextCachePath}`);
}

function removeNextCache(reason) {
  fs.rmSync(nextCachePath, { recursive: true, force: true });
  console.log(`Removed ${reason} .next cache`);
}

if (!fs.existsSync(nextCachePath)) {
  process.exit(0);
}

if (forceClean) {
  removeNextCache('stale');
  process.exit(0);
}

const requiredFiles = [
  path.join(nextCachePath, 'server', 'webpack-runtime.js'),
  path.join(nextCachePath, 'server', 'pages-manifest.json'),
  path.join(nextCachePath, 'server', 'server-reference-manifest.js'),
  path.join(nextCachePath, 'server', 'pages', '_document.js'),
  path.join(nextCachePath, 'server', 'vendor-chunks', 'next.js'),
];

const missingFiles = requiredFiles.filter((filePath) => !fs.existsSync(filePath));

if (missingFiles.length > 0) {
  removeNextCache('corrupt');
}
