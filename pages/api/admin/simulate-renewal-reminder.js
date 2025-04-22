import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
  const { contractId } = req.body;
  if (!contractId) return res.status(400).json({ error: 'contractId requis' });

  const prisma = new PrismaClient();
  const contract = await prisma.contract.findUnique({
    where: { id: Number(contractId) },
    include: { client: true, contractProducts: { include: { product: true } } }
  });
  if (!contract) return res.status(404).json({ error: 'Contrat introuvable' });

  // Crée ou met à jour un reminder de renouvellement pour ce contrat avec nextAlarmDate aujourd'hui
  const today = new Date();
  today.setHours(0,0,0,0);
  let reminder = await prisma.reminder.findFirst({ where: { contractId: contract.id } });
  if (reminder) {
    reminder = await prisma.reminder.update({
      where: { id: reminder.id },
      data: { nextAlarmDate: today, active: true }
    });
  } else {
    reminder = await prisma.reminder.create({
      data: {
        contract: { connect: { id: contract.id } },
        user: { connect: { id: contract.userId } },
        email: contract.email || contract.client?.email || '',
        alarmOffset: contract.renewalAlertMonths || 1, // valeur par défaut à 1 mois si non précisé
        nextAlarmDate: today,
        active: true,
        sentDates: [],
      }
    });
  }
  return res.status(200).json({ success: true, reminder });
}
