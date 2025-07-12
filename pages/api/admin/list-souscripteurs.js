import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Accès refusé.' });
  }

  if (req.method === 'GET') {
    try {
      const whereClause = {
        role: 'SOUSCRIPTEUR',
      };

      // Si l'utilisateur est un commercial, filtrer par son département
      if (session.user.role === 'COMMERCIAL') {
        if (!session.user.departementId) {
          // Un commercial doit être rattaché à un département pour voir des données.
          return res.status(200).json([]);
        }
        whereClause.client = {
          departementId: session.user.departementId,
        };
      }

      const souscripteurs = await prisma.user.findMany({
        where: whereClause,
        orderBy: {
          name: 'asc',
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clientId: true, // Le champ clé étrangère
            createdAt: true,
            client: { // Sélectionner les champs du client associé
              select: {
                id: true,
                name: true,
                departementId: true,
                departement: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
        }
      });
      return res.status(200).json(souscripteurs);
    } catch (error) {
      console.error('Erreur lors de la récupération des souscripteurs:', error);
      return res.status(500).json({ error: 'Erreur serveur lors de la récupération des souscripteurs.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
