import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UtilisateurModel } from '../../generated/prisma/models/Utilisateur';
import { AppError } from '../utils/AppError';
import dotenv from 'dotenv';
import crypto from 'crypto';
import redisClient from '../lib/redis';
import { sendMail } from '../lib/nodemailer';
import { userInfo } from 'os';
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

const generateToken = (user: UtilisateurModel) => {
    const token = jwt.sign({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
    }, SECRET_KEY, { expiresIn: '15m' })

    const refreshToken = jwt.sign({
        id: user.id
    }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' })

    return { token, refreshToken };
}

export const generateForgetPToken = (email: string) => {
    return jwt.sign({
        email
    }, SECRET_KEY, { expiresIn: '15m' })
}

export const checkUserCredentials = async (mail: string) => {
    const user = await prisma.utilisateur.findUnique({
        where: { email: mail }
    });
    if (!user) {
        throw new AppError("Invalid credentials", 401)
    }
    return user;
}
export const checkPassword = async (user: UtilisateurModel, password: string) => {
    const isPasswordValid = await bcrypt.compare(password, user.motDePasse);
    console.log(`AuthService: Check Password - Input: ${password}, Hash: ${user.motDePasse}, Valid: ${isPasswordValid}`);
    if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401);
    }
}


export const jwtWork = async (user: UtilisateurModel) => {
    const { token, refreshToken } = generateToken(user);
    await prisma.utilisateur.update({
        where: { id: user.id },
        data: { refreshToken: refreshToken }
    });
    return { token, refreshToken };
}


export const createUser = async (mail: string, password: string, nom: string, prenom: string) => {
    const existingUser = await prisma.utilisateur.findUnique({
        where: { email: mail }
    });

    if (existingUser) {
        throw new AppError("User with this email already exists", 409); // 409 Conflict
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.utilisateur.create({
        data: {
            email: mail,
            motDePasse: hashedPassword,
            nom: nom,
            prenom: prenom,

            comptes: {
                create: [
                    { nom: "Mon Cash", type: "Cash" },
                    { nom: "Ma Banque", type: "Banque" }
                ]
            },

            categories: {
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
    return user;
}

export const forgetpasswordMail = async (mail: string) => {
    const code: string = crypto.randomInt(100000, 1000000).toString();
    const key = `reset:${mail}`;
    const hash = crypto.createHash('sha512').update(key).digest('hex');
    await redisClient.set(hash, code,'EX',15*60);
    await sendMail(mail, code);
}

export const validateCode = async (mail: string, code: string) => {
    const key = `reset:${mail}`;
    const hash = crypto.createHash('sha512').update(key).digest('hex');
    const storedCode = await redisClient.get(hash);
    if (!storedCode || storedCode !== code) {
        throw new AppError('the code not valid', 401);
    }
    await redisClient.del(hash);
}


export const resetPassword = async (mail: string, password: string) => {

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.utilisateur.update({
        where: {
            email: mail,
        },
        data: {
            motDePasse: hashedPassword
        }
    })
}