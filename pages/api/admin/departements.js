import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const departements = await prisma.departement.findMany({
          orderBy: {
            name: 'asc',
          },
        });
        res.status(200).json(departements);
      } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des départements', error: error.message });
      }
      break;

    case 'POST':
      try {
        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ message: 'Le nom du département est requis' });
        }
        const newDepartement = await prisma.departement.create({
          data: { name },
        });
        res.status(201).json(newDepartement);
      } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Un département avec ce nom existe déjà.' });
        }
        res.status(500).json({ message: 'Erreur lors de la création du département', error: error.message });
      }
      break;

    case 'PUT':
        try {
            const { id, name } = req.body;
            if (!id || !name) {
                return res.status(400).json({ message: 'L\'ID et le nom du département sont requis' });
            }
            const updatedDepartement = await prisma.departement.update({
                where: { id: parseInt(id) },
                data: { name },
            });
            res.status(200).json(updatedDepartement);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: 'Un département avec ce nom existe déjà.' });
            }
            res.status(500).json({ message: 'Erreur lors de la mise à jour du département', error: error.message });
        }
        break;

    case 'DELETE':
        try {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ message: 'L\'ID du département est requis' });
            }
            // Vérifier si des utilisateurs sont liés à ce département
            const usersInDepartement = await prisma.user.count({
                where: { departementId: parseInt(id) },
            });
            if (usersInDepartement > 0) {
                return res.status(409).json({ message: 'Impossible de supprimer le département car il est assigné à un ou plusieurs utilisateurs.' });
            }

            await prisma.departement.delete({
                where: { id: parseInt(id) },
            });
            res.status(204).end(); // No Content
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la suppression du département', error: error.message });
        }
        break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
