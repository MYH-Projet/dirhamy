import {z} from 'zod';

const TypeTransaction = z.enum(['DEPENSE', 'REVENU', 'TRANSFER']);

export const createTransactionSchema = z.object({
  body: z.object({
    // 1. Montant: Use coerce to allow "100.50" (string) -> 100.50 (number)
    montant: z.coerce.number({ error: "Montant must be a number" })
      .positive("Montant must be greater than 0"),

    // 2. Type: Strict Enum
    type: TypeTransaction,

    // 3. Description: Required string
    description: z.string({ error: "Description is required" })
      .trim()
      .min(1, "Description cannot be empty"),

    // 4. Date: Coerce handles strings automatically
    date: z.coerce.date().default(() => new Date()), 

    // 5. IDs: Use coerce to allow "5" (string) -> 5 (number)
    compteId: z.coerce.number({   error: "Compte ID required" }).int(),
    
    categorieId: z.coerce.number({ error: "Category ID required" }).int(),

    // 6. Destination: Optional
    idDestination: z.coerce.number().int().optional().nullable(), 
  })
  .refine((data) => {
    // Logic: Transfer needs destination
    if (data.type === 'TRANSFER') {
      return data.idDestination != null; 
    }
    return true;
  }, {
    message: "Destination account (idDestination) is required for TRANSFER",
    path: ["idDestination"], 
  })
  .refine((data) => {
    // Logic: Cannot transfer to self
    if (data.type === 'TRANSFER' && data.idDestination) {
      return data.compteId !== data.idDestination;
    }
    return true;
  }, {
    message: "Source and destination accounts cannot be the same",
    path: ["idDestination"],
  })
});


export const updateTransactionSchema = z.object({
  // 1. Validate the URL Parameter (e.g. /transactions/:id)
  params: z.object({
    id: z.coerce.number({ error: "Transaction ID must be a number" })
      .int("Transaction ID must be an integer")
      .positive("Transaction ID must be positive")
  }),

  // 2. Validate the Body
  body: z.object({
    montant: z.number({ error: "Montant must be a number" })
      .positive("Montant must be greater than 0"),

    description: z.string()
      .trim()
      .min(1, "Description cannot be empty"),

    // coerce.date handles both "2023-01-01" strings and JS Date objects
    date: z.coerce.date({ 
      error: () => ({ message: 'Invalid date format' }) 
    }),

    categorieId: z.number({ error: "Category ID must be a number" })
      .int()
      .positive()
  }),
});



export const removeTransactionSchema = z.object({
  params: z.object({
    // automatically converts "123" (string) to 123 (number)
    id: z.coerce.number({ error: "Transaction ID must be a number" })
      .int("Transaction ID must be an integer")
      .positive("Transaction ID must be a positive number")
  }),
});



export const getTransactionSchema = z.object({
  query: z.object({
    // Optional cursor: "123" (string) -> 123 (number)
    cursor: z.coerce.number({ error: "Cursor must be a number" })
      .int()
      .positive()
      .optional(),
      
    // Optional limit: Default to 10 if you want to control page size via URL
    limit: z.coerce.number()
      .int()
      .min(1)
      .max(100)
      .optional()
  }),
});