import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const CONFIG_PATH = path.join(process.cwd(), 'config.smtp.json');
const OPTIONS_PATH = path.join(process.cwd(), 'config.notifications.json');

function renderTemplate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));
}


export default async function handler(req, res) {
  // Pas de session requise, usage CRON
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
  const prisma = new PrismaClient();
  // Options notifications
  let options = { enabled: true, daysBefore: 7 };
  if (fs.existsSync(OPTIONS_PATH)) {
    options = JSON.parse(fs.readFileSync(OPTIONS_PATH, 'utf-8'));
  }
  if (!options.enabled) return res.status(200).json({ ok: true, skipped: 'Notifications désactivées' });

  // 1. Relances (reminder) : Reminders actifs dont nextAlarmDate = aujourd’hui et pas encore envoyés
  const today = new Date();
  today.setHours(0,0,0,0);
  const remindersToSend = await prisma.reminder.findMany({
    where: {
      nextAlarmDate: today,
      active: true,
      contract: { status: { not: 'RESILIE' } },
    },
    include: {
      contract: {
        include: {
          client: true,
          contractProducts: { include: { product: true } }
        }
      }
    }
  });
  for (const reminder of remindersToSend) {
    if (reminder.contract.status === 'RESILIE') continue;
    try {
      const { sendMail } = await import('../../utils/sendMail');
      await sendMail({ contract: reminder.contract, templateName: 'reminder' });
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentDates: { push: new Date() } }
      });
    } catch (e) { console.error('Erreur envoi relance:', reminder.id, e); }
  }

  // 2. Expiration : Reminders actifs dont nextAlarmDate < aujourd’hui et pas encore envoyés aujourd'hui
  const expiredReminders = await prisma.reminder.findMany({
    where: {
      nextAlarmDate: { lt: today },
      active: true,
      contract: { status: { not: 'RESILIE' } },
    },
    include: {
      contract: {
        include: {
          client: true,
          contractProducts: { include: { product: true } }
        }
      }
    }
  });
  for (const reminder of expiredReminders) {
    if (reminder.contract.status === 'RESILIE') continue;
    try {
      const { sendMail } = await import('../../utils/sendMail');
      await sendMail({ contract: reminder.contract, templateName: 'expiration' });
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentDates: { push: new Date() } }
      });
    } catch (e) { console.error('Erreur envoi expiration:', reminder.id, e); }
  }

  res.status(200).json({ ok: true, relances: remindersToSend.length, expirations: expiredReminders.length });
}
