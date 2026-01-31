/*
  Warnings:

  - A unique constraint covering the columns `[utilisateurId,nom]` on the table `Categorie` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Categorie_id_nom_key";

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_utilisateurId_nom_key" ON "Categorie"("utilisateurId", "nom");
