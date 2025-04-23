import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'ID manquant' });
    }
    try {
      await prisma.product.delete({ where: { id: parseInt(id, 10) } });
      return res.status(204).end();
    } catch (e) {
      console.error('Erreur suppression produit:', e);
      if (e.code === 'P2025') {
        // Prisma: Record to delete does not exist.
        return res.status(404).json({ error: "Produit introuvable ou déjà supprimé" });
      }
      return res.status(500).json({ error: e.message || "Erreur serveur lors de la suppression" });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
