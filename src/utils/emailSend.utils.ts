import nodemailer from 'nodemailer';

// Configure the email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
});


export const sendEmail = async (to: string, subject: string, html: string) => {
    if (!process.env.SMTP_HOST) {
        console.log("SMTP_HOST is not defined")
        return;
    };
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
    });
}
