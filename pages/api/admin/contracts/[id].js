
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const token = await getToken({ req, secret });

  if (!token || (token.role !== 'ADMIN' && token.role !== 'SUPERADMIN')) {
    return res.status(401).json({ error: 'Accès non autorisé.' });
  }

  const { id } = req.query;
  const contractId = parseInt(id, 10);

  if (isNaN(contractId)) {
    return res.status(400).json({ error: 'ID de contrat invalide.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const contract = await prisma.contract.findUnique({
          where: { id: contractId },
          include: {
            client: true,
            contractProducts: { include: { product: true } },
          },
        });
        if (!contract) {
          return res.status(404).json({ error: 'Contrat non trouvé.' });
        }
        res.status(200).json(contract);
      } catch (error) {
        console.error('Erreur API GET /contracts/[id]:', error);
        res.status(500).json({ error: 'Erreur serveur.' });
      }
      break;

    case 'PUT':
      // Logique de mise à jour à implémenter si nécessaire
      res.status(501).json({ message: 'La méthode PUT n\'est pas encore implémentée.' });
      break;

    case 'DELETE':
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Supprimer les entrées dans la table de jointure ContractProduct
          await tx.contractProduct.deleteMany({
            where: { contractId: contractId },
          });

          // 2. Supprimer les rappels (Reminders) liés au contrat
          await tx.reminder.deleteMany({
            where: { contractId: contractId },
          });

          // 3. Supprimer le contrat lui-même
          await tx.contract.delete({
            where: { id: contractId },
          });
        });
        res.status(200).json({ message: 'Contrat supprimé avec succès.' });
      } catch (error) {
        console.error('Erreur API DELETE /contracts/[id]:', error);
        // Vérifier si l'erreur est due au fait que le contrat n'existe pas
        if (error.code === 'P2025') { // Code d'erreur Prisma pour 'Record to delete does not exist.'
            return res.status(404).json({ error: 'Contrat non trouvé.' });
        }
        res.status(500).json({ error: 'Erreur lors de la suppression du contrat.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
