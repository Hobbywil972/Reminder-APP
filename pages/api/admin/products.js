import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session ||
    (req.method === 'GET' && !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) ||
    (req.method === 'POST' && !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) ||
    (['PUT', 'DELETE'].includes(req.method) && !['ADMIN', 'SUPERADMIN'].includes(session.user.role))
  ) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  if (req.method === 'GET') {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        reference: true,
        description: true,
      },
      orderBy: { reference: 'asc' },
    });
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
    const { reference, description } = req.body;
    if (!reference || !description) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const existing = await prisma.product.findUnique({ where: { reference } });
    if (existing) {
      return res.status(400).json({ error: 'Cette référence existe déjà' });
    }
    const product = await prisma.product.create({ data: { reference, description } });
    return res.status(201).json(product);
  }

  if (req.method === 'PUT') {
    const { id, reference, description } = req.body;
    if (!id || !reference || !description) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const product = await prisma.product.update({ where: { id }, data: { reference, description } });
    return res.status(200).json(product);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID manquant' });
    }
    await prisma.product.delete({ where: { id } });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
