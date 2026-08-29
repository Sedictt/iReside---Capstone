export interface PosterRenderOptions {
  propertyName: string;
  address: string;
  portalSubheading: string;
  bannerHeading: string;
  tagline: string;
  apkCardTitle: string;
  apkCardBadge: string;
  apkCardSubtitle: string;
  webCardTitle: string;
  webCardBadge: string;
  webCardSubtitle: string;
  stepsHeading: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  wifiHeader: string;
  wifiSsid: string;
  wifiPassword: string;
  officeHeader: string;
  contactPhone: string;
  officeHours: string;
  footerBadge: string;
  brandColor: string;
  cardColor: string;
  cardOpacity: number;
  bgPreset: string;
  fontFamily: string;
  titleTransform: string;
  letterSpacing: string;
  customBgImage?: string | null;
  photoBrightness: number;
  photoSaturation: number;
  photoOpacity: number;
  showBanner: boolean;
  showSteps: boolean;
  showWifi: boolean;
  showOffice: boolean;
  apkQrUrl: string;
  portalQrUrl: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * High-Precision 1:1 Visual Canvas Poster Renderer (A4 Landscape 1414 x 1000)
 */
export async function renderPosterToCanvas(options: PosterRenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const W = 1414;
  const H = 1000;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Base font family
  const fontFam = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  // 1. Canvas Background Fill
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Pre-load QR images
  const [apkQrImg, portalQrImg] = await Promise.all([
    loadImage(options.apkQrUrl).catch(() => null),
    loadImage(options.portalQrUrl).catch(() => null),
  ]);

  const PADDING = 40;
  const MAIN_W = W - PADDING * 2;
  const MAIN_H = H - PADDING * 2;
  const FOOTER_H = 110;
  const UPPER_H = MAIN_H - FOOTER_H;

  const mainX = PADDING;
  const mainY = PADDING;

  // Outer container border & clip
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(mainX, mainY, MAIN_W, MAIN_H, 24);
  ctx.clip();

  // White base for upper area
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(mainX, mainY, MAIN_W, UPPER_H);

  // ----------------------------------------------------
  // COLUMN 1: Hero & Branding (Left 33%) with Custom Photo
  // ----------------------------------------------------
  const col1W = MAIN_W * 0.33;
  
  // Left base gradient background
  const leftGrad = ctx.createLinearGradient(mainX, mainY, mainX, mainY + UPPER_H);
  leftGrad.addColorStop(0, "#ffffff");
  leftGrad.addColorStop(0.5, "#fafafa");
  leftGrad.addColorStop(1, "#f5f3ff");
  ctx.fillStyle = leftGrad;
  ctx.fillRect(mainX, mainY, col1W, UPPER_H);

  // Custom Photo on Hero panel if provided
  if (options.customBgImage) {
    try {
      const bgImg = await loadImage(options.customBgImage);
      ctx.save();
      ctx.beginPath();
      ctx.rect(mainX, mainY, col1W, UPPER_H);
      ctx.clip();
      ctx.globalAlpha = options.photoOpacity / 100;
      ctx.filter = `brightness(${options.photoBrightness}%) saturate(${options.photoSaturation}%)`;
      ctx.drawImage(bgImg, mainX, mainY, col1W, UPPER_H);
      ctx.restore();

      // Soft overlay gradient for text legibility
      const heroOverlay = ctx.createLinearGradient(mainX, mainY, mainX, mainY + UPPER_H);
      heroOverlay.addColorStop(0, "rgba(255,255,255,0.72)");
      heroOverlay.addColorStop(0.5, "rgba(255,255,255,0.86)");
      heroOverlay.addColorStop(1, "rgba(255,255,255,0.96)");
      ctx.fillStyle = heroOverlay;
      ctx.fillRect(mainX, mainY, col1W, UPPER_H);
    } catch (err) {
      console.warn("Could not render custom hero photo:", err);
    }
  }

  // Divider line after Col 1
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mainX + col1W, mainY);
  ctx.lineTo(mainX + col1W, mainY + UPPER_H);
  ctx.stroke();

  // Brand Icon Box
  ctx.fillStyle = options.brandColor;
  ctx.beginPath();
  ctx.roundRect(mainX + 35, mainY + 35, 60, 60, 16);
  ctx.fill();

  // Building Icon inside box
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const bX = mainX + 35 + 30;
  const bY = mainY + 35 + 30;
  ctx.strokeRect(bX - 12, bY - 16, 24, 32);
  ctx.beginPath();
  ctx.moveTo(bX - 6, bY - 8);
  ctx.lineTo(bX - 6, bY - 4);
  ctx.moveTo(bX + 6, bY - 8);
  ctx.lineTo(bX + 6, bY - 4);
  ctx.moveTo(bX - 6, bY + 2);
  ctx.lineTo(bX - 6, bY + 6);
  ctx.moveTo(bX + 6, bY + 2);
  ctx.lineTo(bX + 6, bY + 6);
  ctx.moveTo(bX - 4, bY + 16);
  ctx.lineTo(bX - 4, bY + 10);
  ctx.lineTo(bX + 4, bY + 10);
  ctx.lineTo(bX + 4, bY + 16);
  ctx.stroke();

  // Property Title & Address
  ctx.fillStyle = "#09090b";
  ctx.font = `900 22px ${fontFam}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const propName = options.titleTransform === "uppercase" ? options.propertyName.toUpperCase() : options.propertyName;
  ctx.fillText(propName, mainX + 110, mainY + 40);

  ctx.fillStyle = "#52525b";
  ctx.font = `600 14px ${fontFam}`;
  ctx.fillText(options.address, mainX + 110, mainY + 70);

  // Hero Headline
  ctx.fillStyle = "#09090b";
  ctx.font = `900 48px ${fontFam}`;
  ctx.fillText(options.bannerHeading.toUpperCase(), mainX + 35, mainY + 180);

  // Tagline / Subtitle
  ctx.fillStyle = "#3f3f46";
  ctx.font = `600 22px ${fontFam}`;
  const words = options.tagline.split(" ");
  let line = "";
  let tagY = mainY + 250;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > col1W - 70 && n > 0) {
      ctx.fillText(line, mainX + 35, tagY);
      line = words[n] + " ";
      tagY += 32;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, mainX + 35, tagY);

  // ----------------------------------------------------
  // COLUMN 2: Dual QR Cards + Floating "OR" Badge (Center 42%)
  // ----------------------------------------------------
  const col2X = mainX + col1W;
  const col2W = MAIN_W * 0.42;

  ctx.fillStyle = "#fafafa";
  ctx.fillRect(col2X, mainY, col2W, UPPER_H);

  // Divider line after Col 2
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(col2X + col2W, mainY);
  ctx.lineTo(col2X + col2W, mainY + UPPER_H);
  ctx.stroke();

  const qrInnerMargin = 20;
  const qrCardW = (col2W - qrInnerMargin * 3) / 2;
  const qrCardH = UPPER_H - qrInnerMargin * 2;
  const qrCardY = mainY + qrInnerMargin;

  // --- Left: Mobile App Card (Purple Theme) ---
  const card1X = col2X + qrInnerMargin;
  ctx.fillStyle = "#f5f3ff";
  ctx.strokeStyle = "#ddd6fe";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(card1X, qrCardY, qrCardW, qrCardH, 20);
  ctx.fill();
  ctx.stroke();

  // Top Pill Tag
  ctx.fillStyle = options.brandColor;
  ctx.beginPath();
  ctx.roundRect(card1X + (qrCardW - 180) / 2, qrCardY + 20, 180, 32, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 13px ${fontFam}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(options.apkCardBadge.toUpperCase(), card1X + qrCardW / 2, qrCardY + 36);

  // Card Title
  ctx.fillStyle = options.brandColor;
  ctx.font = `900 21px ${fontFam}`;
  ctx.fillText(options.apkCardTitle.toUpperCase(), card1X + qrCardW / 2, qrCardY + 80);

  // Icon & Subtitle
  ctx.fillStyle = "#52525b";
  ctx.font = `600 14px ${fontFam}`;
  ctx.fillText(`📱  ${options.apkCardSubtitle}`, card1X + qrCardW / 2, qrCardY + 115);

  // QR Code Frame (Large 260px)
  const qrBoxSize = 260;
  const qrBoxX = card1X + (qrCardW - qrBoxSize) / 2;
  const qrBoxY = qrCardY + 140;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 18);
  ctx.fill();
  ctx.stroke();

  if (apkQrImg) {
    ctx.drawImage(apkQrImg, qrBoxX + 14, qrBoxY + 14, qrBoxSize - 28, qrBoxSize - 28);
  }

  // Bottom Banner Button
  ctx.fillStyle = options.brandColor;
  ctx.beginPath();
  ctx.roundRect(card1X + 16, qrCardY + qrCardH - 85, qrCardW - 32, 65, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 17px ${fontFam}`;
  ctx.fillText("⬇️  SCAN TO DOWNLOAD", card1X + qrCardW / 2, qrCardY + qrCardH - 58);
  ctx.font = `800 13px ${fontFam}`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("ANDROID (APK)", card1X + qrCardW / 2, qrCardY + qrCardH - 36);

  // --- Right: Web Portal Card (Emerald Theme) ---
  const card2X = col2X + qrInnerMargin * 2 + qrCardW;
  ctx.fillStyle = "#ecfdf5";
  ctx.strokeStyle = "#a7f3d0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(card2X, qrCardY, qrCardW, qrCardH, 20);
  ctx.fill();
  ctx.stroke();

  // Top Pill Tag
  ctx.fillStyle = "#059669";
  ctx.beginPath();
  ctx.roundRect(card2X + (qrCardW - 180) / 2, qrCardY + 20, 180, 32, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 13px ${fontFam}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(options.webCardBadge.toUpperCase(), card2X + qrCardW / 2, qrCardY + 36);

  // Card Title
  ctx.fillStyle = "#065f46";
  ctx.font = `900 21px ${fontFam}`;
  ctx.fillText(options.webCardTitle.toUpperCase(), card2X + qrCardW / 2, qrCardY + 80);

  // Icon & Subtitle
  ctx.fillStyle = "#52525b";
  ctx.font = `600 14px ${fontFam}`;
  ctx.fillText(`🌐  ${options.webCardSubtitle}`, card2X + qrCardW / 2, qrCardY + 115);

  // QR Code Frame (Large 260px)
  const qrBox2X = card2X + (qrCardW - qrBoxSize) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(qrBox2X, qrBoxY, qrBoxSize, qrBoxSize, 18);
  ctx.fill();
  ctx.stroke();

  if (portalQrImg) {
    ctx.drawImage(portalQrImg, qrBox2X + 14, qrBoxY + 14, qrBoxSize - 28, qrBoxSize - 28);
  }

  // Bottom Banner Button
  ctx.fillStyle = "#047857";
  ctx.beginPath();
  ctx.roundRect(card2X + 16, qrCardY + qrCardH - 85, qrCardW - 32, 65, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 17px ${fontFam}`;
  ctx.fillText("🌐  SCAN TO REGISTER", card2X + qrCardW / 2, qrCardY + qrCardH - 58);
  ctx.font = `800 13px ${fontFam}`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("INSTANT WEB ACCESS", card2X + qrCardW / 2, qrCardY + qrCardH - 36);

  // --- Center Floating "OR" Badge ---
  const orCenterX = col2X + col2W / 2;
  const orCenterY = mainY + UPPER_H / 2;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(orCenterX, orCenterY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#374151";
  ctx.font = `900 16px ${fontFam}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("OR", orCenterX, orCenterY);

  // ----------------------------------------------------
  // COLUMN 3: Dark Utility Sidebar (Right 25%)
  // ----------------------------------------------------
  const col3X = col2X + col2W;
  const col3W = MAIN_W - col1W - col2W;

  ctx.fillStyle = "#161d2b";
  ctx.fillRect(col3X, mainY, col3W, UPPER_H);

  // 1. Wi-Fi Section
  const wifiY = mainY + 70;
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(col3X + col3W / 2, wifiY, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `bold 24px ${fontFam}`;
  ctx.fillText("📶", col3X + col3W / 2, wifiY);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `900 16px ${fontFam}`;
  ctx.fillText(options.wifiHeader.toUpperCase(), col3X + col3W / 2, wifiY + 48);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 20px ${fontFam}`;
  ctx.fillText(options.wifiSsid, col3X + col3W / 2, wifiY + 76);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `600 17px ${fontFam}`;
  ctx.fillText(options.wifiPassword, col3X + col3W / 2, wifiY + 104);

  // Divider 1
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(col3X + 30, wifiY + 140);
  ctx.lineTo(col3X + col3W - 30, wifiY + 140);
  ctx.stroke();

  // 2. Office Section
  const officeY = wifiY + 210;
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(col3X + col3W / 2, officeY, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `bold 24px ${fontFam}`;
  ctx.fillText("📞", col3X + col3W / 2, officeY);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `900 16px ${fontFam}`;
  ctx.fillText(options.officeHeader.toUpperCase(), col3X + col3W / 2, officeY + 48);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 20px ${fontFam}`;
  ctx.fillText(options.contactPhone, col3X + col3W / 2, officeY + 76);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `600 16px ${fontFam}`;
  ctx.fillText(options.officeHours, col3X + col3W / 2, officeY + 104);

  // Divider 2
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(col3X + 30, officeY + 140);
  ctx.lineTo(col3X + col3W - 30, officeY + 140);
  ctx.stroke();

  // 3. Verification Notice
  const stampY = officeY + 200;
  ctx.font = `bold 28px ${fontFam}`;
  ctx.fillText("🛡️", col3X + col3W / 2, stampY);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = `800 16px ${fontFam}`;
  ctx.fillText(options.footerBadge.toUpperCase(), col3X + col3W / 2, stampY + 36);

  // ----------------------------------------------------
  // FOOTER: 3-Step Horizontal Ribbon (Bottom)
  // ----------------------------------------------------
  const footerY = mainY + UPPER_H;
  ctx.fillStyle = "#0c111a";
  ctx.fillRect(mainX, footerY, MAIN_W, FOOTER_H);

  // Divider line above footer
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mainX, footerY);
  ctx.lineTo(mainX + MAIN_W, footerY);
  ctx.stroke();

  const stepW = MAIN_W / 3;

  // Step 1
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(mainX + 60, footerY + FOOTER_H / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#09090b";
  ctx.font = `900 18px ${fontFam}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", mainX + 60, footerY + FOOTER_H / 2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 20px ${fontFam}`;
  ctx.fillText(options.step1Title, mainX + 95, footerY + FOOTER_H / 2 - 12);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 15px ${fontFam}`;
  ctx.fillText(options.step1Desc, mainX + 95, footerY + FOOTER_H / 2 + 14);

  // Chevron 1
  ctx.fillStyle = "#475569";
  ctx.font = `bold 22px ${fontFam}`;
  ctx.textAlign = "center";
  ctx.fillText(">", mainX + stepW, footerY + FOOTER_H / 2);

  // Step 2
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(mainX + stepW + 60, footerY + FOOTER_H / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#09090b";
  ctx.font = `900 18px ${fontFam}`;
  ctx.fillText("2", mainX + stepW + 60, footerY + FOOTER_H / 2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 20px ${fontFam}`;
  ctx.fillText(options.step2Title, mainX + stepW + 95, footerY + FOOTER_H / 2 - 12);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 15px ${fontFam}`;
  ctx.fillText(options.step2Desc, mainX + stepW + 95, footerY + FOOTER_H / 2 + 14);

  // Chevron 2
  ctx.fillStyle = "#475569";
  ctx.font = `bold 22px ${fontFam}`;
  ctx.textAlign = "center";
  ctx.fillText(">", mainX + stepW * 2, footerY + FOOTER_H / 2);

  // Step 3
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(mainX + stepW * 2 + 60, footerY + FOOTER_H / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#09090b";
  ctx.font = `900 18px ${fontFam}`;
  ctx.fillText("3", mainX + stepW * 2 + 60, footerY + FOOTER_H / 2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 20px ${fontFam}`;
  ctx.fillText(options.step3Title, mainX + stepW * 2 + 95, footerY + FOOTER_H / 2 - 12);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 15px ${fontFam}`;
  ctx.fillText(options.step3Desc, mainX + stepW * 2 + 95, footerY + FOOTER_H / 2 + 14);

  ctx.restore();

  return canvas;
}
