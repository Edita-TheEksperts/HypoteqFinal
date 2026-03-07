

let prisma;
try {
  // Try to require the local TypeScript-compiled prisma client
  prisma = require('../lib/prisma').prisma;
} catch (e) {
  // Fallback: require the generated Prisma client directly from node_modules
  prisma = require('@prisma/client').PrismaClient ? new (require('@prisma/client').PrismaClient)() : null;
}

async function fetchAllByEmail(email) {
  // Fetch Client(s) by email
  const clients = await prisma.client.findMany({ where: { email } });
  console.log('Clients:', clients);

  // If a client is found, fetch related Inquiry and all related data
  if (clients.length > 0) {
    const client = clients[0];
    const inquiryId = client.inquiryId;
    console.log('InquiryId:', inquiryId);

    // Fetch Inquiry
    const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    console.log('Inquiry:', inquiry);

    // Fetch Project
    const project = await prisma.project.findUnique({ where: { inquiryId } });
    console.log('Project:', project);

    // Fetch Property
    const property = await prisma.property.findUnique({ where: { inquiryId } });
    console.log('Property:', property);

    // Fetch Financing
    const financing = await prisma.financing.findUnique({ where: { inquiryId } });
    console.log('Financing:', financing);

    // Fetch Borrowers
    let borrowers = [];
    try {
      borrowers = await prisma.borrower.findMany({ where: { inquiryId } });
    } catch {}
    console.log('Borrowers:', borrowers);

    // Fetch Documents (linked to Inquiry)
    let documents = [];
    try {
      documents = await prisma.document.findMany({ where: { inquiryId } });
    } catch {}
    console.log('Documents:', documents);
  } else {
    console.log('No client found for email:', email);
  }

  // Also fetch HoldingDocuments by email (legacy or unlinked docs)
  const holdingDocuments = await prisma.holdingDocument.findMany({ where: { email } });
  console.log('HoldingDocuments:', holdingDocuments);
}

fetchAllByEmail('nteschner@ihrsteuerberater.ch').catch(console.error);
