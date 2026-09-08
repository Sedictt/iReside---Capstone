import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { generateIco } from './generate-ico.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopDir = path.resolve(__dirname, '..');

async function runDev() {
  // Ensure icon exists
  const iconPath = path.join(desktopDir, 'build', 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    await generateIco('public/logos/submark.png', iconPath);
  }

  // Ensure desktop node_modules exist
  const desktopNodeModules = path.join(desktopDir, 'node_modules');
  if (!fs.existsSync(desktopNodeModules)) {
    console.log(`[Desktop Dev] Installing desktop dependencies...`);
    execSync('npm install', { cwd: desktopDir, stdio: 'inherit' });
  }

  console.log(`[Desktop Dev] Launching iReside Desktop Window...`);
  execSync('npx electron .', { cwd: desktopDir, stdio: 'inherit' });
}

runDev().catch((err) => {
  console.error(`[Desktop Dev] Failed:`, err);
  process.exit(1);
});
