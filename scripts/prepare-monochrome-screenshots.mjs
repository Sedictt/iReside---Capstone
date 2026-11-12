import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, '..', 'docs', 'manual', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function prepare() {
  console.log('Preparing pure monochrome screenshots for user manual...');

  // 1. screen-login.png (from existing authentic login or output/uat-video-src/shots/login.png)
  const loginSrc = fs.existsSync('output/uat-video-src/shots/login.png')
    ? 'output/uat-video-src/shots/login.png'
    : path.join(imagesDir, 'screen-login.png');

  const loginMeta = await sharp(loginSrc).metadata();
  if (loginMeta.width > 2000) {
    // Crop central login card
    await sharp(loginSrc)
      .extract({ left: 1950, top: 250, width: 1100, height: 1450 })
      .resize({ width: 900 })
      .grayscale()
      .linear(1.15, -10)
      .png({ compressionLevel: 9 })
      .toFile(path.join(imagesDir, 'screen-login.png'));
  } else {
    // Already cropped login section
    await sharp(path.join(imagesDir, 'screen-login.png'))
      .grayscale()
      .linear(1.15, -10)
      .png({ compressionLevel: 9 })
      .toFile(path.join(imagesDir, 'screen-login.png.tmp'));
    fs.renameSync(path.join(imagesDir, 'screen-login.png.tmp'), path.join(imagesDir, 'screen-login.png'));
  }
  console.log('✓ screen-login.png prepared');

  // 2. screen-finance-hub.png (from videos/ireside-defense/assets/rent-tenant-bill.png)
  await sharp('videos/ireside-defense/assets/rent-tenant-bill.png')
    .extract({ left: 600, top: 80, width: 2500, height: 1650 })
    .resize({ width: 1200 })
    .grayscale()
    .linear(1.15, -10)
    .png({ compressionLevel: 9 })
    .toFile(path.join(imagesDir, 'screen-finance-hub.png'));
  console.log('✓ screen-finance-hub.png prepared');

  // 3. screen-maintenance-request.png (from videos/ireside-defense/assets/repair-tenant-new.png)
  await sharp('videos/ireside-defense/assets/repair-tenant-new.png')
    .extract({ left: 950, top: 80, width: 2150, height: 1650 })
    .resize({ width: 1200 })
    .grayscale()
    .linear(1.15, -10)
    .png({ compressionLevel: 9 })
    .toFile(path.join(imagesDir, 'screen-maintenance-request.png'));
  console.log('✓ screen-maintenance-request.png prepared');

  // 4. screen-add-property.png (from existing authentic light-theme capture)
  await sharp(path.join(imagesDir, 'screen-add-property.png'))
    .grayscale()
    .linear(1.15, -10)
    .png({ compressionLevel: 9 })
    .toFile(path.join(imagesDir, 'screen-add-property.png.tmp'));
  fs.renameSync(path.join(imagesDir, 'screen-add-property.png.tmp'), path.join(imagesDir, 'screen-add-property.png'));
  console.log('✓ screen-add-property.png prepared');

  // 5. screen-add-tenant.png (from output/uat-video-src/shots/landlord_tenants_invite.png)
  await sharp('output/uat-video-src/shots/landlord_tenants_invite.png')
    .extract({ left: 650, top: 130, width: 1900, height: 1750 })
    .resize({ width: 1200 })
    .grayscale()
    .linear(1.15, -10)
    .png({ compressionLevel: 9 })
    .toFile(path.join(imagesDir, 'screen-add-tenant.png'));
  console.log('✓ screen-add-tenant.png prepared');

  // 6. screen-maintenance-management.png (from existing authentic capture or videos/ireside-defense/assets/repair-landlord-detail.png)
  const maintMgmtSrc = fs.existsSync('videos/ireside-defense/assets/repair-landlord-detail.png')
    ? 'videos/ireside-defense/assets/repair-landlord-detail.png'
    : path.join(imagesDir, 'screen-maintenance-management.png');
  
  const maintMeta = await sharp(maintMgmtSrc).metadata();
  if (maintMeta.width > 2000) {
    await sharp(maintMgmtSrc)
      .extract({ left: 700, top: 100, width: 2400, height: 1600 })
      .resize({ width: 1200 })
      .grayscale()
      .linear(1.15, -10)
      .png({ compressionLevel: 9 })
      .toFile(path.join(imagesDir, 'screen-maintenance-management.png'));
  } else {
    await sharp(path.join(imagesDir, 'screen-maintenance-management.png'))
      .grayscale()
      .linear(1.15, -10)
      .png({ compressionLevel: 9 })
      .toFile(path.join(imagesDir, 'screen-maintenance-management.png.tmp'));
    fs.renameSync(path.join(imagesDir, 'screen-maintenance-management.png.tmp'), path.join(imagesDir, 'screen-maintenance-management.png'));
  }
  console.log('✓ screen-maintenance-management.png prepared');

  // Verify all 6 images have zero color
  const files = ['screen-login.png', 'screen-finance-hub.png', 'screen-maintenance-request.png', 'screen-add-property.png', 'screen-add-tenant.png', 'screen-maintenance-management.png'];
  for (const f of files) {
    const fPath = path.join(imagesDir, f);
    const { data, info } = await sharp(fPath).raw().toBuffer({ resolveWithObject: true });
    let hasColor = false;
    if (info.channels >= 3) {
      for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
          hasColor = true;
          break;
        }
      }
    }
    console.log(`Verification: ${f} -> channels=${info.channels}, hasColor=${hasColor}, ${info.width}x${info.height}`);
    if (hasColor) throw new Error(`${f} contains color!`);
  }
  console.log('All 6 images successfully prepared and verified monochrome!');
}

prepare().catch(console.error);
