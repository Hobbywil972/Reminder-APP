import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session || session.user.role !== 'COMMERCIAL') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  if (req.method === 'GET') {
    const { departementId } = req.query;

    if (!departementId) {
      return res.status(400).json({ error: 'Le departementId est requis' });
    }

    const prisma = new PrismaClient();
    try {
      const clients = await prisma.client.findMany({
        where: {
          departementId: parseInt(departementId, 10),
        },
        include: {
          contracts: true, // Inclure les contrats pour avoir le compte
        },
        orderBy: {
          name: 'asc',
        },
      });
      res.status(200).json(clients);
    } catch (error) {
      console.error('Erreur API /api/commercial/clients:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients.' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
