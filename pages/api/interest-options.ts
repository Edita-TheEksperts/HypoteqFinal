import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const interest = await prisma.interest.findMany({ orderBy: { position: 'asc' } });
    return res.status(200).json(interest.map(i => ({ rate: i.rate, position: i.position })));
  }
  res.status(405).json({ error: 'Method not allowed' });
}
