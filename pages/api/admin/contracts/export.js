import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Méthode ${req.method} non autorisée`);
    }
    const prisma = new PrismaClient();
    const contracts = await prisma.contract.findMany({
      include: {
        client: true,
        user: true,
        contractProducts: {
          include: { product: true }
        }
      }
    });
    // Génération du CSV
    let csv = 'ID contrat,Client,Commercial,Début,Durée (mois),Statut,Email,Produits/Quantités\n';
    contracts.forEach(c => {
      const produits = c.contractProducts.map(cp => `${cp.product.reference} (${cp.quantity})`).join(' | ');
      csv += `${c.id},"${c.client?.name||''}","${c.user?.name||''}",${c.startDate.toISOString().slice(0,10)},${c.duration},${c.status},${c.email||''},"${produits}"
`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contrats.csv"');
    res.status(200).send(csv);
  } catch (e) {
    console.error('Erreur export CSV:', e);
    res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
}
