import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const prisma = new PrismaClient();
  if (req.method === 'GET') {
    const name = req.query.name || 'reminder';
    const template = await prisma.emailTemplate.findUnique({ where: { name } });
    return res.status(200).json(template || {});
  }
  if (req.method === 'POST') {
    const { name = 'reminder', subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'Sujet et corps requis' });
    await prisma.emailTemplate.upsert({
      where: { name },
      update: { subject, body },
      create: { name, subject, body },
    });
    return res.status(200).json({ success: true });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
