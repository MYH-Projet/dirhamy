import {Response, NextFunction } from "express";
import redisClient from "../lib/redis";
import { AuthRequest } from "./authMiddleware"; 
import { keyGenerator } from "../utils/cache";
export const cacheWithDependencies = (dependencies:string[])=>
    async (req:AuthRequest,res:Response,next:NextFunction)=>{
    const requestMethod = req.method;
    console.log('in middlware: ',req.path, req.params)
    const {key,tags} = keyGenerator(req);
    console.log('key in middleware: ',key,tags)
    if( requestMethod == "GET"){
        const value:string|null = await redisClient.get(key);

        if(value){
            return res.status(200).json(JSON.parse(value));
        }

        return next();
    }
        const resourceTag = `tag:${tags[0]}`; // e.g., tag:transactions
        const userTag = `tag:${tags[1]}`;     // e.g., tag:user_2

        // Start with keys strictly related to this specific resource & user
        // (Intersection: Must be in 'transactions' AND 'user_2')
        let keysToInvalidate: string[] = await redisClient.sinter(resourceTag, userTag);

        // 3. Process Dependencies
        // We must check each dependency separately against the user
        for (const dep of dependencies) {
            // WARNING: Ensure this matches your keyGenerator logic. 
            // If keyGenerator uses singular "balance", do not add "s" here.
            const depTag = `tag:${dep}`; 
            
            const depKeys = await redisClient.sinter(depTag, userTag);
            
            if (depKeys.length > 0) {
                // Add found keys to our main list
                keysToInvalidate.push(...depKeys);
            }
        }

        console.log('Final keys to remove:', keysToInvalidate);

        // 4. Delete the cached values (The JSON data)
        if (keysToInvalidate.length > 0) {
            // Remove duplicates just in case
            const uniqueKeys = [...new Set(keysToInvalidate)];
            await redisClient.del(uniqueKeys);
        }

        // NOTE: We do NOT delete 'resourceTag' or 'userTag'. 
        // We only delete the keys *inside* them. 
        // Keeping the 'tag:user_2' set is fine/necessary for future tracking.

        return next();
}
