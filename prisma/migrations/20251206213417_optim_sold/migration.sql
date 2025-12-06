/*
  Warnings:

  - You are about to drop the column `solde` on the `Compte` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Compte" DROP COLUMN "solde";

-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "solde" DOUBLE PRECISION NOT NULL,
    "compteId" INTEGER NOT NULL,

    CONSTRAINT "BalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceSnapshot_compteId_date_idx" ON "BalanceSnapshot"("compteId", "date");

-- AddForeignKey
ALTER TABLE "BalanceSnapshot" ADD CONSTRAINT "BalanceSnapshot_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Compte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
