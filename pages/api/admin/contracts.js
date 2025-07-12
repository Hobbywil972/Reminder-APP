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
    let whereClause = {};
    if (session.user.role === 'COMMERCIAL') {
      whereClause = {
        client: {
          departementId: session.user.departementId,
        },
      };
    }

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, departement: { select: { id: true, name: true } } } },
        user: { select: { name: true } }, // Forcer l'inclusion du nom du commercial
        contractProducts: {
          include: {
            product: { select: { id: true, reference: true, description: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    return res.status(200).json(contracts);
  }

  if (req.method === 'POST') {
    const { clientId, productsWithQuantities, startDate, status, email, renewalAlertMonths, duration, commentaire, userEmail } = req.body;
    if (!clientId || !Array.isArray(productsWithQuantities) || productsWithQuantities.length === 0 || !startDate || !status || !email || !duration) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const emailToConnect = userEmail || session.user.email;
    const user = await prisma.user.findUnique({ where: { email: emailToConnect } });
    if (!user) {
        return res.status(400).json({ error: `L'utilisateur commercial avec l'email ${emailToConnect} n'a pas été trouvé.` });
    }

    // Validation email : format et domaine
    const allowedDomains = ['@infodom.com', '@dataguadeloupe.com', '@antiane.com'];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !allowedDomains.some(domain => email.endsWith(domain))) {
      return res.status(400).json({ error: 'Adresse email invalide ou domaine non autorisé (doit se terminer par @infodom.com, @dataguadeloupe.com, ou @antiane.com)'});
    }
    // Calcule endDate
    const dStart = new Date(startDate);
    const dEnd = new Date(startDate);
    dEnd.setMonth(dEnd.getMonth() + Number(duration));
    if (dEnd.getDate() !== dStart.getDate()) dEnd.setDate(0);

    if (session.user.role === 'SUPERADMIN') {
      return res.status(400).json({ error: 'Veuillez quitter le mode superadmin pour ces opérations.' });
    }
    try {
      const contract = await prisma.contract.create({
        data: {
          client: { connect: { id: clientId } },
          user: { connect: { id: user.id } }, // Connect with user ID
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
    const { id, clientId, productsWithQuantities, startDate, status, duration, renewalAlertMonths, email, commentaire, userEmail } = req.body;
    if (!id || !clientId || !Array.isArray(productsWithQuantities) || productsWithQuantities.length === 0 || !startDate || !status || !duration) {
      return res.status(400).json({ error: 'Champs obligatoires manquants pour la mise à jour' });
    }

    let userData = {};
    if (userEmail) {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) {
        userData = { user: { connect: { id: user.id } } };
      } else {
        console.warn(`[UPDATE-CONTRACT] Commercial user with email ${userEmail} not found. Contract will be updated without commercial link.`);
      }
    }

    // Calcule endDate
    const dStart = new Date(startDate);
    const dEnd = new Date(startDate);
    dEnd.setMonth(dEnd.getMonth() + Number(duration));
    if (dEnd.getDate() !== dStart.getDate()) dEnd.setDate(0);

    try {
      const updatedContract = await prisma.$transaction(async (prisma) => {
        // 1. Supprimer les anciens produits associés
        await prisma.contractProduct.deleteMany({ where: { contractId: Number(id) } });

        // 2. Mettre à jour le contrat et recréer les produits
        const contract = await prisma.contract.update({
          where: { id: Number(id) },
          data: {
            client: { connect: { id: Number(clientId) } },
            startDate: dStart,
            duration: Number(duration),
            status,
            renewalAlertMonths: Number(renewalAlertMonths),
            email,
            commentaire,
            ...userData, // Ajout de la liaison utilisateur
            contractProducts: {
              create: productsWithQuantities.map(({ productId, quantity }) => ({ product: { connect: { id: productId } }, quantity }))
            }
          },
          include: {
            client: true,
            user: true,
            contractProducts: { include: { product: true } }
          }
        });
        return contract;
      });

      return res.status(200).json(updatedContract);
    } catch (error) {
      console.error('Erreur Prisma lors de la mise à jour du contrat:', error);
      return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
    }
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
