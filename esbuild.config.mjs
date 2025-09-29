import { build } from 'esbuild';
import { copyFileSync, mkdirSync, cpSync } from 'fs';
import { existsSync } from 'fs';
import path from 'path';

const dist = './dist';
const shared = {
  bundle: true,
  minify: false,
  sourcemap: true,
  target: ['chrome114'],
  format: 'esm',
  platform: 'node',
};

// 🛠 Tạo thư mục nếu chưa tồn tại
function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// 📦 Build các entrypoints
async function buildAll() {
  await Promise.all([
    build({
      entryPoints: ['./src/background/index.ts'],
      outfile: `${dist}/background/background.js`,
      ...shared,
    }),
    build({
      entryPoints: ['./src/content/index.ts'],
      outfile: `${dist}/content/content.js`,
      ...shared,
    }),
    build({
      entryPoints: ['./src/popup/popup.ts'],
      outfile: `${dist}/popup/popup.js`,
      ...shared,
    }),
  ]);

  console.log('🛠 Code bundled with esbuild');
}

// 📁 Copy các file tĩnh cần thiết
function copyStatic() {
  console.log('📁 Copying static files...');

  ensureDir(`${dist}/popup`);
  ensureDir(`${dist}/assets`);
  ensureDir(`${dist}/background`);
  ensureDir(`${dist}/content`);

  // Copy popup.html & style.css
  copyFileSync('./src/popup/popup.html', `${dist}/popup/popup.html`);
  copyFileSync('./src/popup/style.css', `${dist}/popup/style.css`);

  // Copy manifest.json & redirect.html
  copyFileSync('./public/manifest.json', `${dist}/manifest.json`);
  copyFileSync('./public/redirect.html', `${dist}/redirect.html`);

  // Copy icon và assets
  cpSync('./assets', `${dist}/assets`, { recursive: true });

  console.log('✅ Static files copied');
}

// 🔧 Main build process
buildAll()
  .then(copyStatic)
  .catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
