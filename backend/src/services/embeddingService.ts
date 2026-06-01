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

// Cosine similarity between two equal-length vectors (range -1..1).
// MongoDB has no native vector search, so similarity is computed in-app.
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
