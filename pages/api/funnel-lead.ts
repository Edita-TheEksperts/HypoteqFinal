import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return all leads
    try {
      const leads = await prisma.funnelLead.findMany();
      return res.status(200).json(leads);
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { firstName, lastName, email, phone, refSource } = req.body;
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const lead = await prisma.funnelLead.create({
        data: { firstName, lastName, email, phone, refSource },
      });
      return res.status(200).json({ success: true, lead });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
