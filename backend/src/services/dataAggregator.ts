import {prisma} from "../lib/prisma";
//this function return all the user's data needed to give to the fucking ai model
// i hope ts works
export async function dataAggregator(userId: number) : Promise<string>{

  // Default user related data (user profile)
  const userProfile = await prisma.utilisateur.findUnique({
    where:{
      id : userId
    },
    select :{
      id: true, nom : true, prenom : true, email : true
    }
  });


  // Accounts
  const account = await prisma.compte.findMany({
    where:{
      id : userId
    },
    select: {
      id: true, nom: true, type: true
    }
  })

  // Balance informations from the balance snapshot (viva anas)
  const balance = await prisma.balanceSnapshot.findMany({
    where :{
      id : userId
    },
    orderBy :{ date : "desc"},
    distinct :["compteId"],
    select :{
      id:true, date: true, solde: true
    }
  })

  // Transactions in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);

  const transactions = await prisma.transaction.findMany({
    where :{
      compte :{ utilisateurId : userId },
      date : thirtyDaysAgo
    },
    select :{
      id : true,
      montant: true,
      type: true,
      date: true,
      description : true,
      compte : { select : {nom: true}},
      categorie: { select : {nom: true}}

    }
  });

  // Budget Snapshot
  const budget = await prisma.BudgetSnapshot.findMany({
    where :{
      categorie :{ select : {utilisateurId: userId}}
    },
    orderBy:{monthDate :"desc"},
    distinct :["categorieId"],
    select:{
      id: true,
      categorieId : true,
      limit: true,
      spend : true,
      monthDate: true,
      categorie : {select : {nom :true }}
    }
  });


  // the freacking Goals 🔥
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

  const context = {
    userProfile,
    account,
    balance,
    transactions,
    budget,
    goals
  }

  return JSON.stringify(context);
}