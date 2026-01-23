import { prisma } from "../lib/prisma";

export async function dataAggregator(userId: number): Promise<string> {

  // User profile(his basic infos and shit)

  const userProfile = await prisma.utilisateur.findUnique({
    where: { id: userId },
    select: { id: true, nom: true, prenom: true, email: true },
  });


  // Accounts

  const accounts = await prisma.compte.findMany({
    where: { utilisateurId: userId },
    select: { id: true, nom: true, type: true },
  });


  // Latest balances (from BalanceSnapshot: viva anas)

  const balances = await prisma.balanceSnapshot.findMany({
    where: {
      compte: { utilisateurId: userId },
    },
    orderBy: { date: "desc" },
    distinct: ["compteId"], // keep only the most recent snapshot per account
    select: {
      compteId: true, // useful to match balances and  accounts
      date: true,
      solde: true, 
    },
  });


  // Recent transactions (last 30 days)

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactions = await prisma.transaction.findMany({
    where: {
      compte: { utilisateurId: userId },
      date: { gte: thirtyDaysAgo },
    },
    select: {
      id: true,
      montant: true,
      type: true,
      date: true,
      description: true,
      compte: { select: { nom: true } },
      categorie: { select: { nom: true } },
    },
  });


  // Latest budget snapshots (from BudgetSnapshot)

  const budgets = await prisma.budgetSnapshot.findMany({
    where: {
      categorie: { utilisateurId: userId },
    },
    orderBy: { monthDate: "desc" },
    distinct: ["categorieId"], // keep only the most recent per category
    select: {
      id: true,
      categorieId: true,
      limit: true,
      spend: true,
      monthDate: true,
      categorie: { select: { nom: true } },
    },
  });


  // Savings goals (Objectif)
/*
  const goals = await prisma.objectif.findMany({
    where: { utilisateurId: userId },
    select: {
      id: true,
      nom: true,
      montantCible: true,
      montantActuel: true,
      dateCible: true,
    },
  });
*/


  const context = {
    userProfile,
    accounts,
    balances,
    transactions,
    budgets,
    //goals,
  };

  return JSON.stringify(context);
}