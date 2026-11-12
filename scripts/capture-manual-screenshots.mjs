import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const outputDir = path.join(ROOT, 'docs', 'manual', 'images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processToMonochrome(rawBuffer, outputPath) {
  await sharp(rawBuffer)
    .grayscale()
    .linear(1.15, -10) // Slightly boost contrast while maintaining detail
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`Saved monochrome screenshot: ${outputPath}`);
}

async function captureAll() {
  console.log('Generating authentic monochrome manual screenshots...');

  // 1. screen-login.png
  const loginSrc = fs.existsSync(path.join(ROOT, 'output', 'uat-video-src', 'shots', 'login.png'))
    ? path.join(ROOT, 'output', 'uat-video-src', 'shots', 'login.png')
    : path.join(outputDir, 'screen-login.png');

  const loginMeta = await sharp(loginSrc).metadata();
  if (loginMeta.width > 2000) {
    await sharp(loginSrc)
      .extract({ left: 1950, top: 250, width: 1100, height: 1450 })
      .resize({ width: 900 })
      .grayscale()
      .linear(1.15, -10)
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, 'screen-login.png'));
  } else {
    const raw = fs.readFileSync(path.join(outputDir, 'screen-login.png'));
    await processToMonochrome(raw, path.join(outputDir, 'screen-login.png'));
  }
  console.log('✓ 1. screen-login.png generated');

  // 2. screen-finance-hub.png (Finance Hub Card from authentic defense asset)
  await sharp(path.join(ROOT, 'videos', 'ireside-defense', 'assets', 'rent-tenant-bill.png'))
    .extract({ left: 600, top: 80, width: 2500, height: 1650 })
    .resize({ width: 1200 })
    .grayscale()
    .linear(1.15, -10)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'screen-finance-hub.png'));
  console.log('✓ 2. screen-finance-hub.png generated');

  // 3. screen-maintenance-request.png (Maintenance Request Form from authentic defense asset)
  await sharp(path.join(ROOT, 'videos', 'ireside-defense', 'assets', 'repair-tenant-new.png'))
    .extract({ left: 950, top: 80, width: 2150, height: 1650 })
    .resize({ width: 1200 })
    .grayscale()
    .linear(1.15, -10)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'screen-maintenance-request.png'));
  console.log('✓ 3. screen-maintenance-request.png generated');

  // 4. screen-add-property.png (Add Property Wizard Dialog)
  const propSrc = path.join(outputDir, 'screen-add-property.png');
  const propRaw = fs.readFileSync(propSrc);
  await processToMonochrome(propRaw, propSrc);
  console.log('✓ 4. screen-add-property.png generated');

  // 5. screen-add-tenant.png (Add Tenant Modal from authentic video asset)
  await sharp(path.join(ROOT, 'output', 'uat-video-src', 'shots', 'landlord_tenants_invite.png'))
    .extract({ left: 650, top: 130, width: 1900, height: 1750 })
    .resize({ width: 1200 })
    .grayscale()
    .linear(1.15, -10)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, 'screen-add-tenant.png'));
  console.log('✓ 5. screen-add-tenant.png generated');

  // 6. screen-maintenance-management.png (Maintenance Ticket Management from authentic defense asset)
  const maintMgmtSrc = fs.existsSync(path.join(ROOT, 'videos', 'ireside-defense', 'assets', 'repair-landlord-detail.png'))
    ? path.join(ROOT, 'videos', 'ireside-defense', 'assets', 'repair-landlord-detail.png')
    : path.join(outputDir, 'screen-maintenance-management.png');

  const maintMeta = await sharp(maintMgmtSrc).metadata();
  if (maintMeta.width > 2000) {
    await sharp(maintMgmtSrc)
      .extract({ left: 700, top: 100, width: 2400, height: 1600 })
      .resize({ width: 1200 })
      .grayscale()
      .linear(1.15, -10)
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, 'screen-maintenance-management.png'));
  } else {
    const maintRaw = fs.readFileSync(path.join(outputDir, 'screen-maintenance-management.png'));
    await processToMonochrome(maintRaw, path.join(outputDir, 'screen-maintenance-management.png'));
  }
  console.log('✓ 6. screen-maintenance-management.png generated');

  // Verify pure monochrome (no color channels)
  const files = ['screen-login.png', 'screen-finance-hub.png', 'screen-maintenance-request.png', 'screen-add-property.png', 'screen-add-tenant.png', 'screen-maintenance-management.png'];
  for (const f of files) {
    const fPath = path.join(outputDir, f);
    const { data, info } = await sharp(fPath).raw().toBuffer({ resolveWithObject: true });
    if (info.channels >= 3) {
      for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
          throw new Error(`${f} contains color pixels!`);
        }
      }
    }
  }
  console.log('All 6 screenshots captured and converted to pure monochrome successfully!');
}

captureAll().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
