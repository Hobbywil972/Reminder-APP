import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || // Vérifier aussi session.user
    (req.method === 'GET' && !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) ||
    (req.method === 'POST' && !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) ||
    (['PUT', 'DELETE'].includes(req.method) && !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role))
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
        departement: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(clients);
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    const { name, departementId } = req.body;
    let finalDepartementId = departementId;

    if (!name) {
      return res.status(400).json({ error: 'Le nom du client est obligatoire' });
    }

    // Si l'utilisateur est un commercial, on force son département
    if (session.user.role === 'COMMERCIAL') {
      const userWithDepartement = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { departementId: true },
      });
      if (!userWithDepartement?.departementId) {
        return res.status(403).json({ error: 'Votre compte n\'est pas associé à un département.' });
      }
      finalDepartementId = userWithDepartement.departementId;
    } else if (!departementId) {
      // Si c'est un admin, le departementId est requis
      return res.status(400).json({ error: 'Le département est obligatoire pour un administrateur' });
    }
    const existing = await prisma.client.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'Ce nom de client existe déjà' });
    }
    const client = await prisma.client.create({ data: { name, departementId: parseInt(finalDepartementId, 10) } });
    return res.status(201).json(client);
  }

  if (req.method === 'PUT') {
    const { id, name, departementId } = req.body;
    if (!id || !name || !departementId) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const client = await prisma.client.update({ where: { id }, data: { name, departementId: parseInt(departementId, 10) } });
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
