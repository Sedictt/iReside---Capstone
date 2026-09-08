import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopDir = path.resolve(__dirname, "..");

const installerArgument = process.argv.find((argument) => argument.startsWith("--installer="));
const installerPath = installerArgument ? path.resolve(installerArgument.slice("--installer=".length)) : null;

if (!installerPath || !fs.existsSync(installerPath)) {
  throw new Error("Pass an existing installer with --installer=<path-to-setup.exe>.");
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error("BLOB_READ_WRITE_TOKEN is required to publish the installer.");
}

const configPath = path.join(desktopDir, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const propertyName = config.propertyName || "iReside";
const builtAt = new Date().toISOString();
const originalFilename = path.basename(installerPath);
const safeFilename = originalFilename.replace(/[^A-Za-z0-9._-]/g, "-");
const releasePath = `desktop/builds/${builtAt.replace(/[:.]/g, "-")}-${safeFilename}`;

console.log(`[Publisher] Uploading ${originalFilename} for ${propertyName}...`);
const installer = await put(releasePath, fs.createReadStream(installerPath), {
  access: "public",
  addRandomSuffix: false,
  contentType: "application/vnd.microsoft.portable-executable",
  cacheControlMaxAge: 60,
});

const manifest = {
  downloadUrl: installer.downloadUrl,
  filename: originalFilename,
  propertyName,
  builtAt,
};

await put("desktop/current.json", JSON.stringify(manifest), {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "application/json",
  cacheControlMaxAge: 0,
});

console.log(`[Publisher] Current branded installer is now available for ${propertyName}.`);
