import express, { Request, Response } from 'express';

import {prisma} from "./lib/prisma"

const app = express();
const port = 3000;


app.use(express.json());

// 2. Simple Route (Test Connection)
app.get('/', async (req:Request, res:Response) => {
    try {
    // This runs a simple "1+1" query on the database to check connection
    await prisma.$queryRaw`SELECT 1`; 
    res.status(200).json({ message: "Database is connected!", status: "OK" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not connect to database" });
  }
});
app.post('/users', async (req: Request, res: Response) => {
  try {
    const { nom, prenom, email, password } = req.body;

    // Prisma "Nested Write": Creates User AND their Accounts simultaneously
    const newUser = await prisma.utilisateur.create({
      data: {
        nom: nom,
        prenom: prenom,
        email: email,
        motDePasse: password, // In a real app, hash this!
        comptes: {
          create: [
            { nom: "Mon Cash", type: "Cash", solde: 0.0 },
            { nom: "Ma Banque", type: "Banque", solde: 0.0 }
          ]
        }
      },
      // Include the created accounts in the response so we can see them
      include: {
        comptes: true 
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating user" });
  }
});

// ---------------------------------------------------------
// 2. READ (Fetch All Users & Their Data)
// ---------------------------------------------------------
app.get('/users', async (req: Request, res: Response) => {
  const users = await prisma.utilisateur.findMany({
    include: {
      comptes: true,      // Join with Compte table
      categories: true,   // Join with Categorie table
    }
  });
  res.json(users);
});

// ---------------------------------------------------------
// 3. CREATE TRANSACTION (Add money to an account)
// ---------------------------------------------------------
app.post('/transactions', async (req: Request, res: Response) => {
  const { montant, compteId, description, type } = req.body;

  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        montant: parseFloat(montant),
        type: type, // "DEPENSE" or "REVENU"
        description: description,
        // Connect to existing Compte
        compte: { 
            connect: { id: compteId } 
        },
        // We need a category, assume ID 1 exists or handle it dynamically
        categorie: {
             create: { nom: "General", utilisateurId: 1 } // Creating one on the fly for demo
        }
      }
    });
    
    res.json(newTransaction);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Could not create transaction" });
  }
});

// ---------------------------------------------------------
// 4. UPDATE (Update User Profile)
// ---------------------------------------------------------
app.patch('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nom } = req.body;

  const updatedUser = await prisma.utilisateur.update({
    where: { id: Number(id) },
    data: { nom: nom },
  });

  res.json(updatedUser);
});




app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});