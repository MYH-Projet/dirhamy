-- Migration: Enable pgvector extension
-- This must be run AFTER the WeeklySummary table is created by Prisma

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: The index for vector similarity search should be created 
-- after there's some data in the table (IVFFlat requires training data)
-- For now, we'll create a simpler index that can be upgraded later

-- This will be run after the table exists:
-- CREATE INDEX IF NOT EXISTS weekly_summary_embedding_idx 
-- ON "WeeklySummary" 
-- USING ivfflat (embedding vector_cosine_ops) 
-- WITH (lists = 100);
