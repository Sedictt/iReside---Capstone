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
  terms?: Record<string, unknown>;
}

export async function generateLeasePdf(data: LeasePdfData): Promise<Blob> {
  const doc = new jsPDF();
  const margin = 20;
  let y = 30;

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RESIDENTIAL LEASE AGREEMENT", 105, y, { align: "center" });
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Lease ID: ${data.id}`, 105, y, { align: "center" });
  y += 20;

  // Parties
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("1. PARTIES", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`This Lease Agreement is made between:`, margin, y);
  y += 6;
  doc.text(`Landlord: ${data.landlord.name} (${data.landlord.email})`, margin + 5, y);
  y += 6;
  doc.text(`Tenant: ${data.tenant.name} (${data.tenant.email})`, margin + 5, y);
  y += 15;

  // Property
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("2. PROPERTY", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`The Landlord agrees to lease to the Tenant the following property:`, margin, y);
  y += 6;
  doc.text(`${data.property.name} - Unit ${data.unit.name}`, margin + 5, y);
  y += 6;
  doc.text(`${data.property.address}`, margin + 5, y);
  y += 15;

  // Term
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("3. TERM", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`The term of this lease shall be from ${data.startDate} to ${data.endDate}.`, margin, y);
  y += 15;

  // Rent & Deposit
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("4. RENT AND DEPOSIT", margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Monthly Rent: PHP ${data.monthlyRent.toLocaleString()}`, margin + 5, y);
  y += 6;
  doc.text(`Security Deposit: PHP ${data.securityDeposit.toLocaleString()}`, margin + 5, y);
  y += 15;

  // Terms
  if (data.terms) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("5. ADDITIONAL TERMS", margin, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    if (data.terms.house_rules && Array.isArray(data.terms.house_rules)) {
      doc.text("House Rules:", margin + 5, y);
      y += 6;
      data.terms.house_rules.forEach((rule: string) => {
        const splitRule = doc.splitTextToSize(`• ${rule}`, 160);
        doc.text(splitRule, margin + 10, y);
        y += splitRule.length * 6;
      });
    }
  }

  // Signature lines
  y = Math.max(y, 230);
  doc.line(margin, y, margin + 70, y);
  doc.line(120, y, 120 + 70, y);
  y += 5;
  doc.text("Landlord Signature", margin, y);
  doc.text("Tenant Signature", 120, y);

  return doc.output("blob");
}
