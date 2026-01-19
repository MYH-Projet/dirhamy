import {z} from 'zod';

export const loginSchema = z.object({
    body:z.object({
        mail: z.string()
            .email({ message: "Invalid email address format" }) 
            .min(1, { message: "Email is required" }),          
      
    password: z.string()
      .min(6, { message: "Password must be at least 6 characters" }) // Example length
      .max(100) // Good practice to prevent huge payloads
    })
})

export const registerSchema = z.object({
    body:z.object({
        mail:z.string()
            .email({ message: "Invalid email address format" }) 
            .min(1, { message: "Email is required" }),
        
        password:z.string()
            .min(6, { message: "Password must be at least 6 characters" }) // Example length
            .max(100), 
        nom: z.string({ message: "Nom is required" })
            .min(1, { message: "Nom cannot be empty" })
            .trim(),
        prenom: z.string({ message: "Prenom is required" })
            .min(1, { message: "Prenom cannot be empty" })
            .trim()
    })
})