import { generateResponse } from '../services/aiService';
import { Request, Response } from 'express';
import { dataAggregator } from '../services/dataAggregator';
import { AuthRequest, JwtPayload } from '../Middleware/authMiddleware';
import { retrieveRelevantSummaries } from '../services/weeklySummaryService';
import { saveMessage } from './chatHistoryController';

export const chat = async (req: AuthRequest, res: Response) => {

  // get user id from the token and verify if it's valid
  const user = req.user as JwtPayload;
  const userId = Number(user.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid User ID" });
  }

  // getting the user's request
  const userMessage = req.body.message;

  // Save user message to history
  await saveMessage(userId, userMessage, "user");

  // get user data from the dataAggregator function
  let userData: string;
  try {
    console.log("user id : ", userId);
    userData = await dataAggregator(userId);
    console.log("user data : ", userData);
  } catch (e) {
    console.error("❌ Error aggregating user data:", e);
    return res.status(500).json({ error: "Failed to gather user data" });
  }

  // RAG: Retrieve relevant historical context
  let historicalContext: string[] = [];
  try {
    console.log("🔍 Retrieving relevant historical summaries...");
    const relevantSummaries = await retrieveRelevantSummaries(userId, userMessage, 5);
    historicalContext = relevantSummaries.map(s => s.summary);
    console.log(`📚 Found ${historicalContext.length} relevant summaries`);
  } catch (e) {
    console.warn("⚠️ Failed to retrieve historical context (continuing without):", e);
    // Continue without historical context - not a critical failure
  }

  // Generate AI response with context
  let reply: string;
  try {
    reply = await generateResponse(userMessage, userData, historicalContext);
    console.log("reply of chat ai");
  } catch (e) {
    console.error("❌ Gemini API error:", e);
    return res.status(500).json({ error: "AI service failed" });
  }

  // Save AI response to history
  await saveMessage(userId, reply, "ai");

  return res.status(200).json({ reply });

}


