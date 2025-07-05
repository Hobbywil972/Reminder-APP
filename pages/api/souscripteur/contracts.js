import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Ajustez le chemin si nécessaire
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log('[API][souscripteur/contracts] Début du handler');
  const session = await getServerSession(req, res, authOptions);
  console.log('[API][souscripteur/contracts] Session récupérée:', JSON.stringify(session, null, 2));

  if (session && session.user) {
    console.log('[API][souscripteur/contracts] session.user:', JSON.stringify(session.user, null, 2));
    console.log('[API][souscripteur/contracts] session.user.id:', session.user.id, '(type:', typeof session.user.id, ')');
  } else {
    console.log('[API][souscripteur/contracts] Session ou session.user non trouvée.');
  }

  if (!session || !session.user || session.user.role !== 'SOUSCRIPTEUR') {
    return res.status(403).json({ error: 'Accès refusé. Seuls les souscripteurs peuvent accéder à cette ressource.' });
  }

  if (req.method === 'GET') {
    try {
      // Récupérer l'utilisateur connecté pour obtenir son clientId
      const connectedUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clientId: true },
      });

      if (!connectedUser || !connectedUser.clientId) {
        // Ce cas peut arriver si un SOUSCRIPTEUR n'est pas correctement lié à un client
        console.warn(`Souscripteur ID ${session.user.id} n'a pas de clientId associé.`);
        return res.status(404).json({ error: 'Aucun client n\'est associé à ce compte souscripteur.' });
      }

      const contracts = await prisma.contract.findMany({
        where: { clientId: connectedUser.clientId },
        include: {
          contractProducts: { // Inclure la table de jointure
            include: {
              product: true // Inclure les détails du produit à partir de la table de jointure
            }
          }
          // Pas besoin d'inclure le client ici, car nous l'avons déjà via connectedUser.clientId
        },
        orderBy: {
          startDate: 'asc', // Tri par date de début
        },
      });

      return res.status(200).json(contracts);
    } catch (error) {
      console.error('Erreur lors de la récupération des contrats pour le souscripteur:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur lors de la récupération des contrats.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
