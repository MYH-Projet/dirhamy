import {generateInsight} from '../services/aiService';
import {Request, Response} from 'express';
import {dataAggregator} from '../services/dataAggregator';
import {AuthRequest,JwtPayload} from '../Middleware/authMiddleware'



export const budgetInsight = async(req : AuthRequest, res : Response) =>{

    const user = req.user as JwtPayload; 
    const userId = Number(user.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid User ID" });
    }
    
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

    // getting the user's request and getting the ai response

    let reply: string;
    try {
        reply = await generateInsight(userData);
    } catch (e) {
        console.error("❌ Gemini API error:", e);
        return res.status(500).json({ error: "AI service failed" });
    }


    return res.status(200).json({ reply });
    
}