import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const CONFIG_PATH = path.join(process.cwd(), 'config.smtp.json');

function renderTemplate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));
}

// IMPORTANT : Conformément à la demande, la vérification d’email doit être contournée pour toutes les adresses se terminant par @infodom.com dans les notifications.
// Si une logique de vérification est ajoutée à l’avenir, il faut impérativement l’ignorer pour ce domaine.
export async function sendMail({ contract, templateName }) {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error('Config SMTP manquante');
  const smtp = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port),
    secure: Number(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  const prisma = new PrismaClient();
  const template = await prisma.emailTemplate.findUnique({ where: { name: templateName } });
  if (!template) throw new Error(`Modèle d’email '${templateName}' introuvable`);
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
  };
  const subject = renderTemplate(template.subject, vars);
  const body = renderTemplate(template.body, vars);
  console.log('[EMAIL-SEND] À:', contract.email, '| Sujet:', subject, '| Corps:', body);
  await transporter.sendMail({
    from: smtp.from,
    to: contract.email,
    subject,
    text: body,
  });
}
