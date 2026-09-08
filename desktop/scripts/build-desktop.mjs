import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { generateIco } from './generate-ico.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const desktopDir = path.resolve(__dirname, '..');

// Parse CLI args: node build-desktop.mjs [--name="..."] [--url="..."] [--icon="..."] [--portable]
const args = process.argv.slice(2);
let propertyName = null;
let targetUrl = process.env.TARGET_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
let iconSrc = null;
let isPortable = false;

for (const arg of args) {
  if (arg.startsWith('--name=')) propertyName = arg.slice(7);
  else if (arg.startsWith('--url=')) targetUrl = arg.slice(6);
  else if (arg.startsWith('--icon=')) iconSrc = arg.slice(7);
  else if (arg === '--portable') isPortable = true;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function discoverInstanceBranding() {
  if (propertyName && iconSrc) return;

  try {
    const brandingUrl = targetUrl.replace(/\/$/, '') + '/api/branding';
    console.log(`[Builder] Discovering active instance branding from ${brandingUrl}...`);
    const res = await fetch(brandingUrl);
    if (res.ok) {
      const data = await res.json();
      if (!propertyName && data.propertyName && data.propertyName !== 'iReside Residences') {
        propertyName = data.propertyName;
        console.log(`[Builder] Discovered Property Name: "${propertyName}"`);
      }
      if (!iconSrc && data.logoUrl) {
        iconSrc = data.logoUrl;
        console.log(`[Builder] Discovered Property Logo: ${iconSrc}`);
      }
    }
  } catch (err) {
    console.log(`[Builder] Notice: Could not reach branding endpoint (${err.message}). Using fallback defaults.`);
  }

  // Fallbacks if not set
  if (!propertyName) propertyName = 'iReside';
  if (!iconSrc) iconSrc = 'public/logos/submark.png';
}

async function build() {
  await discoverInstanceBranding();

  const sanitizedBase = sanitizeFilename(propertyName) || 'iReside';

  console.log(`\n======================================================`);
  console.log(`🚀 iReside Turnkey Windows Desktop App Builder`);
  console.log(`======================================================`);
  console.log(`• Property Name  : ${propertyName}`);
  console.log(`• Executable File: ${sanitizedBase}.exe`);
  console.log(`• Target Origin  : ${targetUrl}`);
  console.log(`• Source Icon    : ${iconSrc}`);
  console.log(`• Packaging Type : ${isPortable ? 'Portable (.exe)' : 'NSIS Installer (.exe)'}`);
  console.log(`======================================================\n`);

  // 1. Generate Windows icon (.ico) directly from custom logo or local asset
  const icoDest = path.join(desktopDir, 'build', 'icon.ico');
  await generateIco(iconSrc, icoDest);

  // 2. Write embedded config.json
  const config = {
    propertyName,
    targetUrl,
    builtAt: new Date().toISOString()
  };
  const configPath = path.join(desktopDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log(`[Builder] Embedded configuration written to: ${configPath}`);

  // 3. Write dynamic electron-builder.json tailored to this specific property instance
  const builderConfig = {
    appId: `ph.ireside.desktop.${sanitizedBase.toLowerCase()}`,
    productName: propertyName,
    copyright: `Copyright © 2026 ${propertyName} · Powered by iReside`,
    directories: {
      output: 'dist',
      buildResources: 'build'
    },
    compression: 'normal',
    files: [
      'main.js',
      'preload.js',
      'offline.html',
      'config.json',
      'build/**/*'
    ],
    win: {
      target: isPortable
        ? [{ target: 'portable', arch: ['x64'] }]
        : [{ target: 'nsis', arch: ['x64'] }],
      icon: 'build/icon.ico',
      executableName: sanitizedBase
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: propertyName,
      artifactName: `${sanitizedBase}-Setup-v\${version}-x64.\${ext}`,
      differentialPackage: false,
      uninstallDisplayName: `${propertyName} Desktop Client`
    },
    portable: {
      artifactName: `${sanitizedBase}-Portable-v\${version}-x64.\${ext}`
    }
  };

  const builderConfigPath = path.join(desktopDir, 'electron-builder.json');
  fs.writeFileSync(builderConfigPath, JSON.stringify(builderConfig, null, 2), 'utf8');
  console.log(`[Builder] Dynamic electron-builder configuration written to: ${builderConfigPath}`);

  // 4. Ensure desktop dependencies are installed
  const desktopNodeModules = path.join(desktopDir, 'node_modules');
  if (!fs.existsSync(desktopNodeModules)) {
    console.log(`[Builder] Installing desktop dependencies (electron, electron-builder)...`);
    execSync('npm install', { cwd: desktopDir, stdio: 'inherit', shell: true });
  }

  // 5. Clean previous dist build directory
  const distDir = path.join(desktopDir, 'dist');
  if (fs.existsSync(distDir)) {
    console.log(`[Builder] Cleaning previous dist build directory...`);
    try {
      fs.rmSync(distDir, { recursive: true, force: true });
    } catch (e) {
      console.warn(`[Builder] Notice: Could not fully remove dist directory (${e.message}), continuing.`);
    }
  }

  // 6. Run electron-builder with dynamic config
  console.log(`[Builder] Compiling Windows executable with electron-builder...`);
  const builderCmd = `npx electron-builder --config electron-builder.json`;
  execSync(builderCmd, { cwd: desktopDir, stdio: 'inherit', shell: true });

  // 7. Copy built artifact to public/downloads/
  const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
  fs.mkdirSync(publicDownloadsDir, { recursive: true });

  const files = fs.readdirSync(distDir);
  const exeFiles = files.filter(f => f.endsWith('.exe') && !f.includes('uninstaller'));

  if (exeFiles.length > 0) {
    const mainExe = exeFiles[0];
    const srcPath = path.join(distDir, mainExe);
    
    // Copy as both the property-named installer and universal fallback
    const customNamedDest = path.join(publicDownloadsDir, mainExe);
    const defaultDest = path.join(publicDownloadsDir, 'iReside-Setup-v2.1.0-x64.exe');

    fs.copyFileSync(srcPath, customNamedDest);
    fs.copyFileSync(srcPath, defaultDest);

    console.log(`\n======================================================`);
    console.log(`🎉 SUCCESS! Windows Client Packaged for: ${propertyName}`);
    console.log(`======================================================`);
    console.log(`• Executable Binary : ${sanitizedBase}.exe (with Custom Logo icon)`);
    console.log(`• Setup Installer   : ${mainExe} (${(fs.statSync(customNamedDest).size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`• Saved To          : ${customNamedDest}`);
    console.log(`• Download Hub Link : ${defaultDest}`);
    console.log(`• Windows Shortcuts : Desktop & Start Menu will show "${propertyName}"`);
    console.log(`======================================================\n`);
  } else {
    console.warn(`[Builder] Warning: No .exe file found in ${distDir}`);
  }
}

build().catch((err) => {
  console.error(`\n❌ [Builder] Build failed:`, err);
  process.exit(1);
});
