import express, { Request, Response } from 'express';
import {prisma} from "./lib/prisma"
import cron from 'node-cron';
import { generateDailySnapshots } from './jobs/snapshot-worker';
import cookieParser from 'cookie-parser';
import authRoutes from './routers/authRouter';
import transactionRoutes from './routers/transactionRouter';
import balanceRouters from './routers/balanceRouter'

import {authenticateToken , AuthRequest} from './Middleware/authMiddleware'



const app = express();



app.use(express.json());
app.use(cookieParser());

cron.schedule('0 0 * * *', () => {
  console.log('Cron Triggered: Running Snapshot Worker');
  generateDailySnapshots();
});

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


app.use("/api/auth",authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/balance',balanceRouters)
app.get('/profile', authenticateToken, (req: AuthRequest, res) => {
  res.json({ message: 'Welcome to the protected route', user: req.user });
});

export default app;