import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  const prisma = new PrismaClient();
  try {
    // Export users
    const users = await prisma.user.findMany({ select: { email: true, name: true, role: true, departementId: true }, include: { departement: { select: { name: true } } } });
    const usersData = users.map(u => ({ email: u.email, name: u.name, role: u.role, departementId: u.departementId || '', departementName: u.departement?.name || '' }));
    const usersCsv = new Parser({ fields: ['email', 'name', 'role', 'departementId', 'departementName'] }).parse(usersData);

    // Export clients
    const clients = await prisma.client.findMany({ select: { id: true, name: true, departementId: true }, include: { departement: { select: { name: true } } } });
    const clientsData = clients.map(c => ({ id: c.id, name: c.name, departementId: c.departementId || '', departementName: c.departement?.name || '' }));
    const clientsCsv = new Parser({ fields: ['id', 'name', 'departementId', 'departementName'] }).parse(clientsData);

    // Export products
    const products = await prisma.product.findMany({ select: { reference: true, description: true } });
    const productsCsv = new Parser({ fields: ['reference', 'description'] }).parse(products);

    // Export contracts
    const contracts = await prisma.contract.findMany({
      select: { id: true, clientId: true, userId: true, startDate: true, duration: true, status: true, email: true },
      include: { client: { select: { departementId: true, departement: { select: { name: true } } } } },
      orderBy: { startDate: 'desc' },
    });
    const contractsData = contracts.map(c => ({ ...c, departementId: c.client?.departementId || '', departementName: c.client?.departement?.name || '' }));
    const contractsCsv = new Parser({ fields: ['id', 'clientId', 'userId', 'departementId', 'departementName', 'startDate', 'duration', 'status', 'email'] }).parse(contractsData);

    // Export contractProducts
    const contractProducts = await prisma.contractProduct.findMany({ select: { contractId: true, productId: true, quantity: true } });
    const contractProductsCsv = new Parser({ fields: ['contractId', 'productId', 'quantity'] }).parse(contractProducts);

    // Bundle all CSVs in a zip (simple multi-part response for now)
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="export-reminder-csvs.zip"');
    // Pour la démo, on renvoie un objet JSON avec chaque CSV en base64 (remplacer par un vrai zip si besoin)
    res.status(200).json({
      users: Buffer.from(usersCsv).toString('base64'),
      clients: Buffer.from(clientsCsv).toString('base64'),
      products: Buffer.from(productsCsv).toString('base64'),
      contracts: Buffer.from(contractsCsv).toString('base64'),
      contractProducts: Buffer.from(contractProductsCsv).toString('base64'),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
