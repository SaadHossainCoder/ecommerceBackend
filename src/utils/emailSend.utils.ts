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
    try {
        // Check if SMTP is properly configured
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com') {
            console.warn("⚠️  SMTP not configured. Email not sent to:", to);
            return;
        };
        
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            html,
        });
        
        console.log("✓ Email sent to:", to);
    } catch (error: any) {
        console.error("❌ Email send error:", error.message);
        // Don't throw - email is not critical for signup
    }
}
