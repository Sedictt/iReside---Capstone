import { jsPDF } from "jspdf";

interface LeasePdfData {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  property: {
    name: string;
    address: string;
    contract_template?: any;
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

export async function generateLeasePdf(data: LeasePdfData): Promise<Blob> {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 25;
  const lineSpacing = 6;
  const sectionSpacing = 12;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin + 10;
      return true;
    }
    return false;
  };

  const addHorizontalLine = (yPos: number) => {
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  const getUnitName = (name: string) => {
    const clean = name.trim();
    return clean.toLowerCase().startsWith('unit') ? clean : `Unit ${clean}`;
  };

  // 1. HEADER SECTION
  doc.setTextColor(10, 10, 10);
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text("RESIDENTIAL LEASE AGREEMENT", margin, y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`REF: #${data.id.split('-')[0].toUpperCase()}`, pageWidth - margin, y - 5, { align: "right" });
  doc.text(`DATE: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`, pageWidth - margin, y, { align: "right" });
  
  y += 8;
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text("Official Binding Documentation", margin, y);
  
  y += 10;
  addHorizontalLine(y);
  y += 15;

  // 2. PARTIES
  checkPageBreak(40);
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(10, 10, 10);
  doc.text("1. PARTIES", margin, y);
  y += 8;
  
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const introText = `This Agreement is entered into on ${dateStr} and between:`;
  doc.text(introText, margin, y);
  y += 15;

  // Landlord column
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("LANDLORD", margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.setTextColor(10, 10, 10);
  doc.text(data.landlord.name, margin, y);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1, margin + doc.getTextWidth(data.landlord.name), y + 1);

  // Tenant column
  const tenantX = pageWidth / 2 + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("TENANT", tenantX, y - 5);
  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.setTextColor(10, 10, 10);
  doc.text(data.tenant.name, tenantX, y);
  doc.line(tenantX, y + 1, tenantX + doc.getTextWidth(data.tenant.name), y + 1);

  y += sectionSpacing;
  addHorizontalLine(y);
  y += 12;

  // 3. THE PREMISES
  checkPageBreak(30);
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("2. THE PREMISES", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(getUnitName(data.unit.name), margin + 5, y);
  y += 6;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(data.property.address, margin + 5, y);
  
  y += sectionSpacing;
  addHorizontalLine(y);
  y += 12;

  // 4. TERM OF LEASE
  checkPageBreak(25);
  doc.setFont("times", "bold");
  doc.text("3. TERM OF LEASE", margin, y);
  y += 8;
  doc.setFont("times", "normal");
  const termText = `Term begins on ${data.startDate} and ends on ${data.endDate}.`;
  doc.text(termText, margin, y);

  y += sectionSpacing;
  addHorizontalLine(y);
  y += 12;

  // 5. RENT PAYMENTS
  checkPageBreak(25);
  doc.setFont("times", "bold");
  doc.text("4. RENT PAYMENTS", margin, y);
  y += 8;
  doc.setFont("times", "normal");
  const rentDueDay = data.property.contract_template?.answers?.rent_due_day || 1;
  const suffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };
  const rentText = `Monthly rent of PHP ${data.monthlyRent.toLocaleString('en-PH', { minimumFractionDigits: 2 })} due on the ${rentDueDay}${suffix(rentDueDay)} day of each month.`;
  doc.text(rentText, margin, y);

  y += sectionSpacing;
  addHorizontalLine(y);
  y += 12;

  // 6. SECURITY DEPOSIT
  checkPageBreak(25);
  doc.setFont("times", "bold");
  doc.text("5. SECURITY DEPOSIT", margin, y);
  y += 8;
  doc.setFont("times", "normal");
  const depositText = `Deposit of PHP ${data.securityDeposit.toLocaleString('en-PH', { minimumFractionDigits: 2 })} held for damages or defaults.`;
  doc.text(depositText, margin, y);

  y += sectionSpacing;
  addHorizontalLine(y);
  y += 12;

  // 7. UTILITIES & SERVICES
  checkPageBreak(25);
  doc.setFont("times", "bold");
  doc.text("6. UTILITIES AND SERVICES", margin, y);
  y += 8;
  doc.setFont("times", "normal");
  const utilities = data.property.contract_template?.answers?.included_utilities || "Water and Electricity";
  doc.text(`The Tenant shall be responsible for all costs related to: ${utilities}`, margin, y);

  y += sectionSpacing;
  addHorizontalLine(y);
  y += 12;

  // 8. AMENITIES
  checkPageBreak(25);
  doc.setFont("times", "bold");
  doc.text("7. AMENITIES AND FACILITIES", margin, y);
  y += 8;
  doc.setFont("times", "normal");
  doc.text("Access provided as part of residency: Standard residential access.", margin, y);

  y += sectionSpacing;
  addHorizontalLine(y);
  y += 12;

  // 9. BUILDING RULES
  doc.setFont("times", "bold");
  doc.text("8. BUILDING RULES & CONDUCT", margin, y);
  y += 8;
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  const rulesText = "Compliance required for: Maintenance: Tenant is responsible for minor repairs under 500 PHP., Quiet Hours: Property observes quiet hours from 10 PM to 6 AM.. Violations may constitute a material breach of this Agreement.";
  const splitRules = doc.splitTextToSize(rulesText, pageWidth - margin * 2);
  checkPageBreak(splitRules.length * 5 + 10);
  doc.text(splitRules, margin, y);
  y += (splitRules.length * 5) + 20;

  // 10. SIGNATURE SECTION
  checkPageBreak(50);
  const sigY = y + 20;
  doc.setLineWidth(0.5);
  doc.setDrawColor(100, 100, 100);
  
  // Left: Tenant
  doc.line(margin, sigY, margin + 80, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("TENANT SIGNATURE", margin, sigY + 5);
  
  if (data.tenantSignature) {
    try {
      // Render signature at larger size (80mm wide, auto-height to maintain aspect ratio)
      const sigWidth = 80;
      const sigHeight = 25;
      doc.addImage(data.tenantSignature, 'PNG', margin, sigY - sigHeight + 2, sigWidth, sigHeight);
    } catch (e) {}
  }

  // Right: Date Signed (Tenant)
  doc.line(pageWidth - margin - 80, sigY, pageWidth - margin, sigY);
  doc.text("DATE SIGNED", pageWidth - margin - 80, sigY + 5);
  
  if (data.tenantSignedAt) {
    const formattedTenantDate = new Date(data.tenantSignedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 10, 10);
    doc.text(formattedTenantDate, pageWidth - margin - 80, sigY - 5);
  }

  // New Section: Landlord Signature (shifted down)
  const landlordSigY = sigY + 30;
  doc.line(margin, landlordSigY, margin + 80, landlordSigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("LANDLORD SIGNATURE", margin, landlordSigY + 5);

  if (data.landlordSignature) {
    try {
      // Render signature at larger size (80mm wide, auto-height to maintain aspect ratio)
      const sigWidth = 80;
      const sigHeight = 25;
      doc.addImage(data.landlordSignature, 'PNG', margin, landlordSigY - sigHeight + 2, sigWidth, sigHeight);
    } catch (e) {}
  }

  // Right: Date Signed (Landlord)
  doc.line(pageWidth - margin - 80, landlordSigY, pageWidth - margin, landlordSigY);
  doc.text("DATE SIGNED", pageWidth - margin - 80, landlordSigY + 5);

  if (data.landlordSignedAt) {
    const formattedLandlordDate = new Date(data.landlordSignedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 10, 10);
    doc.text(formattedLandlordDate, pageWidth - margin - 80, landlordSigY - 5);
  }

  // Watermark
  doc.setTextColor(245, 245, 245);
  doc.setFontSize(120);
  doc.setFont("times", "bold");
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
  doc.text("OFFICIAL", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
  doc.restoreGraphicsState();

  return doc.output("blob");
}




