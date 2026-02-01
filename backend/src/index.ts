import app from "./app";
import dotenv from 'dotenv';
import { scheduleWeeklySummaryJob } from "./jobs/weeklySummaryJob";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

// Schedule cron jobs
scheduleWeeklySummaryJob();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});