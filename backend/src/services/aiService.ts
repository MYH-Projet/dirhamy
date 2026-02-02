import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Available Groq models: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
const CHAT_MODEL = "llama-3.3-70b-versatile";
const INSIGHT_MODEL = "llama-3.3-70b-versatile";

//the mode is either "chat" for the chatbot responses or "Goal" for the goal setting responses
export async function generateResponse(
  userMessage: string,
  userData: string,
  historicalContext?: string[] // NEW: RAG-retrieved summaries
) {
  try {
    console.log("🚀 Calling Groq API with model:", CHAT_MODEL);

    // Build historical context section if available
    const historySection = historicalContext && historicalContext.length > 0
      ? `\n\nHistorical Context (past weekly summaries for reference):\n${historicalContext.map((s, i) => `Week ${i + 1}: ${s}`).join("\n")}\n`
      : "";

    const systemPrompt = `You are a friendly, knowledgeable financial advisor for Dirhamy, a personal finance app.

ABOUT YOU:
- You help users manage their money, achieve financial literacy, and build good financial habits
- Your audience is mainly young adults and students in Morocco
- You're friendly, supportive, and culturally aware

RESPONSE FORMATTING RULES:
- Use proper markdown formatting for readability
- Use **bold** for important terms or amounts
- Use bullet points (- or •) for lists
- Use numbered lists (1. 2. 3.) for steps
- Use line breaks to separate paragraphs
- Keep responses concise but helpful (2-4 short paragraphs max)
- Use emojis sparingly for friendliness (💰 📊 ✅ 💡)
- For numbers/amounts, format nicely (e.g., "1,500 MAD")

RESPONSE TONE:
- Be encouraging and positive
- Give actionable advice
- Reference their actual data when relevant
- If they're doing well, celebrate it! If they're struggling, be supportive`;

    const userPrompt = `${historySection}
Current user data: ${userData}

User message: ${userMessage}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: CHAT_MODEL,
      temperature: 0.7,
      max_tokens: 1024,
    });

    console.log("✅ Groq response generated");
    return completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again!";
  } catch (error) {
    console.error("❌ Groq API error:", error);
    return "Something went wrong. Please try again!";
  }
}

export async function generateInsight(userData: string, budgetData: Object[]) {
  try {
    console.log("🚀 Calling Groq API for insights with model:", INSIGHT_MODEL);

    const systemPrompt = `You are a financial advisor analyzing budget data. Your job is to create goal advice based on user's budget data.

RESPONSE FORMAT:
Respond ONLY with valid JSON in this exact format:
{
  "insights": [
    { "categoryName": "Food", "status": "warning", "message": "..." },
    { "categoryName": "Transport", "status": "good", "message": "..." }
  ]
}

RULES:
- status must be one of: "good", "warning", or "danger"
- message should be 1-3 sentences max
- Include insights for each budget category provided
- Be encouraging for "good" status, cautionary for "warning", and urgent for "danger"`;

    const userPrompt = `Budget Data: ${JSON.stringify(budgetData)}
User Data: ${userData}

Analyze the budget data and provide insights for each category.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: INSIGHT_MODEL,
      temperature: 0.5,
      max_tokens: 1024,
    });

    console.log("✅ Groq insight response generated");
    return completion.choices[0]?.message?.content || '{"insights": []}';
  } catch (error) {
    console.error("❌ Groq API error:", error);
    return "Something went wrong";
  }
}
