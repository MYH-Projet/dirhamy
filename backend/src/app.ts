import express, { Request, Response } from 'express';
import {prisma} from "./lib/prisma"


import cron from 'node-cron';
import { generateDailySnapshots } from './jobs/snapshot-worker';
import { updateBudgetSnapshots } from './jobs/BudgetSnapshots'

import cookieParser from 'cookie-parser';


import authRoutes from './routers/authRouter';
import transactionRoutes from './routers/transactionRouter';
import balanceRouters from './routers/balanceRouter'
import categorieRoutes from './routers/categorieRoutes';
import budgetRouter from './routers/budgetRoutes';
import aiRouter from './routers/aiRouter';

import {authenticateToken , AuthRequest} from './Middleware/authMiddleware'
import { limitApiTraffic } from './Middleware/ratelimiterMiddleware';
import { cacheMiddl } from './Middleware/cacheMiddleware';




const app = express();



app.use(express.json());
app.use(cookieParser());


if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 0 * * *', () => {
    console.log('Cron Triggered: Running Snapshot Worker');
    generateDailySnapshots();
  });
  cron.schedule("0 0 */15 * *", () => {
    updateBudgetSnapshots()
      .catch(e => console.error("Job Failed:", e));
  });
}



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


app.use("/auth",authRoutes);
app.use(limitApiTraffic);
app.use(authenticateToken);
app.use(cacheMiddl);
app.use('/transactions', transactionRoutes);
app.use('/balance',balanceRouters);
app.use('/categories', categorieRoutes);
app.use('/budget',budgetRouter);
app.use('/ai', aiRouter);
app.get('/profile',async (req: AuthRequest, res) => {
  
  res.json({ 
    message: 'Welcome to the protected route', 
    user: req.user,
    acconts: await prisma.compte.findMany({
      where:{utilisateurId:req.user?.id}
    })
   });
});

export default app;