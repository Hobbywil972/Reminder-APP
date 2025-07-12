import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const dep = await prisma.departement.findUnique({ where: { name: 'INFODOM_Martinique' } });
    if (!dep) {
      console.error('Département "INFOM_Martinique" introuvable');
      process.exit(1);
    }
    const result = await prisma.client.updateMany({
      data: { departementId: dep.id },
      // where: { departementId: null }, // décommenter pour ne mettre à jour que les clients sans département
    });
    console.log(`Clients mis à jour : ${result.count}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
