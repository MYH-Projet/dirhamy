import { globalIpLimiter,emailIpLimiter,emailSendLimiter,apiLimiter } from '../ratelimiter/ratelimiter';
import { Request, Response, NextFunction } from 'express';
export const limitGlobalTraffic = async (req: Request, res: Response, next: NextFunction) => {
    try {console.log("limitGlobalTraffic :", req.ip)
        // Just consume 1 point from the IP address
        await globalIpLimiter.consume(req.ip || 'unknown_ip');
        
        next();
    } catch (error) {
        if (error instanceof Error) {
            // It is a real Javascript Error (e.g., "Socket closed", "ECONNREFUSED")
            console.error("🚨 REDIS IS BROKEN:", error.message);
            
            // CRITICAL: Let the user pass! Don't block them because your DB is down.
            return next(); 
        }
        res.status(429).json({ 
            error: "Too many requests from this IP. Please wait a moment." 
        });
    }
};

// LAYER 2: The "Brute Force Stopper" (IP + Email check)
export const limitLoginAttempts = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get the email safely
    const email = req.body.mail; 
    const ip = req.ip || 'unknown_ip';
console.log("limitLoginAttempts")
    if (!email) {
        // If they didn't send an email, we can't track this specific rule.
        // But the Global Traffic limit (Layer 1) has already run, so we are safe.
        
        
        return next(); 
    }

    // 2. Create a combined key: "192.168.1.1_mohamed@gmail.com"
    const key = `${ip}_${email}`;

    try {
        await emailIpLimiter.consume(key);
        console.log("limitLoginAttempts")

        next();
    } catch (error) {
        // Customize the error to be vague for security
        res.status(429).json({ 
            error: "Too many failed login attempts. This account is temporarily locked for this IP." 
        });
    }
};

export const limitEmailSending = async (req: Request, res: Response, next: NextFunction) => {
    // Layer 1: Limit by IP (Stop one person from spamming many emails)
    try {console.log("limitEmailSending")
        await emailSendLimiter.consume(req.ip || 'unknown_ip');
        
        next();
    } catch (error) {
        return res.status(429).json({ 
            error: "Too many email requests. Please try again in an hour." 
        });
    }
};

export const limitApiTraffic = async (req: Request, res: Response, next: NextFunction) => {
    // If the user is logged in (req.user.id), we could technically limit by UserID 
    // instead of IP for better accuracy, but IP is safer/easier for now.
    const key = req.ip || 'unknown_ip';
console.log("limitApiTraffic")
    try {
        await apiLimiter.consume(key);
        
        next();
    } catch (error) {
        res.status(429).json({ 
            error: "Too many requests. You are navigating too fast!" 
        });
    }
};