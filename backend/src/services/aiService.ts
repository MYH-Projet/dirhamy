import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { getBudgetStatus } from "../controllers/BudgetController";
dotenv.config();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

//the mode is either "chat" for the chatbot responses or "Goal" for the goal setting responses
export async function generateResponse(userMessage: string, userData: string, mode: string){
    try {
        const model = genAi.getGenerativeModel({model:"gemini-2.5-flash"});
        let prompt = "";
        if (mode="chat"){
          prompt=`you are a financial advisor for an app called Dirhamy.\n
                your job is to help the user manage their money,educate them and help them acheinve financial literacy and freedom\n
                you'll be dealing mainly with young adults and students in morocco so adopt a friendly tone that aligns with their culture.\n
                your replies should be in english and they should be short and to the point\n
                your replies shouldn't contain ** ** at all beceause it doesn't represent bold text in html\n
                your replies should be well formated and do not have "\n" and do not have slash n to make it readable\n
                Response should be logical, easy to understand and based on the user's data provided below\n
                user data : ${userData}\n
                user message : ${userMessage}`;  
        }
        else if (mode="budgetInsight"){
            prompt=`your job is to create a goal advice based on the user's data provided below\n
            the response should be 3 lines long at max and should contain advices to make him reach to goal or stay in budget\n
            the taon will differ based on the user's advancement in the goal/budget, like good ,warning or danger\n
            the category information is provided below because the response should be based on the user's budget and category in question\n
            category : ${getBudgetStatus}\n
            user data : ${userData}\n
            user message : ${userMessage}`;  
        }

        const result = await model.generateContent(prompt);

        return result.response.text();
        
    } catch (error) {
        console.log(error);
        return "Something went wrong";
    }

    
}