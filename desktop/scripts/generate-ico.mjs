import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Sizes included in the Windows .ico file
const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256];

/**
 * Creates a Windows ICO file buffer from an array of PNG buffers and their dimensions.
 * Windows Vista+ fully supports PNG-encoded images in ICO containers.
 */
function createIco(images) {
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  const dataBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    const width = img.size >= 256 ? 0 : img.size;
    const height = img.size >= 256 ? 0 : img.size;

    entry.writeUInt8(width, 0); // Width
    entry.writeUInt8(height, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12); // Data offset

    entries.push(entry);
    dataBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...dataBuffers]);
}

export async function generateIco(sourcePath, outputPath) {
  const resolvedOutput = path.isAbsolute(outputPath) ? outputPath : path.resolve(rootDir, outputPath);

  let inputSource;
  if (sourcePath.startsWith('http://') || sourcePath.startsWith('https://')) {
    console.log(`[Icon Generator] Downloading remote logo: ${sourcePath}`);
    const res = await fetch(sourcePath);
    if (!res.ok) throw new Error(`Failed to download remote logo (${res.status}): ${sourcePath}`);
    inputSource = Buffer.from(await res.arrayBuffer());
  } else {
    const resolvedSource = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(rootDir, sourcePath);
    if (!fs.existsSync(resolvedSource)) {
      throw new Error(`Source image not found: ${resolvedSource}`);
    }
    inputSource = resolvedSource;
    console.log(`[Icon Generator] Reading local logo: ${resolvedSource}`);
  }

  const imageBuffers = [];

  for (const size of ICON_SIZES) {
    const pngBuffer = await sharp(inputSource)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    imageBuffers.push({ size, buffer: pngBuffer });
  }

  const icoBuffer = createIco(imageBuffers);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, icoBuffer);

  console.log(`[Icon Generator] Successfully wrote Windows icon (.ico): ${resolvedOutput} (${(icoBuffer.length / 1024).toFixed(1)} KB)`);
  return resolvedOutput;
}

// CLI Execution support: node generate-ico.mjs [--src=path/to/logo.png] [--out=path/to/icon.ico]
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  let src = 'public/logos/submark.png';
  let out = 'desktop/build/icon.ico';

  for (const arg of args) {
    if (arg.startsWith('--src=')) src = arg.slice(6);
    else if (arg.startsWith('--icon=')) src = arg.slice(7);
    else if (arg.startsWith('--out=')) out = arg.slice(6);
  }

  generateIco(src, out).catch((err) => {
    console.error(`[Icon Generator] Error:`, err);
    process.exit(1);
  });
}
