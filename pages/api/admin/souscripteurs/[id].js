import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]'; // Ajusté le chemin relatif
import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Accès refusé.' });
  }

  const { id } = req.query;
  const souscripteurId = parseInt(id, 10);

  if (isNaN(souscripteurId)) {
    return res.status(400).json({ error: "L'ID du souscripteur est invalide." });
  }

  // Vérifier si le souscripteur à affecter existe et est bien un SOUSCRIPTEUR
  // Cette vérification est faite avant chaque opération (PUT, DELETE, GET spécifique)
  const existingSouscripteur = await prisma.user.findUnique({
    where: { id: souscripteurId },
  });

  if (!existingSouscripteur) {
    return res.status(404).json({ error: 'Souscripteur non trouvé.' });
  }
  // On ne permet de modifier/supprimer/voir que les SOUSCRIPTEURS via cette route
  if (existingSouscripteur.role !== 'SOUSCRIPTEUR'){
    return res.status(403).json({ error: 'Cet utilisateur n\'est pas un souscripteur et ne peut pas être géré via cette route.' });
  }

  if (req.method === 'PUT') {
    const { name, email, password, clientId } = req.body;

    if (!name || !email || !clientId) {
      return res.status(400).json({ error: 'Les champs nom, email et ID client sont obligatoires.' });
    }

    const parsedClientId = parseInt(clientId, 10);
    if (isNaN(parsedClientId)) {
        return res.status(400).json({ error: "L'ID du client doit être un nombre valide." });
    }

    try {
      // Vérifier si le nouveau client existe
      const clientExists = await prisma.client.findUnique({
        where: { id: parsedClientId },
      });
      if (!clientExists) {
        return res.status(404).json({ error: 'Le nouveau client spécifié est introuvable.' });
      }

      // Préparer les données à mettre à jour
      const updateData = {
        name,
        email,
        clientId: parsedClientId,
      };

      // Si un mot de passe est fourni et non vide, le hacher et l'ajouter
      if (password && password.trim() !== '') {
        updateData.password = await hash(password, 10);
      }

      const updatedSouscripteur = await prisma.user.update({
        where: { id: souscripteurId },
        data: updateData,
        select: { // Renvoyer les données mises à jour, sans le mot de passe
          id: true,
          name: true,
          email: true,
          role: true,
          clientId: true,
          createdAt: true,
        },
      });

      return res.status(200).json(updatedSouscripteur);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du souscripteur:', error);
      // Gérer le cas où l'email est déjà pris (P2002 est le code d'erreur Prisma pour contrainte unique violée)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte.' });
      }
      return res.status(500).json({ error: 'Erreur interne du serveur lors de la mise à jour.' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.user.delete({
        where: { id: souscripteurId },
      });
      return res.status(200).json({ message: 'Souscripteur supprimé avec succès.' });
    } catch (error) {
      console.error('Erreur lors de la suppression du souscripteur:', error);
      // P2025 est le code d'erreur Prisma pour "Record to delete does not exist."
      // Bien que nous vérifions l'existence au début, une condition de concurrence pourrait se produire.
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Souscripteur non trouvé pour la suppression.' });
      }
      // Gérer d'autres erreurs potentielles, par exemple, des contraintes de clé étrangère
      // si le souscripteur est lié à d'autres enregistrements qui empêchent sa suppression.
      // Pour l'instant, une erreur générique.
      return res.status(500).json({ error: 'Erreur interne du serveur lors de la suppression.' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']); // Mettre à jour les méthodes autorisées
    res.status(405).end(`Méthode ${req.method} non autorisée sur /api/admin/souscripteurs/[id]`);
  }
}
