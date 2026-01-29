import redisClient from "../lib/redis";
import { AuthRequest } from "../Middleware/authMiddleware";
import { AppError } from "./AppError";



export const cache = async (cache:redisGenerator, value:object)=>{
    const {key,tags}=cache;
    await redisClient.set(key, JSON.stringify(value), 'EX', 30*60);
    for (const tag of tags) {
        await redisClient.sadd(`tag:${tag}`, key);
    }
}

type redisGenerator = {key:string,tags:string[]}

export const keyGenerator =(req: AuthRequest):redisGenerator =>{
    const userID = req.user?.id;
    const path = req.originalUrl;
    const pattern: RegExp = /^\/([^\/?]+)/;
    const result:RegExpMatchArray|null = path.match(pattern);
    if (!result || !result[1]) {
        throw new AppError("Invalid path for caching",500);
    }
    
    const resourceName = result[1];
    let key = `${resourceName}:user:${userID}`;
    let tags = [`${resourceName}`,`user_${userID}`]
    if (req.query && Object.keys(req.query).length > 0) {
        const sortedKeys = Object.keys(req.query).sort();
            sortedKeys.forEach((k) => {
            const val = req.query[k];
            key += `:${k}:${val}`;
        });
    }
    console.log('key',key)
    return {key,tags};
}