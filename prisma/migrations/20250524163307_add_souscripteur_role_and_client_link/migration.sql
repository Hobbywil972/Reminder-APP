-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SOUSCRIPTEUR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clientId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
