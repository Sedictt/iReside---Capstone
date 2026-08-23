"use client";

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
  customBgImage: string | null;
  photoBrightness: number;
  photoSaturation: number;
  photoOpacity: number;
  fontFamily: "modern_sans" | "luxury_serif" | "geometric_grotesk" | "tech_mono";
  titleTransform: "uppercase" | "none";
  letterSpacing: "tight" | "normal" | "wide";
  showBanner: boolean;
  showSteps: boolean;
  showWifi: boolean;
  showOffice: boolean;
  apkQrUrl: string;
  portalQrUrl: string;
}

// Helper to load an HTML Image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Helper: Convert hex and opacity to rgba
function hexToRgba(hex: string, opacityPercent: number): string {
  try {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const a = Math.max(0.1, Math.min(1, opacityPercent / 100));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch {
    return hex;
  }
}

// Helper: Contrast calculator
function getContrastColor(hex: string): { text: string; muted: string; border: string; isLight: boolean } {
  try {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    const isLight = yiq >= 135;
    return {
      isLight,
      text: isLight ? "#09090b" : "#ffffff",
      muted: isLight ? "#71717a" : "#a1a1aa",
      border: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)",
    };
  } catch {
    return {
      isLight: true,
      text: "#09090b",
      muted: "#71717a",
      border: "rgba(0,0,0,0.08)",
    };
  }
}

// Draw crisp Vector iReside Hexagon Logo
function drawBrandLogo(ctx: CanvasRenderingContext2D, x: number, y: number, isLight: boolean) {
  ctx.save();
  // Outer Hexagon
  const size = 18;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + size * Math.cos(angle);
    const py = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = "#10b981";
  ctx.fill();

  // Inner roof icon
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 7, y + 2);
  ctx.lineTo(x, y - 6);
  ctx.lineTo(x + 7, y + 2);
  ctx.stroke();

  // "iReside" Text
  ctx.fillStyle = isLight ? "#09090b" : "#ffffff";
  ctx.font = "900 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("iReside", x + 24, y);
  ctx.restore();
}

/**
 * High-Precision 1:1 Visual Canvas Poster Renderer
 * Generates an exact, perfectly proportioned A4 print-quality bitmap (1000 x 1414)
 */
export async function renderPosterToCanvas(options: PosterRenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const W = 1000;
  const H = 1414; // Standard A4 Aspect Ratio (1 : 1.414)
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Resolve Font Family
  let fontFam = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  if (options.fontFamily === "luxury_serif") {
    fontFam = "Georgia, 'Times New Roman', Times, serif";
  } else if (options.fontFamily === "geometric_grotesk") {
    fontFam = "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif";
  } else if (options.fontFamily === "tech_mono") {
    fontFam = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  }

  // 1. Background Fill
  if (options.bgPreset === "solid_dark") {
    ctx.fillStyle = "#111115";
    ctx.fillRect(0, 0, W, H);
  } else if (options.bgPreset === "warm_ivory") {
    ctx.fillStyle = "#fafaf6";
    ctx.fillRect(0, 0, W, H);
  } else if (options.bgPreset === "dot_pattern") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#9ca3af";
    for (let x = 20; x < W; x += 32) {
      for (let y = 20; y < H; y += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (options.bgPreset === "grid_blueprint") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1.2;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  }

  // Custom Photo Background
  if (options.customBgImage) {
    try {
      const bgImg = await loadImage(options.customBgImage);
      ctx.save();
      ctx.globalAlpha = options.photoOpacity / 100;
      ctx.filter = `brightness(${options.photoBrightness}%) saturate(${options.photoSaturation}%)`;
      ctx.drawImage(bgImg, 0, 0, W, H);
      ctx.restore();
    } catch (err) {
      console.warn("Could not render custom background photo:", err);
    }
  }

  const cardBg = hexToRgba(options.cardColor, options.cardOpacity);
  const cardContrast = getContrastColor(options.cardColor);

  const PADDING_X = 50;
  const CONTENT_W = W - PADDING_X * 2;
  let currentY = 50;

  // Helper: Neumorphic Rounded Card
  const drawCard = (x: number, y: number, w: number, h: number, r = 20) => {
    ctx.save();
    // Soft subtle shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = cardBg;
    ctx.strokeStyle = cardContrast.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.stroke();
    ctx.restore();
  };

  // ----------------------------------------------------
  // 1. Header Card
  // ----------------------------------------------------
  const headerH = 120;
  drawCard(PADDING_X, currentY, CONTENT_W, headerH, 20);

  // Property Monogram Icon Box
  ctx.save();
  ctx.fillStyle = options.brandColor;
  ctx.beginPath();
  ctx.roundRect(PADDING_X + 20, currentY + 20, 80, 80, 16);
  ctx.fill();

  // Building Icon
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const bX = PADDING_X + 20 + 40;
  const bY = currentY + 20 + 40;
  ctx.strokeRect(bX - 16, bY - 20, 32, 40);
  ctx.beginPath();
  ctx.moveTo(bX - 8, bY - 10);
  ctx.lineTo(bX - 8, bY - 6);
  ctx.moveTo(bX + 8, bY - 10);
  ctx.lineTo(bX + 8, bY - 6);
  ctx.moveTo(bX - 8, bY + 2);
  ctx.lineTo(bX - 8, bY + 6);
  ctx.moveTo(bX + 8, bY + 2);
  ctx.lineTo(bX + 8, bY + 6);
  ctx.moveTo(bX - 6, bY + 20);
  ctx.lineTo(bX - 6, bY + 12);
  ctx.lineTo(bX + 6, bY + 12);
  ctx.lineTo(bX + 6, bY + 20);
  ctx.stroke();
  ctx.restore();

  // Property Title & Address
  ctx.save();
  ctx.fillStyle = cardContrast.text;
  const propTitle = options.titleTransform === "uppercase" ? options.propertyName.toUpperCase() : options.propertyName;
  ctx.font = `900 32px ${fontFam}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(propTitle, PADDING_X + 118, currentY + 28);

  ctx.fillStyle = cardContrast.muted;
  ctx.font = `500 20px ${fontFam}`;
  ctx.fillText(options.address, PADDING_X + 118, currentY + 70);

  // Logo + Resident Portal Subtitle on Right
  drawBrandLogo(ctx, PADDING_X + CONTENT_W - 170, currentY + 45, cardContrast.isLight);
  ctx.fillStyle = cardContrast.muted;
  ctx.font = `800 16px ${fontFam}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(options.portalSubheading.toUpperCase(), PADDING_X + CONTENT_W - 20, currentY + 74);
  ctx.restore();

  currentY += headerH + 24;

  // ----------------------------------------------------
  // 2. Welcome Banner
  // ----------------------------------------------------
  if (options.showBanner) {
    const bannerH = 100;
    ctx.save();
    ctx.fillStyle = options.brandColor;
    ctx.beginPath();
    ctx.roundRect(PADDING_X, currentY, CONTENT_W, bannerH, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `900 18px ${fontFam}`;
    ctx.fillText(`📢  ${options.bannerHeading.toUpperCase()}`, W / 2, currentY + 20);

    ctx.font = `500 21px ${fontFam}`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(options.tagline, W / 2, currentY + 54);
    ctx.restore();

    currentY += bannerH + 24;
  }

  // ----------------------------------------------------
  // 3. Dual High-Resolution QR Cards
  // ----------------------------------------------------
  const qrCardW = (CONTENT_W - 24) / 2;
  const qrCardH = 490;

  const [apkQrImg, portalQrImg] = await Promise.all([
    loadImage(options.apkQrUrl).catch(() => null),
    loadImage(options.portalQrUrl).catch(() => null),
  ]);

  // --- Left: Android APK Card ---
  const leftX = PADDING_X;
  drawCard(leftX, currentY, qrCardW, qrCardH, 20);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = cardContrast.text;
  ctx.font = `900 22px ${fontFam}`;
  ctx.fillText(`📱  ${options.apkCardTitle}`, leftX + qrCardW / 2, currentY + 24);

  // QR Frame Box
  const qrBoxSize = 270;
  const qrX = leftX + (qrCardW - qrBoxSize) / 2;
  const qrY = currentY + 68;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, qrBoxSize, qrBoxSize, 16);
  ctx.fill();
  ctx.stroke();

  if (apkQrImg) {
    ctx.drawImage(apkQrImg, qrX + 12, qrY + 12, qrBoxSize - 24, qrBoxSize - 24);
  }

  // Button Badge
  ctx.fillStyle = options.brandColor;
  ctx.beginPath();
  ctx.roundRect(leftX + (qrCardW - 200) / 2, currentY + 365, 200, 44, 22);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 18px ${fontFam}`;
  ctx.textBaseline = "middle";
  ctx.fillText(options.apkCardBadge.toUpperCase(), leftX + qrCardW / 2, currentY + 387);

  // Subtitle
  ctx.fillStyle = cardContrast.muted;
  ctx.font = `500 18px ${fontFam}`;
  ctx.textBaseline = "top";
  ctx.fillText(options.apkCardSubtitle, leftX + qrCardW / 2, currentY + 426);
  ctx.restore();

  // --- Right: Instant Web Portal Card ---
  const rightX = PADDING_X + qrCardW + 24;
  drawCard(rightX, currentY, qrCardW, qrCardH, 20);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = cardContrast.text;
  ctx.font = `900 22px ${fontFam}`;
  ctx.fillText(`🌐  ${options.webCardTitle}`, rightX + qrCardW / 2, currentY + 24);

  // QR Frame Box
  const rightQrX = rightX + (qrCardW - qrBoxSize) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rightQrX, qrY, qrBoxSize, qrBoxSize, 16);
  ctx.fill();
  ctx.stroke();

  if (portalQrImg) {
    ctx.drawImage(portalQrImg, rightQrX + 12, qrY + 12, qrBoxSize - 24, qrBoxSize - 24);
  }

  // Button Badge
  ctx.fillStyle = cardContrast.isLight ? "#09090b" : "#ffffff";
  ctx.beginPath();
  ctx.roundRect(rightX + (qrCardW - 210) / 2, currentY + 365, 210, 44, 22);
  ctx.fill();

  ctx.fillStyle = cardContrast.isLight ? "#ffffff" : "#09090b";
  ctx.font = `900 18px ${fontFam}`;
  ctx.textBaseline = "middle";
  ctx.fillText(options.webCardBadge.toUpperCase(), rightX + qrCardW / 2, currentY + 387);

  // Subtitle
  ctx.fillStyle = cardContrast.muted;
  ctx.font = `500 18px ${fontFam}`;
  ctx.textBaseline = "top";
  ctx.fillText(options.webCardSubtitle, rightX + qrCardW / 2, currentY + 426);
  ctx.restore();

  currentY += qrCardH + 24;

  // ----------------------------------------------------
  // 4. 3-Step Guided Instructions
  // ----------------------------------------------------
  if (options.showSteps) {
    const stepsH = 175;
    drawCard(PADDING_X, currentY, CONTENT_W, stepsH, 20);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = cardContrast.muted;
    ctx.font = `900 16px ${fontFam}`;
    ctx.fillText(options.stepsHeading.toUpperCase(), W / 2, currentY + 18);

    const stepW = CONTENT_W / 3;

    // Step 1
    ctx.fillStyle = options.brandColor;
    ctx.beginPath();
    ctx.arc(PADDING_X + stepW * 0.5, currentY + 68, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 20px ${fontFam}`;
    ctx.textBaseline = "middle";
    ctx.fillText("1", PADDING_X + stepW * 0.5, currentY + 68);
    ctx.fillStyle = cardContrast.text;
    ctx.font = `bold 20px ${fontFam}`;
    ctx.fillText(options.step1Title, PADDING_X + stepW * 0.5, currentY + 106);
    ctx.fillStyle = cardContrast.muted;
    ctx.font = `500 17px ${fontFam}`;
    ctx.fillText(options.step1Desc, PADDING_X + stepW * 0.5, currentY + 132);

    // Step 2
    ctx.fillStyle = options.brandColor;
    ctx.beginPath();
    ctx.arc(PADDING_X + stepW * 1.5, currentY + 68, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 20px ${fontFam}`;
    ctx.textBaseline = "middle";
    ctx.fillText("2", PADDING_X + stepW * 1.5, currentY + 68);
    ctx.fillStyle = cardContrast.text;
    ctx.font = `bold 20px ${fontFam}`;
    ctx.fillText(options.step2Title, PADDING_X + stepW * 1.5, currentY + 106);
    ctx.fillStyle = cardContrast.muted;
    ctx.font = `500 17px ${fontFam}`;
    ctx.fillText(options.step2Desc, PADDING_X + stepW * 1.5, currentY + 132);

    // Step 3
    ctx.fillStyle = options.brandColor;
    ctx.beginPath();
    ctx.arc(PADDING_X + stepW * 2.5, currentY + 68, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 20px ${fontFam}`;
    ctx.textBaseline = "middle";
    ctx.fillText("3", PADDING_X + stepW * 2.5, currentY + 68);
    ctx.fillStyle = cardContrast.text;
    ctx.font = `bold 20px ${fontFam}`;
    ctx.fillText(options.step3Title, PADDING_X + stepW * 2.5, currentY + 106);
    ctx.fillStyle = cardContrast.muted;
    ctx.font = `500 17px ${fontFam}`;
    ctx.fillText(options.step3Desc, PADDING_X + stepW * 2.5, currentY + 132);

    ctx.restore();
    currentY += stepsH + 24;
  }

  // ----------------------------------------------------
  // 5. Wi-Fi & Office Info
  // ----------------------------------------------------
  if (options.showWifi || options.showOffice) {
    const bottomCardW = options.showWifi && options.showOffice ? (CONTENT_W - 20) / 2 : CONTENT_W;
    const bottomH = 130;

    if (options.showWifi) {
      drawCard(PADDING_X, currentY, bottomCardW, bottomH, 18);
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Wifi Icon
      ctx.fillStyle = "#10b981";
      ctx.font = `bold 32px ${fontFam}`;
      ctx.fillText("📶", PADDING_X + 22, currentY + 38);

      ctx.fillStyle = cardContrast.muted;
      ctx.font = `900 16px ${fontFam}`;
      ctx.fillText(options.wifiHeader.toUpperCase(), PADDING_X + 75, currentY + 22);

      ctx.fillStyle = cardContrast.text;
      ctx.font = `bold 22px ${fontFam}`;
      ctx.fillText(options.wifiSsid, PADDING_X + 75, currentY + 48);

      ctx.fillStyle = cardContrast.muted;
      ctx.font = `500 18px ${fontFam}`;
      ctx.fillText(`Pass: `, PADDING_X + 75, currentY + 80);
      ctx.fillStyle = cardContrast.text;
      ctx.font = `bold 18px ${fontFam}`;
      ctx.fillText(options.wifiPassword, PADDING_X + 125, currentY + 80);
      ctx.restore();
    }

    if (options.showOffice) {
      const officeX = options.showWifi ? PADDING_X + bottomCardW + 20 : PADDING_X;
      drawCard(officeX, currentY, bottomCardW, bottomH, 18);
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Phone Icon
      ctx.fillStyle = "#6366f1";
      ctx.font = `bold 32px ${fontFam}`;
      ctx.fillText("📞", officeX + 22, currentY + 38);

      ctx.fillStyle = cardContrast.muted;
      ctx.font = `900 16px ${fontFam}`;
      ctx.fillText(options.officeHeader.toUpperCase(), officeX + 75, currentY + 22);

      ctx.fillStyle = cardContrast.text;
      ctx.font = `bold 22px ${fontFam}`;
      ctx.fillText(options.contactPhone, officeX + 75, currentY + 48);

      ctx.fillStyle = cardContrast.muted;
      ctx.font = `500 18px ${fontFam}`;
      ctx.fillText(options.officeHours, officeX + 75, currentY + 80);
      ctx.restore();
    }

    currentY += bottomH + 24;
  }

  // ----------------------------------------------------
  // 6. Footer Stamp
  // ----------------------------------------------------
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = cardContrast.muted;
  ctx.font = `500 18px ${fontFam}`;
  ctx.fillText(`© ${new Date().getFullYear()} ${options.propertyName} · Resident Portal`, PADDING_X, H - 45);

  ctx.textAlign = "right";
  ctx.fillStyle = "#10b981";
  ctx.font = `bold 18px ${fontFam}`;
  ctx.fillText(`🛡️ ${options.footerBadge}`, W - PADDING_X, H - 45);
  ctx.restore();

  return canvas;
}
