import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

const BRANDING_PATH = path.join(process.cwd(), 'config.branding.json');
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png');

export const config = {
  api: {
    bodyParser: false, // for file uploads
  },
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  if (req.method === 'GET') {
    let branding = {};
    if (fs.existsSync(BRANDING_PATH)) {
      branding = JSON.parse(fs.readFileSync(BRANDING_PATH, 'utf-8'));
    }
    const logoUrl = fs.existsSync(LOGO_PATH) ? '/logo.png' : null;
    return res.status(200).json({ ...branding, logoUrl });
  }

  if (req.method === 'POST') {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        const { name } = JSON.parse(data);
        if (!name) return res.status(400).json({ error: 'Nom requis' });
        fs.writeFileSync(BRANDING_PATH, JSON.stringify({ name }, null, 2));
        return res.status(200).json({ success: true });
      } catch (e) {
        return res.status(400).json({ error: 'Erreur de parsing' });
      }
    });
    return;
  }

  if (req.method === 'PUT') {
    // Upload logo image (PNG, max 1MB)
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (buffer.length > 1024 * 1024) return res.status(400).json({ error: 'Fichier trop volumineux (max 1Mo)' });
      fs.writeFileSync(LOGO_PATH, buffer);
      return res.status(200).json({ success: true });
    });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}
