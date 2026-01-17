import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");


export async function generateResponse(userMessage: string, userData: string){
    try {
        const model = genAi.getGenerativeModel({model:"gemini-2.5-flash"});
        const prompt=`you are a financial advisor for an app called Dirhamy.\n
        your job is to help the user manage their money,educate them and help them acheinve financial literacy and freedom\n
        you'll be dealing mainly with young adults and students in morocco so adopt a friendly tone that aligns with their culture.\n
        your replies should be in english and they should be short and to the point\n
        Response should be logical, easy to understand and based on the user's data provided below\n
        user data : ${userData}\n
        user message : ${userMessage}`;

        const result = await model.generateContent(prompt);

        return result.response.text();
        
    } catch (error) {
        console.log(error);
        return "Something went wrong";
    }

    
}