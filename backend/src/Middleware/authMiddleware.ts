import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {prisma} from '../lib/prisma';
import {UtilisateurModel} from '../../generated/prisma/models/Utilisateur'
import dotenv from 'dotenv';
import { error } from 'console';
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;


export interface JwtPayload {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}


export interface AuthRequest extends Request {
    user?:JwtPayload;
}


const generateToken=(user:UtilisateurModel)=>{
    const token = jwt.sign({
            id:user.id,
            nom:user.nom,
            prenom:user.prenom,
            email:user.email,
        },SECRET_KEY,{expiresIn:'15m'})
    
    const refreshToken = jwt.sign({
            id:user.id
        },REFRESH_TOKEN_SECRET,{expiresIn:'7d'})

    return { token, refreshToken };
}

const setcookies=(res:Response,token:any,refreshToken:any)=>{
    res.cookie("jwt",token,{
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
            maxAge: 15 * 60 * 1000,
        }
    )

    res.cookie("refreshToken",refreshToken,{
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
}


export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Read from Cookie instead of Header
  const token = req.cookies.jwt; 

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    console.log("token work")
    req.user = decoded;
    return next();
  } catch (err) {
    console.log("token is not valid")
  }

  const refreshToken= req.cookies.refreshToken
  console.log("the token is refreshing")
    if(!refreshToken){
        return res.status(401).json({ message: 'No refresh token provided' });
    }
    try{
        const decoded = jwt.verify(refreshToken,REFRESH_TOKEN_SECRET) as { id: number };
        const user = await prisma.utilisateur.findUnique({ where: { id: decoded.id } });
        if (!user || user.refreshToken !== refreshToken) {
            throw 'Invalid refresh token';
        }

        const newTokens=generateToken(user);

        await prisma.utilisateur.update({
            where:{id:user.id},
            data:{
                refreshToken:newTokens.refreshToken
            }
        })

        setcookies(res, newTokens.token, newTokens.refreshToken);
        req.user = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email
        };
        return next();

    }catch(e){
        res.clearCookie('jwt');
        res.clearCookie('refreshToken');
        const message = e||'Session expired';
        return res.status(403).json({ error: message });
    }
};

export interface resetPasswordRequest extends Request{
    mail?:string
}

type resetPasswordpayload = {
    mail:string
}

export const authenticateResetpasswordToken = async (req: resetPasswordRequest, res: Response, next: NextFunction)=>{
    try{
        const token = req.cookies.restpassword;
        console.log('im in the middleware i get the token')
        if (!token) {
            throw new Error("Token not found");
        }
        
        const decoded = jwt.verify(token,SECRET_KEY) as resetPasswordpayload;
        if (!decoded.mail) {
            throw new Error("Invalid token structure");
        }
        req.mail= decoded.mail;
        console.log('i will call next()')
        next();
    }catch(e){
        res.clearCookie('restpassword');
        const message = e||'Session expired';
        return res.status(403).json({ error: message });
    }
    
}