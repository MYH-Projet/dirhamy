-- DropIndex
DROP INDEX "Transaction_compteId_date_montant_idx";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "idDestination" INTEGER;

-- CreateIndex
CREATE INDEX "Transaction_compteId_date_id_montant_idx" ON "Transaction"("compteId", "date", "id", "montant");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_idDestination_fkey" FOREIGN KEY ("idDestination") REFERENCES "Compte"("id") ON DELETE SET NULL ON UPDATE CASCADE;
