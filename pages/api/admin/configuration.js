import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const CONFIG_PATH = path.join(process.cwd(), 'config.smtp.json');

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  if (req.method === 'GET') {
    // Lire la config SMTP
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return res.status(200).json(config);
    }
    return res.status(200).json({});
  }

  if (req.method === 'POST') {
    // Sauvegarder la config SMTP
    const { host, port, user, pass, from } = req.body;
    if (!host || !port || !user || !pass || !from) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ host, port, user, pass, from }, null, 2));
    return res.status(200).json({ success: true });
  }

  if (req.method === 'PUT') {
    // Tester la config SMTP sans la sauvegarder
    const { host, port, user, pass, from, to } = req.body;
    if (!host || !port || !user || !pass || !from || !to) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    try {
      let transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for 465, false for other ports
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to,
        subject: 'Test SMTP Reminder-APP',
        text: 'Ceci est un email de test SMTP depuis Reminder-APP',
      });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(400).json({ error: 'Erreur SMTP: ' + e.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
