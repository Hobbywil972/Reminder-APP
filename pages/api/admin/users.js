import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { hash } from 'bcrypt';

export default async function handler(req, res) {
  try {
  // Vérification du rôle admin
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  if (req.method === 'GET') {
    // Liste des utilisateurs
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    // Création d'un utilisateur
    const { name, email, password, role, departementId } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (role === 'COMMERCIAL' && !departementId) {
      return res.status(400).json({ error: 'Le département est obligatoire pour un commercial' });
    }

    if (existing) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    const hashed = await hash(password, 10);
        const data = { name, email, password: hashed, role };
    if (role === 'COMMERCIAL' && departementId) {
      data.departementId = parseInt(departementId, 10);
    }

    const user = await prisma.user.create({
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(201).json(user);
  }

  if (req.method === 'PUT') {
    // Modification d'un utilisateur
    const { id, name, email, password, role, departementId } = req.body;
    if (!id || !name || !email || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
        let data = { name, email, role };
    if (role === 'COMMERCIAL' && departementId) {
      data.departementId = parseInt(departementId, 10);
    } else {
      data.departementId = null;
    }
    if (password) {
      data.password = await hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(200).json(user);
  }

  if (req.method === 'DELETE') {
    // Suppression d'un utilisateur
    let { id } = req.body;
    id = parseInt(id, 10);
    if (!id) {
      return res.status(400).json({ error: 'ID manquant' });
    }
    // Empêcher la suppression de soi-même ou du dernier admin
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    if (userToDelete.email === session.user.email) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }
    if (userToDelete.role === 'ADMIN') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      // Seul le superadmin peut supprimer le dernier admin
      if (admins.length <= 1 && session.user.role !== 'SUPERADMIN') {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
      }
    }
    try {
      await prisma.user.delete({ where: { id } });
    } catch (err) {
      if (err.code === 'P2003') { // Foreign key constraint failed
        return res.status(400).json({ error: "Impossible de supprimer l'utilisateur car il est lié à d'autres enregistrements" });
      }
      throw err;
    }
    return res.status(204).end();
  }

      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  } catch (error) {
    console.error('API /users error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }
}
