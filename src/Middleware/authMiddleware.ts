import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET as string;

interface JwtPayload {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}


export interface AuthRequest extends Request {
    user?:JwtPayload;
}


export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Read from Cookie instead of Header
  const token = req.cookies.jwt; 

  if (!token) {
    return res.status(401).json({ error: 'Access denied, token missing' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('jwt');
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};