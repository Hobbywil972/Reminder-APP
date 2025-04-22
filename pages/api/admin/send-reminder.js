import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const CONFIG_PATH = path.join(process.cwd(), 'config.smtp.json');
const OPTIONS_PATH = path.join(process.cwd(), 'config.notifications.json');

function renderTemplate(str, vars) {
  // Remplace toutes les variables {nom} présentes dans str par vars[nom]
  return str.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
  const { contractId, templateName = 'reminder' } = req.body;
  if (!contractId) return res.status(400).json({ error: 'contractId requis' });

  const prisma = new PrismaClient();
  // Récupère les infos du contrat
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      client: true,
      contractProducts: { include: { product: true } },
    },
  });
  if (!contract) return res.status(404).json({ error: 'Contrat introuvable' });

  // Récupère les options de notification
  let options = { enabled: true, daysBefore: 7 };
  if (fs.existsSync(OPTIONS_PATH)) {
    options = JSON.parse(fs.readFileSync(OPTIONS_PATH, 'utf-8'));
  }
  if (!options.enabled) return res.status(400).json({ error: 'Notifications désactivées' });

  // Récupère le modèle d’email dynamiquement selon le nom passé
  const template = await prisma.emailTemplate.findUnique({ where: { name: String(templateName) } });
  if (!template) return res.status(400).json({ error: `Modèle d’email '${templateName}' introuvable` });

  // Prépare les variables pour le template
  const produits = contract.contractProducts.map(cp => `${cp.product.reference} (${cp.quantity})`).join(' | ');
  const vars = {
    client: contract.client?.name || '',
    client_email: contract.client?.email || '',
    contract_email: contract.email || '',
    produits,
    date: contract.startDate ? contract.startDate.toISOString().slice(0,10) : '',
    statut: contract.status || '',
    duration: contract.duration || '',
    contract_id: contract.id,
    // Ajoute d'autres champs si besoin
  };

  // Prépare le mail
  if (!fs.existsSync(CONFIG_PATH)) return res.status(500).json({ error: 'Config SMTP manquante' });
  const smtp = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port),
    secure: Number(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  const subject = renderTemplate(template.subject, vars);
  const body = renderTemplate(template.body, vars);

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: contract.email,
      subject,
      text: body,
    });
    return res.status(200).json({ success: true, templateUsed: templateName, subject, body });
  } catch (e) {
    return res.status(500).json({ error: e.message, templateUsed: templateName });
  }
}
