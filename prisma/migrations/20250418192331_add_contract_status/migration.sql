-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('EN_COURS', 'EXPIRE', 'RESILIE');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "status" "ContractStatus" NOT NULL DEFAULT 'EN_COURS';
