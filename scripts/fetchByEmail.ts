
import { prisma } from '../lib/prisma';

async function fetchAllByEmail(email: string) {
  // Fetch Client(s) by email
  const clients = await prisma.client.findMany({ where: { email } });

  // Fetch HoldingDocument(s) by email
  const holdingDocuments = await prisma.holdingDocument.findMany({ where: { email } });

  // Fetch Borrower(s) by email (if model exists)
  let borrowers: any[] = [];
  try {
    borrowers = await prisma.borrower.findMany({ where: { email } });
  } catch {}

  // Print results
  console.log('Clients:', clients);
  console.log('HoldingDocuments:', holdingDocuments);
  console.log('Borrowers:', borrowers);
}

fetchAllByEmail('nteschner@ihrsteuerberater.ch').catch(console.error);
