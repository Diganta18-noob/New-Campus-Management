import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const directory = path.resolve('dist/assets');
if (!fs.existsSync(directory)) throw new Error('Run the production build before checking bundle size');
const files = fs.readdirSync(directory).filter(file => file.endsWith('.js'));
const sizes = files.map(file => ({ file, bytes: gzipSync(fs.readFileSync(path.join(directory, file))).length }));
const total = sizes.reduce((sum, item) => sum + item.bytes, 0);
const largest = sizes.reduce((current, item) => item.bytes > current.bytes ? item : current, { file: '', bytes: 0 });
console.log(`JavaScript gzip: ${(total / 1024).toFixed(1)} KiB total; largest ${largest.file} ${(largest.bytes / 1024).toFixed(1)} KiB`);
if (total > 750 * 1024 || largest.bytes > 185 * 1024) {
  console.error('Bundle budget exceeded: 750 KiB total or 185 KiB per chunk');
  process.exitCode = 1;
}
