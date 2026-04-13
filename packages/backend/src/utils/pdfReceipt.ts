import PDFDocument from 'pdfkit';

interface ReceiptData {
  receiptNumber: string;
  recipientName: string;
  recipientEmail: string;
  amount: number; // GHC
  paymentType: string;
  paymentMethod: string;
  gatewayRef: string;
  paidAt: Date;
}

/**
 * Generates a PDF payment receipt buffer.
 */
export function generatePaymentReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Header ─────────────────────────────────────────────────
    doc
      .fillColor('#1a3a5c')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('MEDIALINK GHANA', { align: 'center' });

    doc
      .fillColor('#c8861a')
      .fontSize(12)
      .font('Helvetica')
      .text('Sales Recruiter Platform', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fillColor('#333')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('PAYMENT RECEIPT', { align: 'center' });

    doc.moveDown(1);

    // ── Divider ────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#c8861a').stroke();
    doc.moveDown(0.5);

    // ── Receipt Info ───────────────────────────────────────────
    const lineHeight = 20;

    const addRow = (label: string, value: string) => {
      const y = doc.y;
      doc.fontSize(10).fillColor('#666').font('Helvetica').text(label, 50, y, { width: 200 });
      doc.fontSize(10).fillColor('#111').font('Helvetica-Bold').text(value, 260, y, { width: 300 });
      doc.moveDown(0.4);
    };

    addRow('Receipt Number:', data.receiptNumber);
    addRow('Date:', data.paidAt.toLocaleDateString('en-GH', { dateStyle: 'long' }));
    addRow('Recipient:', data.recipientName);
    addRow('Email:', data.recipientEmail);
    addRow('Payment Type:', data.paymentType);
    addRow('Payment Method:', data.paymentMethod);
    addRow('Gateway Reference:', data.gatewayRef);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#ddd').stroke();
    doc.moveDown(0.5);

    // ── Amount ─────────────────────────────────────────────────
    doc
      .fillColor('#1a3a5c')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(`AMOUNT PAID: GHC ${data.amount.toFixed(2)}`, { align: 'center' });

    doc.moveDown(1);

    // ── Footer ─────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#c8861a').stroke();
    doc.moveDown(0.5);

    doc
      .fillColor('#666')
      .fontSize(9)
      .font('Helvetica')
      .text(
        'This receipt is computer-generated and is valid without a signature. ' +
          'For queries, contact support@medialink.com.gh | Tel: +233-XX-XXX-XXXX',
        { align: 'center' }
      );

    doc
      .text('MediaLink Ghana © ' + new Date().getFullYear() + ' | medialink.com.gh', {
        align: 'center',
      });

    doc.end();
  });
}

interface PlacementAgreementData {
  placementId: string;
  applicantName: string;
  applicantPhone: string;
  employerCompany: string;
  jobTitle: string;
  startDate: Date;
  salaryGhc: number;
  revenueShareRate: number;
  monthlyFeeGhc: number;
  generatedAt: Date;
}

/**
 * Generates a Placement Agreement PDF buffer.
 */
export function generatePlacementAgreementPdf(data: PlacementAgreementData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fillColor('#1a3a5c').fontSize(22).font('Helvetica-Bold').text('MEDIALINK GHANA', { align: 'center' });
    doc.fillColor('#c8861a').fontSize(11).font('Helvetica').text('Sales Recruiter Platform', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#333').fontSize(16).font('Helvetica-Bold').text('PLACEMENT AGREEMENT', { align: 'center' });
    doc.moveDown(0.3);
    doc.fillColor('#555').fontSize(10).font('Helvetica').text(`Agreement ID: ${data.placementId}`, { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#c8861a').stroke();
    doc.moveDown(0.5);

    // Body
    doc.fillColor('#111').fontSize(10).font('Helvetica');
    doc.text(
      `This Placement Agreement ("Agreement") is entered into on ${data.generatedAt.toLocaleDateString('en-GH', { dateStyle: 'long' })} between:`,
      { lineGap: 4 }
    );
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('APPLICANT:');
    doc.font('Helvetica').text(`${data.applicantName} (Phone: ${data.applicantPhone})`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('EMPLOYER:');
    doc.font('Helvetica').text(`${data.employerCompany}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('ROLE:');
    doc.font('Helvetica').text(data.jobTitle);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('START DATE:');
    doc.font('Helvetica').text(data.startDate.toLocaleDateString('en-GH', { dateStyle: 'long' }));
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('AGREED GROSS MONTHLY SALARY:');
    doc.font('Helvetica').text(`GHC ${data.salaryGhc.toFixed(2)}`);
    doc.moveDown(1);

    // Revenue Share Terms
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#ddd').stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a3a5c').text('REVENUE SHARE TERMS');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#111');
    doc.text(
      `In consideration of MediaLink Ghana's recruitment services, the Applicant agrees to pay a monthly service fee of ${(data.revenueShareRate * 100).toFixed(1)}% of gross monthly salary (GHC ${data.monthlyFeeGhc.toFixed(2)}) for a period of SIX (6) consecutive months following the commencement of employment.`,
      { lineGap: 4 }
    );
    doc.moveDown(0.5);
    doc.text(
      `Payments shall be due on the 1st of each month and may be collected via MTN Mobile Money, Vodafone Cash, AirtelTigo Money, or bank transfer. Failure to pay within 7 days of the due date will attract escalating reminders. Non-payment beyond 30 days may result in account suspension.`,
      { lineGap: 4 }
    );
    doc.moveDown(1);

    // Signature blocks
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#ddd').stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a3a5c').text('SIGNATURES');
    doc.moveDown(1);

    const sigY = doc.y;
    doc.fillColor('#111').fontSize(10).font('Helvetica');
    doc.text('APPLICANT', 50, sigY);
    doc.moveTo(50, sigY + 40).lineTo(230, sigY + 40).strokeColor('#333').stroke();
    doc.text('Signature & Date', 50, sigY + 45);

    doc.text('EMPLOYER', 320, sigY);
    doc.moveTo(320, sigY + 40).lineTo(500, sigY + 40).strokeColor('#333').stroke();
    doc.text('Signature & Date', 320, sigY + 45);

    doc.moveDown(4);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#c8861a').stroke();
    doc.moveDown(0.5);
    doc.fillColor('#666').fontSize(8).text(
      'This agreement is governed by the laws of Ghana. MediaLink Ghana acts as an intermediary recruitment platform only.',
      { align: 'center' }
    );

    doc.end();
  });
}
