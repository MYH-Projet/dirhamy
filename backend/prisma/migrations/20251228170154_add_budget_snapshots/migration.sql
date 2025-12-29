-- AlterTable
ALTER TABLE "Categorie" ADD COLUMN     "limit" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "BudgetSnapshot" (
    "id" SERIAL NOT NULL,
    "monthDate" TIMESTAMP(3) NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categorieId" INTEGER NOT NULL,

    CONSTRAINT "BudgetSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetSnapshot_categorieId_monthDate_key" ON "BudgetSnapshot"("categorieId", "monthDate");

-- AddForeignKey
ALTER TABLE "BudgetSnapshot" ADD CONSTRAINT "BudgetSnapshot_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
