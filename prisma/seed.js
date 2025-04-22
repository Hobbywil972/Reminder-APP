// Script de seed pour Reminder-APP
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Création d'un administrateur
  const adminPassword = await bcrypt.hash('Admin@2024', 10);
  await prisma.user.upsert({
    where: { email: 'admin@infodom.com' },
    update: {},
    create: {
      email: 'admin@infodom.com',
      password: adminPassword,
      name: 'Administrateur',
      role: 'ADMIN',
    },
  });

  // Création de clients
  await prisma.client.createMany({
    data: [
      { name: 'Société Alpha' },
      { name: 'Entreprise Beta' },
      { name: 'Groupe Gamma' },
    ],
    skipDuplicates: true,
  });

  // Création de références produits
  await prisma.product.createMany({
    data: [
      { reference: 'PROD-001', description: 'Licence Logiciel X' },
      { reference: 'PROD-002', description: 'Maintenance Serveur Y' },
      { reference: 'PROD-003', description: 'Abonnement Cloud Z' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed terminé. Admin: admin@infodom.com / Admin@2024');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
