import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone } = req.body;
  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Store in DB
    const lead = await prisma.funnelLead.create({
      data: { firstName, lastName, email, phone },
    });

    // TODO: Send email notification here

    return res.status(200).json({ success: true, lead });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
