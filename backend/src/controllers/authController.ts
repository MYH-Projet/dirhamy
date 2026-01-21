import { Request, Response } from 'express';
import * as authService from "../services/authService";
import { AppError } from '../utils/AppError';

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
        const user = await authService.checkUserCredentials(mail,password);
        const {token,refreshToken}=await authService.jwtWork(user);

        setcookies(res,token,refreshToken);

        
        res.status(201).json({ message: 'Login successful' })
    }catch(e){
        if(e instanceof AppError){
            return res.status(e.statusCode).json({error:e.message})
        }
        res.status(500).json({ error: 'Login failed' });
        console.log("error message: ",e)
    }

}

export const register = async (req: Request, res: Response) => {
  const { mail, password, nom,prenom } = req.body;
  try {
    const user = await authService.createUser(mail,password,nom,prenom);
    const {token,refreshToken}=await authService.jwtWork(user);
    setcookies(res,token,refreshToken);

    res.status(201).json({ message: 'User created successfully' });
  } catch (e) {
    if(e instanceof AppError){
            return res.status(e.statusCode).json({error:e.message})
        }
        res.status(500).json({ error: 'Login failed' });
        console.log("error message: ",e)
  }
};

export const logout = (req:Request,res:Response)=>{
    res.clearCookie('jwt');
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out successfully' });
}