import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

const OPTIONS_PATH = path.join(process.cwd(), 'config.notifications.json');

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  if (req.method === 'GET') {
    let options = { enabled: true, daysBefore: 7 };
    if (fs.existsSync(OPTIONS_PATH)) {
      options = JSON.parse(fs.readFileSync(OPTIONS_PATH, 'utf-8'));
    }
    return res.status(200).json(options);
  }
  if (req.method === 'POST') {
    const { enabled, daysBefore } = req.body;
    if (typeof enabled !== 'boolean' || typeof daysBefore !== 'number') {
      return res.status(400).json({ error: 'Paramètres invalides' });
    }
    fs.writeFileSync(OPTIONS_PATH, JSON.stringify({ enabled, daysBefore }, null, 2));
    return res.status(200).json({ success: true });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
