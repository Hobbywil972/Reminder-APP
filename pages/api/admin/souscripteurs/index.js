import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]'; // Chemin ajusté car nous sommes un niveau plus bas
import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // La vérification de session et de rôle est cruciale ici
  if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return res.status(403).json({ error: 'Accès refusé. Seuls les administrateurs peuvent effectuer cette action.' });
  }

  if (req.method === 'POST') {
    const { name, email, password, clientId } = req.body;

    if (!name || !email || !password || !clientId) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires: nom, email, mot de passe et ID client.' });
    }

    const parsedClientId = parseInt(clientId, 10);
    if (isNaN(parsedClientId)) {
        return res.status(400).json({ error: "L'ID du client doit être un nombre valide." });
    }

    try {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
      }

      // Vérifier si le client existe
      const clientExists = await prisma.client.findUnique({
        where: { id: parsedClientId },
      });
      if (!clientExists) {
        return res.status(404).json({ error: 'Le client spécifié est introuvable.' });
      }

      // Hacher le mot de passe
      const hashedPassword = await hash(password, 10);

      // Créer le souscripteur
      const souscripteur = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'SOUSCRIPTEUR', // Rôle fixe pour les souscripteurs
          clientId: parsedClientId, 
        },
        select: { // Sélectionner les champs à retourner, exclure le mot de passe
          id: true,
          name: true,
          email: true,
          role: true,
          clientId: true,
          createdAt: true,
        },
      });

      return res.status(201).json(souscripteur);
    } catch (error) {
      console.error('Erreur lors de la création du souscripteur:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur lors de la création du souscripteur.' });
    }
  } else {
    // Gérer d'autres méthodes si nécessaire, ou simplement les refuser
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Méthode ${req.method} non autorisée sur /api/admin/souscripteurs`);
  }
}
