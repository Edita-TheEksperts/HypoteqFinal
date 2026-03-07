import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    method,
    body,
  } = req;

  if (method === 'PUT') {
    const { rate } = body;
    if (typeof rate !== 'number') {
      return res.status(400).json({ error: 'Invalid rate' });
    }
    const updated = await prisma.interest.update({
      where: { id: id as string },
      data: { rate },
    });
    return res.status(200).json(updated);
  }
  res.status(405).json({ error: 'Method not allowed' });
}
