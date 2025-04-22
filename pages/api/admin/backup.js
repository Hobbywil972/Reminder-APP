import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const prisma = new PrismaClient();

  if (req.method === 'GET') {
    // Exporte toutes les données principales en JSON
    const users = await prisma.user.findMany();
    const clients = await prisma.client.findMany();
    const products = await prisma.product.findMany();
    const contracts = await prisma.contract.findMany({ include: { contractProducts: true, client: true, user: true } });
    const reminders = await prisma.reminder.findMany();
    const emailTemplates = await prisma.emailTemplate.findMany();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="backup-reminder-app.json"');
    return res.status(200).send(JSON.stringify({ users, clients, products, contracts, reminders, emailTemplates }, null, 2));
  }

  if (req.method === 'POST') {
    // Restauration destructive depuis un fichier JSON
    try {
      const { users, clients, products, contracts, reminders, emailTemplates, force } = req.body;
      // Si on est en mode simulation (dryRun), on ne demande jamais la confirmation force=true
      if (!force && !req.body.dryRun) {
        return res.status(400).json({ error: 'Confirmation requise pour écrasement des données (force=true)' });
      }
      // 1. Vérification complète AVANT toute suppression
      const pick = (obj, fields) => Object.fromEntries(Object.entries(obj).filter(([k]) => fields.includes(k)));
      const userFields = ['email', 'password', 'name', 'role', 'createdAt'];
      const clientFields = ['name', 'createdAt'];
      const productFields = ['reference', 'description', 'createdAt'];
      const contractFields = ['email', 'clientId', 'userId', 'startDate', 'duration', 'createdAt', 'renewalAlertMonths', 'status'];
      const contractProductFields = ['contractId', 'productId', 'quantity'];
      const reminderFields = ['contractId', 'userId', 'email', 'alarmOffset', 'nextAlarmDate', 'active', 'sentDates', 'createdAt'];
      const emailTemplateFields = ['name', 'subject', 'body', 'updatedAt'];

      const usersClean = users.map(u => pick(u, userFields));
      const clientsClean = clients.map(c => pick(c, clientFields));
      const productsClean = products.map(p => pick(p, productFields));
      const contractsClean = contracts.map(c => pick(c, contractFields));
      // contractProducts peut venir à plat ou via contracts
      let contractProductsFlat = contracts.flatMap(c => c.contractProducts || []);
      if (Array.isArray(contractProductsFlat) && contractProductsFlat.length === 0 && Array.isArray(contractProducts)) {
        contractProductsFlat = contractProducts;
      }
      const contractProductsClean = contractProductsFlat.map(cp => pick(cp, contractProductFields));
      const remindersClean = reminders.map(r => pick(r, reminderFields));
      const emailTemplatesClean = emailTemplates.map(e => pick(e, emailTemplateFields));

      // Vérification unicité email User
      const emails = usersClean.map(u => u.email);
      const emailSet = new Set(emails);
      if (emails.length !== emailSet.size) {
        return res.status(400).json({ error: 'Doublons d\'emails détectés dans les utilisateurs. Restauration annulée.' });
      }
      // Vérification unicité Client.name, Product.reference, EmailTemplate.name
      const uniq = arr => arr.length === new Set(arr).size;
      if (!uniq(clientsClean.map(c => c.name))) {
        return res.status(400).json({ error: 'Doublons dans les noms de clients.' });
      }
      if (!uniq(productsClean.map(p => p.reference))) {
        return res.status(400).json({ error: 'Doublons dans les références produits.' });
      }
      if (!uniq(emailTemplatesClean.map(e => e.name))) {
        return res.status(400).json({ error: 'Doublons dans les noms de modèles d\'email.' });
      }
      // Vérification structure minimale (ex : users, clients... non vides)
      if (!usersClean.length) return res.status(400).json({ error: 'Aucun utilisateur à restaurer.' });
      if (!clientsClean.length) return res.status(400).json({ error: 'Aucun client à restaurer.' });
      if (!productsClean.length) return res.status(400).json({ error: 'Aucun produit à restaurer.' });
      // Vérification des champs obligatoires (exemple User)
      if (usersClean.some(u => !u.email || !u.password || !u.name)) {
        return res.status(400).json({ error: 'Un ou plusieurs utilisateurs sont incomplets.' });
      }
      // Autres vérifications à ajouter ici si besoin...

      // 2. Mode simulation (dry run) : on ne touche pas à la base
      if (req.body.dryRun) {
        return res.status(200).json({
          success: true,
          dryRun: true,
          message: 'Vérification réussie : le fichier de sauvegarde est correct.'
        });
      }
      // 3. Suppression de toutes les données principales (ordre : relations -> parents)
      await prisma.reminder.deleteMany();
      await prisma.contractProduct.deleteMany();
      await prisma.contract.deleteMany();
      await prisma.client.deleteMany();
      await prisma.product.deleteMany();
      await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } }); // On garde au moins un admin
      await prisma.emailTemplate.deleteMany();
      // 4. Réinsertion (ordre : parents -> relations)
      await prisma.user.createMany({ data: usersClean });
      await prisma.client.createMany({ data: clientsClean });
      await prisma.product.createMany({ data: productsClean });
      await prisma.contract.createMany({ data: contractsClean });
      await prisma.contractProduct.createMany({ data: contractProductsClean });
      await prisma.reminder.createMany({ data: remindersClean });
      await prisma.emailTemplate.createMany({ data: emailTemplatesClean });
      return res.status(200).json({ success: true, message: 'Restauration destructive effectuée' });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
