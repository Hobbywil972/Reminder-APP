import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
const formidable = require('formidable');
import fs from 'fs';
import { parse } from 'csv-parse/sync';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Méthode non autorisée');
  }
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Erreur lors du parsing du fichier.' });
    try {
      let file = files.file;
      if (Array.isArray(file)) file = file[0];
      if (!file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
      const filePath = file.filepath || file.path;
      if (!filePath) {
        return res.status(400).json({ error: `Fichier sans chemin valide (file = ${JSON.stringify(file)})` });
      }
      const csv = fs.readFileSync(filePath, 'utf8');
      const records = parse(csv, { columns: true, skip_empty_lines: true });
      const entityValue = String(fields.entity).toLowerCase().trim();
      // Import users.csv
      if (entityValue === 'users') {
        const prisma = new PrismaClient();
        for (const row of records) {
          await prisma.user.upsert({
            where: { email: row.email },
            update: { name: row.name, role: row.role },
            create: { email: row.email, name: row.name, role: row.role, password: row.password || 'changeme' },
          });
        }
        return res.status(200).json({ success: true, count: records.length });
      }
      // Import clients.csv
      if (entityValue === 'clients') {
        const prisma = new PrismaClient();
        for (const row of records) {
          await prisma.client.upsert({
            where: { name: row.name },
            update: {},
            create: { name: row.name },
          });
        }
        return res.status(200).json({ success: true, count: records.length });
      }
      // Import products.csv
      if (entityValue === 'products') {
        const prisma = new PrismaClient();
        for (const row of records) {
          await prisma.product.upsert({
            where: { reference: row.reference },
            update: { description: row.description },
            create: { reference: row.reference, description: row.description },
          });
        }
        return res.status(200).json({ success: true, count: records.length });
      }
      console.log('[IMPORT-CSV] Entité reçue :', fields.entity);
      return res.status(400).json({ error: `Import pour cette entité non implémenté. (entity=${fields.entity})` });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });
}
