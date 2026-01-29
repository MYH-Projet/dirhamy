import { Request, Response } from "express";
import { AuthRequest, JwtPayload } from "../Middleware/authMiddleware";
import { prisma } from "../lib/prisma";
import * as transactionServices from "../services/transactionServices";
import { AppError } from "../utils/AppError";
import { keyGenerator,cache } from "../utils/cache";

export const getTransaction = async (req: AuthRequest, res: Response) => {
  // 1. Parse User ID
  const user = req.user as JwtPayload;
  const userId = Number(user.id);
  const cacheInfo = keyGenerator(req);
  console.log('key in the controller: ',cacheInfo.key,cacheInfo.tags)
  // 2. Parse Cursor (from query param ?cursor=123)
  const cursorParam = req.query.cursor;
  const cursorId = cursorParam ? Number(cursorParam) : undefined;

  // Config: How many items to load per request
  const LIMIT = 10;

  try {
    // 3. Fetch Data
    const transactions = await prisma.transaction.findMany({
      where: {
        // Filter: Transactions where the account belongs to this user
        compte: {
          utilisateurId: userId,
        },
      },
      take: LIMIT,
      // Logic: Skip the cursor itself if provided
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,

      // Critical: Stable sorting (Date first, ID as tie-breaker)
      orderBy: [{ date: "desc" }, { id: "desc" }],

      // Include useful UI data
      include: {
        compte: {
          select: { id: true, nom: true, type: true },
        },
        categorie: {
          select: { id: true, nom: true },
        },
      },
    });

    // 4. Calculate Next Cursor
    let nextCursor: number | null = null;
    if (transactions.length === LIMIT) {
      // The ID of the last item becomes the cursor for the next page
      nextCursor = transactions[transactions.length - 1].id;
    }

    const result ={
      data: transactions,
      meta: {
        nextCursor: nextCursor,
        hasMore: nextCursor !== null,
      },
    }

    await cache(cacheInfo,result);
    // 5. Send Response
    return res.status(200).json(result);
  } catch (e) {
    console.error("❌ Error fetching transactions:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  console.log("hello i m in the controller");
  const user = req.user as JwtPayload;
  const userId = Number(user.id);
  // 2. Cast req.body to our interface so TypeScript knows the fields exist
  const { compteId, categorieId, idDestination } = req.body;

  try {
    await transactionServices.checkAccount(
      compteId,
      idDestination,
      categorieId,
      userId,
    );
    const result = await transactionServices.createTransaction(req.body);

    return res.status(201).json(result);
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    console.error("Create Transaction Error:", e);
    return res.status(500).json({ error: "Could not process transaction" });
  }
};

export const removeTransaction = async (req: AuthRequest, res: Response) => {
  const transactionId = Number(req.params.id);
  const user = req.user as JwtPayload;
  const userId = Number(user.id);

  try {
    // 1. Fetch the transaction first to know its Type and Details
    const transactionToDelete =
      await transactionServices.checkExistAndOwnershipTransaction(
        transactionId,
        userId,
      );
    const message = await transactionServices.deleteTransactionService(
      transactionId,
      transactionToDelete,
    );
    return res.status(200).json(message);
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    console.error("Delete Error:", e);
    return res.status(500).json({ error: "Could not delete transaction" });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  const transactionId = Number(req.params.id);
  const user = req.user as JwtPayload;
  const userId = Number(user.id);

  try {
    const existingTransaction =
      await transactionServices.checkExistAndOwnershipTransactionCategory(
        transactionId,
        userId,
        req.body.categorieId,
      );
    const result = await transactionServices.updateTransaction(
      transactionId,
      existingTransaction,
      req.body,
    );
    return res.status(200).json({
      message: "Transaction updated",
      data: result,
    });
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    console.error("Update Error:", e);
    return res.status(500).json({ error: "Could not update transaction" });
  }
};
