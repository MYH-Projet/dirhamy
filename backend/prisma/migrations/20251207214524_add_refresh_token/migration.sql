-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "refreshToken" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_compteId_date_montant_idx" ON "Transaction"("compteId", "date", "montant");
