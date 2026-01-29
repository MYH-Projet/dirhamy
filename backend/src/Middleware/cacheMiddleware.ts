import {Response, NextFunction } from "express";
import redisClient from "../lib/redis";
import { AuthRequest } from "./authMiddleware"; 
import { keyGenerator } from "../utils/cache";
export const cacheMiddl = async (req:AuthRequest,res:Response,next:NextFunction)=>{
    const requestMethod = req.method;
    console.log('in middlware: ',req.path, req.params)
    const key:string = keyGenerator(req);
    console.log('key in middleware: ',key)
    if( requestMethod == "Get"){
        const value:string|null = await redisClient.get(key);

        if(value){
            return res.status(200).json(JSON.parse(value));
        }

        return next();
    }else {
        await redisClient.del(key);
        return next();
    }
}
