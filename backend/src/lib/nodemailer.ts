import nodemailer from 'nodemailer';
import { AppError } from '../utils/AppError';
import dotenv from 'dotenv';
dotenv.config();
    
const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.GMAIL,
        pass:process.env.GMAIL_PASS
    }
})


export default transporter;


export type mailOption={
    from: string,
    to: string,
    subject: string,
    text: string,
    html: string
}



export const sendMail=async (to:string,code:string)=>{
    const mailoption = {
        from: '"Support Team" <dihamy@email.com>', // "Name" <email> format looks better
        to,
        subject: 'Your Password Verification Code',
        text: `Your verification code is: ${code}. This code will expire in 5 minutes.`, // Plain text fallback
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4A90E2;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Please use the following code to complete the process:</p>
            <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 5px; margin: 20px 0;">
                ${code}
            </div>
            <p>This code is valid for <strong>5 minutes</strong>.</p>
            <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
            </div>
        `
    }
    try {
        const info = await transporter.sendMail(mailoption);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error("Nodemailer error:", error);
        throw new AppError(`Problem sending email to ${to}`, 500);
    }
}