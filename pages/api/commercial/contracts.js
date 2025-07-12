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
      const contracts = await prisma.contract.findMany({
        where: {
          client: {
            departementId: parseInt(departementId, 10),
          },
        },
        include: {
          client: true,
          user: {
            select: { name: true }
          },
          contractProducts: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      });
      res.status(200).json(contracts);
    } catch (error) {
      console.error('Erreur API /api/commercial/contracts:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la récupération des contrats.' });
    } finally {
      await prisma.$disconnect();
    }
  
    } else if (req.method === 'PUT') {
    const { id, ...data } = req.body;
    const contractToUpdate = await prisma.contract.findUnique({ where: { id: parseInt(id) }, include: { client: true } });
    if (contractToUpdate?.client?.departementId !== session.user.departementId) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez pas modifier ce contrat.' });
    }
    try {
      const updatedContract = await prisma.contract.update({ where: { id: parseInt(id) }, data });
      res.status(200).json(updatedContract);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour du contrat.' });
    }

    } else if (req.method === 'DELETE') {
    const { id } = req.query;
    const contractToDelete = await prisma.contract.findUnique({ where: { id: parseInt(id) }, include: { client: true } });
    if (contractToDelete?.client?.departementId !== session.user.departementId) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez pas supprimer ce contrat.' });
    }
    try {
      await prisma.contract.delete({ where: { id: parseInt(id) } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du contrat.' });
    }

  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
