import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {prisma} from '../lib/prisma';
import {UtilisateurModel} from '../../generated/prisma/models/Utilisateur'
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

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

export const login = async (req:Request,res:Response)=>{
    const {mail,password}=req.body;

    try{
        const user = await prisma.utilisateur.findUnique({
            where:{email:mail}
        });
        if(!user){
            return res.status(401).json({message:"Invalid credentials"})
        }
        const isPasswordValid = await bcrypt.compare(password, user.motDePasse);
        if(!isPasswordValid){
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const {token,refreshToken}=generateToken(user);
        

        await prisma.utilisateur.update({
            where: { id: user.id },
            data: {refreshToken:refreshToken  }
        });


        setcookies(res,token,refreshToken);

        
        res.status(201).json({ message: 'Login successful' })
    }catch(e){
        res.status(500).json({ error: 'Login failed' });
        console.log("error message: ",e)
    }

}

export const register = async (req: Request, res: Response) => {
  const { mail, password, nom,prenom } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.utilisateur.create({
        data: { 
            email:mail, 
            motDePasse: hashedPassword, 
            nom:nom, 
            prenom:prenom,

            comptes:{
                create: [
                    { nom: "Mon Cash", type: "Cash" },
                    { nom: "Ma Banque", type: "Banque"}
                ]
            },

            categories:{
                create: [
                    { nom: 'Alimentation' },
                    { nom: 'Salaire' },
                    { nom: 'Transport' },
                    { nom: 'Loisirs' },
                    { nom: 'Virement Interne' }, 
                    { nom: 'Solde Initial' } // Added for initial deposits
                ],
            }
        },
    });

    const {token,refreshToken}=generateToken(user);
        

        await prisma.utilisateur.update({
            where: { id: user.id },
            data: {refreshToken:refreshToken  }
        });


        setcookies(res,token,refreshToken);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'User already exists' });
  }
};

export const logout = (req:Request,res:Response)=>{
    res.clearCookie('jwt');
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out successfully' });
}