import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // Allow ADMIN or SUPERADMIN to access this
  if (!session || !session.user || !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource.' });
  }

  if (req.method === 'GET') {
    try {
      const clients = await prisma.client.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      return res.status(200).json(clients);
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste des clients pour sélection:', error);
      return res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
