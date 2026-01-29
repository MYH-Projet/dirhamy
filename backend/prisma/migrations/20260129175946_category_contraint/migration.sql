/*
  Warnings:

  - A unique constraint covering the columns `[id,nom]` on the table `Categorie` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Transaction_compteId_date_montant_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_id_nom_key" ON "Categorie"("id", "nom");

-- CreateIndex
CREATE INDEX "Transaction_compteId_date_id_montant_idx" ON "Transaction"("compteId", "date", "id", "montant");
