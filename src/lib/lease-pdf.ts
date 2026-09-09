import { jsPDF } from "jspdf";

/**
 * Exports a rendered LeaseDocument DOM element to a crisp, high-resolution Letter-sized PDF.
 * Faithfully preserves 100% of the typography, layout, borders, signatures, and watermark of LeaseDocument.
 */
export async function exportLeaseDocumentElementToPdf(
  element: HTMLElement,
  filename = "Lease_Agreement.pdf"
): Promise<Blob> {
  let imgData: string | null = null;

  // 1. Primary: modern-screenshot (native SVG/Canvas pipeline, 100% compatible with Tailwind v4, CSS vars, and web fonts)
  try {
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }
    const { domToPng } = await import("modern-screenshot");
    imgData = await domToPng(element, {
      scale: 2.5, // 240+ DPI crisp print fidelity
      backgroundColor: "#ffffff",
      style: {
        boxShadow: "none",
        margin: "0 auto",
      },
    });
  } catch (modernErr) {
    console.warn("[lease-pdf] modern-screenshot capture failed, trying html2canvas:", modernErr);
  }

  // 2. Secondary fallback: html2canvas
  if (!imgData) {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1024,
        onclone: (clonedDoc, clonedEl) => {
          clonedEl.style.boxShadow = "none";
          clonedEl.style.margin = "0 auto";
          clonedEl.style.backgroundColor = "#ffffff";
          const styleSheets = Array.from(clonedDoc.querySelectorAll("style, link[rel='stylesheet']"));
          styleSheets.forEach((sheet) => {
            try {
              const text = sheet.textContent || "";
              if (text.includes("@theme") || text.includes("oklch")) {
                sheet.remove();
              }
            } catch {
              // Ignore
            }
          });
        },
      });
      imgData = canvas.toDataURL("image/png");
    } catch (canvasErr) {
      console.warn("[lease-pdf] html2canvas capture failed, trying dom-to-image:", canvasErr);
    }
  }

  // 3. Tertiary fallback: dom-to-image
  if (!imgData) {
    try {
      const domtoimage = (await import("dom-to-image")).default;
      imgData = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: "#ffffff",
        style: {
          boxShadow: "none",
          margin: "0",
        },
      });
    } catch (domErr) {
      console.warn("[lease-pdf] dom-to-image also failed:", domErr);
    }
  }

  if (!imgData) {
    throw new Error("Unable to capture lease document canvas");
  }

  // Standard US Letter paper: 215.9mm x 279.4mm (8.5 x 11 inches)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;

  const imgProps = pdf.getImageProperties(imgData);
  const imgAspectRatio = imgProps.height / imgProps.width;

  // The captured LeaseDocument element already contains its own background and padding (margins).
  // Therefore, it maps directly to the Letter page without artificial double margins or 60mm gaps.
  let targetWidth = pageWidth;
  let targetHeight = targetWidth * imgAspectRatio;

  // If the rendered height exceeds Letter page height, scale down proportionally to fit 1 single page
  if (targetHeight > pageHeight) {
    const scaleFactor = pageHeight / targetHeight;
    targetWidth *= scaleFactor;
    targetHeight = pageHeight;
  }

  // Top-aligned (y = 0) so header starts right at the natural margin (built into the element's padding).
  // Center horizontally if scaled down.
  const xOffset = (pageWidth - targetWidth) / 2;
  const yOffset = 0;

  pdf.addImage(imgData, "PNG", xOffset, yOffset, targetWidth, targetHeight, undefined, "FAST");

  return pdf.output("blob");
}

export interface LeasePdfData {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  property: {
    name: string;
    address: string;
    city?: string;
    contract_template?: any;
    house_rules?: string[];
    amenities?: Array<{ name: string; [key: string]: any }>;
  };
  unit: {
    name: string;
  };
  landlord: {
    name: string;
    email: string;
  };
  tenant: {
    name: string;
    email: string;
  };
  terms?: any;
  tenantSignature?: string;
  tenantSignedAt?: string;
  landlordSignature?: string;
  landlordSignedAt?: string;
}

/**
 * Programmatic jsPDF generator that faithfully renders a 1-page Letter-sized
 * document matching the layout, typography, section underlines, left-bordered premises,
 * side-by-side signatures, and watermark of the on-screen LeaseDocument component.
 */
export async function generateLeasePdf(data: LeasePdfData): Promise<Blob> {
  // Standard Letter paper size (8.5in x 11in)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 185.9mm
  let y = 18;

  // 1. Watermark in background (-45 deg diagonal, centered)
  try {
    const isOfficial = data.landlordSignature || data.tenantSignature;
    const watermarkText = isOfficial ? "OFFICIAL LEASE" : "LEGAL DRAFT";
    doc.saveGraphicsState();
    doc.setTextColor(240, 240, 243);
    doc.setFont("times", "bold");
    doc.setFontSize(54);
    const GState = (doc as any).GState || (jsPDF as any).GState;
    if (GState) {
      doc.setGState(new GState({ opacity: 0.03 }));
    }
    doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: -45,
    });
    doc.restoreGraphicsState();
  } catch {
    // Non-blocking
  }

  // 2. HEADER SECTION
  doc.setTextColor(15, 23, 42); // text-zinc-950
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text("RESIDENTIAL LEASE AGREEMENT", margin, y);

  // Reference and Date placed on top right
  const refId = data.id
    ? data.id.length > 16
      ? data.id.slice(0, 8).toUpperCase()
      : data.id.toUpperCase()
    : "OFFICIAL";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`REF: #${refId}`, pageWidth - margin, y - 2, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`DATE: ${currentDate.toUpperCase()}`, pageWidth - margin, y + 2.5, { align: "right" });

  y += 5.5;
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Official Binding Documentation", margin, y);

  y += 4;
  // Thick black line under header (border-b-2 border-zinc-900)
  doc.setDrawColor(24, 24, 27);
  doc.setLineWidth(0.65);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Helper for section headings (border-b border-zinc-200 pb-0.5)
  const renderSectionHeader = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 1.8;
    doc.setDrawColor(228, 228, 231); // border-zinc-200
    doc.setLineWidth(0.25);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;
  };

  // 1. PARTIES
  renderSectionHeader("1. PARTIES");
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`This Agreement is entered into on ${currentDate}, by and between:`, margin, y);
  y += 4.5;

  const colWidth = contentWidth / 2;
  // Landlord column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 145);
  doc.text("LANDLORD", margin, y);
  y += 3.8;
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const landlordName = data.landlord?.name || "Landlord";
  doc.text(landlordName, margin, y);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.line(margin, y + 0.8, margin + doc.getTextWidth(landlordName), y + 0.8);

  // Tenant column (side-by-side)
  const tenantX = margin + colWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 145);
  doc.text("TENANT", tenantX, y - 3.8);
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const tenantName = data.tenant?.name || "Tenant";
  doc.text(tenantName, tenantX, y);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.line(tenantX, y + 0.8, tenantX + doc.getTextWidth(tenantName), y + 0.8);
  y += 9;

  // 2. THE PREMISES
  renderSectionHeader("2. THE PREMISES");
  const unitClean = (data.unit?.name || "").trim();
  const unitName = unitClean.toLowerCase().startsWith("unit") ? unitClean : `Unit ${unitClean}`;
  const addressText = data.property?.address || "Address not specified";
  // Subtle vertical left bar (border-l-2 border-zinc-200 pl-4)
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.65);
  doc.line(margin, y - 1, margin, y + 9);
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(unitName, margin + 4, y + 2.5);
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(addressText, margin + 4, y + 7.5);
  y += 13.5;

  // 3. TERM OF LEASE
  renderSectionHeader("3. TERM OF LEASE");
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Term begins on ${data.startDate} and ends on ${data.endDate}.`, margin, y);
  y += 9;

  // 4. RENT PAYMENTS
  renderSectionHeader("4. RENT PAYMENTS");
  const dueDay =
    data.property?.contract_template?.answers?.rent_due_day ||
    data.terms?.due_day ||
    data.terms?.rent_due_day ||
    1;
  const suffix = (day: number) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  const rentVal = Number(data.monthlyRent || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  });
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Monthly rent of PHP ${rentVal} due on the ${dueDay}${suffix(Number(dueDay))} day of each month.`,
    margin,
    y
  );
  y += 9;

  // 5. SECURITY DEPOSIT
  renderSectionHeader("5. SECURITY DEPOSIT");
  const depositVal = Number(data.securityDeposit || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  });
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`Deposit of PHP ${depositVal} held for damages or defaults.`, margin, y);
  y += 9;

  // 6. UTILITIES AND SERVICES
  renderSectionHeader("6. UTILITIES AND SERVICES");
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  const isInclusive =
    Array.isArray(data.property?.house_rules) &&
    data.property.house_rules.includes("strategy:inclusive");
  if (isInclusive) {
    doc.text(
      "The monthly rent is INCLUSIVE of standard essential utilities (Water and Electricity).",
      margin,
      y
    );
  } else {
    doc.text(
      "The Tenant shall be responsible for all costs related to: Water and Electricity.",
      margin,
      y
    );
  }
  y += 9;

  // 7. AMENITIES AND FACILITIES
  renderSectionHeader("7. AMENITIES AND FACILITIES");
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  const amenitiesList =
    Array.isArray(data.property?.amenities) && data.property.amenities.length > 0
      ? data.property.amenities.map((a) => a.name).join(", ") + "."
      : "Standard residential access.";
  doc.text(`Access provided as part of residency: ${amenitiesList}`, margin, y);
  y += 9;

  // 8. BUILDING RULES & CONDUCT
  renderSectionHeader("8. BUILDING RULES & CONDUCT");
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const rulesList =
    Array.isArray((data as any).rules) && (data as any).rules.length > 0
      ? (data as any).rules.join(", ")
      : Array.isArray(data.property?.house_rules) && data.property.house_rules.length > 0
      ? data.property.house_rules.filter((r: string) => !r.startsWith("strategy:")).join(", ")
      : "Standard residential conduct";
  const rulesFullText = `Compliance required for: ${rulesList}. Violations may constitute a material breach of this Agreement.`;
  const splitRules = doc.splitTextToSize(rulesFullText, contentWidth);
  doc.text(splitRules, margin, y);
  y += splitRules.length * 4.2 + 8;

  // SIGNATURES SECTION (Balanced placement across Letter page)
  const sigAreaY = Math.max(y, 222);

  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.line(margin, sigAreaY, pageWidth - margin, sigAreaY);

  const sigBoxY = sigAreaY + 4;
  const sigColWidth = 75;

  // Tenant Signature Block
  if (data.tenantSignature) {
    try {
      doc.addImage(data.tenantSignature, "PNG", margin, sigBoxY, 40, 10);
    } catch {
      doc.setFont("times", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      doc.text("Signed digitally", margin, sigBoxY + 8);
    }
  } else {
    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text("Pending signature", margin, sigBoxY + 8);
  }
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, sigBoxY + 11, margin + sigColWidth, sigBoxY + 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 125);
  doc.text("LESSEE (TENANT) SIGNATURE", margin, sigBoxY + 15);
  if (data.tenantSignedAt) {
    const tDate = new Date(data.tenantSignedAt).toLocaleDateString("en-US");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(tDate, margin + sigColWidth, sigBoxY + 15, { align: "right" });
  }

  // Landlord Signature Block
  const landlordX = margin + colWidth;
  if (data.landlordSignature) {
    try {
      doc.addImage(data.landlordSignature, "PNG", landlordX, sigBoxY, 40, 10);
    } catch {
      doc.setFont("times", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      doc.text("Signed digitally", landlordX, sigBoxY + 8);
    }
  } else {
    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text("Pending signature", landlordX, sigBoxY + 8);
  }
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(landlordX, sigBoxY + 11, landlordX + sigColWidth, sigBoxY + 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 125);
  doc.text("LESSOR (LANDLORD) SIGNATURE", landlordX, sigBoxY + 15);
  const lDate = data.landlordSignedAt
    ? new Date(data.landlordSignedAt).toLocaleDateString("en-US")
    : currentDate;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(lDate, landlordX + sigColWidth, sigBoxY + 15, { align: "right" });

  return doc.output("blob");
}
