import nodemailer from 'nodemailer';

const isSMTPConfigured = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_HOST !== 'smtp.example.com'
  );
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  service: "gmail",
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // ✅ auto-detect
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 🔍 Verify transporter once (startup check)
export const verifyEmailConfig = async () => {
  if (!isSMTPConfigured()) {
    console.warn("⚠️ SMTP not configured properly");
    return;
  }

  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready");
  } catch (error: any) {
    console.error("❌ SMTP verification failed:", error.message);
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    if (!isSMTPConfigured()) {
      console.warn("⚠️ Email skipped (SMTP not configured):", to);
      return;
    }

    const info = await transporter.sendMail({
      from: `"Ecommerce App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to} | ID: ${info.messageId}`);
  } catch (error: any) {
    console.error("❌ Email send failed:", {
      to,
      error: error.message,
    });
  }
};
