import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (
    req.method !== 'GET' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') ||
    (req.method === 'GET' && !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role))
  ) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  if (req.method === 'GET') {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        contracts: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(clients);
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nom du client obligatoire' });
    }
    const existing = await prisma.client.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'Ce nom de client existe déjà' });
    }
    const client = await prisma.client.create({ data: { name } });
    return res.status(201).json(client);
  }

  if (req.method === 'PUT') {
    const { id, name } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const client = await prisma.client.update({ where: { id }, data: { name } });
    return res.status(200).json(client);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID manquant' });
    }
    await prisma.client.delete({ where: { id } });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
