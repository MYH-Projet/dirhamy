import express, { Request, Response } from 'express';
import {prisma} from "./lib/prisma"
import cron from 'node-cron';
import { generateDailySnapshots } from './jobs/snapshot-worker';

const app = express();



app.use(express.json());

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



export default app;