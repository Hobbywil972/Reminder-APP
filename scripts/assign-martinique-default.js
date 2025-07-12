require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Début du script de migration...');

  try {
    // 1. Créer le département "Martinique" s'il n'existe pas (upsert)
    const martiniqueDepartement = await prisma.departement.upsert({
      where: { name: 'Martinique' },
      update: {},
      create: { name: 'Martinique' },
    });
    console.log(`Département "Martinique" assuré avec l'ID: ${martiniqueDepartement.id}`);

    // 2. Mettre à jour tous les clients existants sans département
    const updatedClients = await prisma.client.updateMany({
      where: { departementId: null },
      data: { departementId: martiniqueDepartement.id },
    });
    console.log(`${updatedClients.count} clients ont été associés au département Martinique.`);

    // 3. Mettre à jour tous les commerciaux existants sans département
    const updatedCommerciaux = await prisma.user.updateMany({
      where: {
        role: 'COMMERCIAL',
        departementId: null,
      },
      data: { departementId: martiniqueDepartement.id },
    });
    console.log(`${updatedCommerciaux.count} commerciaux ont été associés au département Martinique.`);

    console.log('Script de migration terminé avec succès !');
  } catch (e) {
    console.error('Une erreur est survenue durant la migration:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
