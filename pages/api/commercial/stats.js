import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

export default async function handle(req, res) {
  const session = await getSession({ req });

  if (!session || session.user.role !== 'COMMERCIAL') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const departementId = session.user.departementId;
  if (!departementId) {
    return res.status(400).json({ message: 'Département non spécifié pour ce commercial.' });
  }

  const prisma = new PrismaClient();
  
  try {
    if (req.method === 'GET') {
      const clientCount = await prisma.client.count({
        where: { departementId: departementId },
      });

      const contractCount = await prisma.contract.count({
        where: { client: { departementId: departementId } },
      });

      const allContracts = await prisma.contract.findMany({
        where: { client: { departementId: departementId } },
      });

      const now = new Date();
      const in30d = new Date();
      in30d.setDate(now.getDate() + 30);

      const expiringCount = allContracts.filter(c => {
        let end = c.endDate;
        if (!end && c.startDate && c.duration) {
          const d = new Date(c.startDate);
          d.setMonth(d.getMonth() + Number(c.duration));
          if (d.getDate() !== new Date(c.startDate).getDate()) d.setDate(0);
          end = d.toISOString();
        }
        return end && new Date(end) >= now && new Date(end) <= in30d;
      }).length;

      res.json({
        clients: clientCount,
        contracts: contractCount,
        expiring: expiringCount,
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erreur API /commercial/stats:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    await prisma.$disconnect();
  }
}
