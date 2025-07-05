import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || ( // Vérifier aussi session.user
    req.method === 'GET' && !['ADMIN', 'COMMERCIAL', 'SUPERADMIN'].includes(session.user.role)
  ) || (
    req.method === 'POST' && !['ADMIN', 'COMMERCIAL', 'SUPERADMIN'].includes(session.user.role)
  ) || (
    req.method === 'PUT' && !['ADMIN', 'COMMERCIAL', 'SUPERADMIN'].includes(session.user.role)
  ) || (
    req.method === 'DELETE' && !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
  )) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  if (req.method === 'GET') {
    // Liste tous les contrats avec client et produits associés
    const contracts = await prisma.contract.findMany({
      include: {
        client: { select: { id: true, name: true } },
        user: { select: { name: true } }, // Inclure le nom du commercial
        contractProducts: {
          include: {
            product: { select: { id: true, reference: true, description: true } }
          }
        }
      },
      orderBy: { startDate: 'desc' },
    });
    return res.status(200).json(contracts);
  }

  if (req.method === 'POST') {
    const { clientId, productsWithQuantities, startDate, status, email, renewalAlertMonths, duration, commentaire } = req.body;
    if (!clientId || !Array.isArray(productsWithQuantities) || productsWithQuantities.length === 0 || !startDate || !status || !email || !duration) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    // Validation email : format et domaine
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !email.endsWith('@infodom.com')) {
      return res.status(400).json({ error: 'Adresse email invalide ou domaine non autorisé (doit se terminer par @infodom.com)'});
    }
    // Calcule endDate
    const dStart = new Date(startDate);
    const dEnd = new Date(startDate);
    dEnd.setMonth(dEnd.getMonth() + Number(duration));
    if (dEnd.getDate() !== dStart.getDate()) dEnd.setDate(0);
    console.log('[DEBUG-CONTRACT] Body reçu:', req.body, 'Session:', session?.user?.role);
    if (session.user.role === 'SUPERADMIN') {
      return res.status(400).json({ error: 'Veuillez quitter le mode superadmin pour ces opérations.' });
    }
    try {
      const contract = await prisma.contract.create({
        data: {
          client: { connect: { id: clientId } },
          user: { connect: { email: session.user.email } },
          startDate: dStart,
          duration: Number(duration),
          status,
          email: email || null,
          renewalAlertMonths: renewalAlertMonths ? Number(renewalAlertMonths) : null,
          commentaire: commentaire || null,

          contractProducts: {
            create: productsWithQuantities.map(({ productId, quantity }) => ({ product: { connect: { id: productId } }, quantity }))
          }
        },
        include: {
          client: true,
          contractProducts: { include: { product: true } }
        }
      });
      // Envoi automatique du mail de confirmation pour ADMIN et COMMERCIAL
      if (["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
        try {
          const { sendConfirmationEmail } = await import('../../../utils/sendConfirmationEmail');
          console.log('[EMAIL-CONFIRMATION] Tentative d’envoi à', contract.email, 'pour contrat', contract.id, 'Role:', session.role);
          await sendConfirmationEmail(contract);
          console.log('[EMAIL-CONFIRMATION] Envoi terminé pour', contract.email, 'contrat', contract.id);
        } catch (e) { console.error('[EMAIL-CONFIRMATION] Erreur envoi confirmation:', contract.email, contract.id, e); }
      }
      return res.status(201).json(contract);
    } catch (error) {
      console.error('Erreur Prisma lors de la création du contrat:', error);
      return res.status(500).json({ error: 'Erreur serveur: ' + (error.message || error) });
    }
  }

  if (req.method === 'PUT') {
    const { id, clientId, productsWithQuantities, startDate, status, duration, renewalAlertMonths, email, commentaire } = req.body;
    if (!id || !clientId || !Array.isArray(productsWithQuantities) || productsWithQuantities.length === 0 || !startDate || !status || !duration) {
      return res.status(400).json({ error: 'Champs obligatoires manquants pour la mise à jour' });
    }
    // Ne vérifie pas de doublons ni de présence de référence produit par ligne, accepte plusieurs fois le même produit
    // Met à jour le contrat + les produits associés
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        client: { connect: { id: clientId } },
        startDate: new Date(startDate),
        duration: Number(duration),
        renewalAlertMonths: renewalAlertMonths ? Number(renewalAlertMonths) : null,
        email: email || null,
        status,
        commentaire: commentaire || null,
        contractProducts: {
          deleteMany: {},
          create: productsWithQuantities.map(({ productId, quantity }) => ({
            quantity,
            product: { connect: { id: productId } },
          })),
        }
      },
      include: {
        client: true,
        contractProducts: { include: { product: true } }
      }
    });
    return res.status(200).json(contract);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID manquant' });
    }
    try {
      // Supprimer les liens ContractProduct avant de supprimer le contrat (évite les erreurs de contrainte)
      await prisma.contractProduct.deleteMany({ where: { contractId: id } });
      await prisma.contract.delete({ where: { id } });
      return res.status(204).end();
    } catch (e) {
      console.error('Erreur suppression contrat:', e);
      if (e.code === 'P2025') {
        return res.status(404).json({ error: "Contrat introuvable ou déjà supprimé" });
      }
      return res.status(500).json({ error: e.message || "Erreur serveur lors de la suppression" });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
