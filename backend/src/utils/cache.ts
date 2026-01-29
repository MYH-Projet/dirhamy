import redisClient from "../lib/redis";
import { AuthRequest } from "../Middleware/authMiddleware";
import { AppError } from "./AppError";



export const cache = async (key:string, value:object)=>{
    await redisClient.set(key, JSON.stringify(value), 'EX', 30*60);
}



export const keyGenerator =(req: AuthRequest):string =>{
    const userID = req.user?.id;
    const path = req.originalUrl;
    const pattern:RegExp = /^\/([^\/]+)/;
    const result:RegExpMatchArray|null = path.match(pattern);
    if (!result || !result[1]) {
        throw new AppError("Invalid path for caching",500);
    }
    
    const resourceName = result[1];
    let key = `${resourceName}:user:${userID}`;
    const query = req.query
    if (req.query && Object.keys(req.query).length > 0) {
        const sortedKeys = Object.keys(req.query).sort();
            sortedKeys.forEach((k) => {
            const val = req.query[k];
            key += `:${k}:${val}`;
        });
    }
    console.log('key',key)
    return key;
}