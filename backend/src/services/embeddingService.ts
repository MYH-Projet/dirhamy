import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Use the dedicated embedding model (768 dimensions)
const embeddingModel = genAi.getGenerativeModel({ model: "text-embedding-004" });

export async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values; // Returns array of 768 floats
    } catch (error) {
        console.error("Embedding generation error:", error);
        return null;
    }
}

// Helper to format embedding for pgvector SQL
export function formatVectorForPg(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
}