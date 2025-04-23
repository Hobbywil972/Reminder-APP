// utils/sendAllReminders.js
// Fonction utilitaire pour envoyer un rappel à tous les contrats non résiliés
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const CONFIG_PATH = path.join(process.cwd(), 'config.smtp.json');

function renderTemplate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));
}

export async function sendAllReminders() {
  const prisma = new PrismaClient();
  const today = new Date();
  today.setHours(0,0,0,0); // ignore l'heure

  // Récupère tous les contrats non résiliés, ayant au moins un Reminder actif dont nextAlarmDate = aujourd'hui
  const contracts = await prisma.contract.findMany({
    where: {
      status: { not: 'RESILIE' },
      reminders: {
        some: {
          active: true,
          nextAlarmDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      }
    },
    include: {
      client: true,
      contractProducts: { include: { product: true } },
      reminders: true,
    },
  });

  if (!fs.existsSync(CONFIG_PATH)) throw new Error('Config SMTP manquante');
  const smtp = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port),
    secure: Number(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  const template = await prisma.emailTemplate.findUnique({ where: { name: 'reminder' } });
  if (!template) throw new Error(`Modèle d’email 'reminder' introuvable`);

  let successCount = 0;
  let errorCount = 0;
  let notifiedContracts = [];

  for (const contract of contracts) {
    // Pour chaque reminder actif dont nextAlarmDate = today
    for (const reminder of contract.reminders) {
      if (!reminder.active) continue;
      const alarmDate = new Date(reminder.nextAlarmDate);
      alarmDate.setHours(0,0,0,0);
      if (alarmDate.getTime() !== today.getTime()) continue;

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
      try {
        await transporter.sendMail({
          from: smtp.from,
          to: reminder.email,
          subject,
          text: body,
        });
        successCount++;
        notifiedContracts.push(contract.id);
      } catch (e) {
        errorCount++;
        console.error(`Erreur envoi mail contrat ${contract.id}:`, e);
      }
    }
  }
  return { successCount, errorCount, total: notifiedContracts.length };
}
