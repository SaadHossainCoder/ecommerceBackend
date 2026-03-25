/**
 * Email Templates Utility
 * Generates beautiful, responsive HTML email templates.
 */

const APP_NAME = "Ecommerce Store";

const COLORS = {
  primary: "#4F46E5",
  primaryGradient: "linear-gradient(135deg,#4F46E5,#6366F1)",
  background: "#F3F4F6",
  white: "#ffffff",
  textDark: "#111111",
  textMedium: "#444444",
  textLight: "#6B7280",
  textMuted: "#777777",
  footerBg: "#F9FAFB",
  successBg: "#ECFDF5",
  successText: "#059669",
  infoBg: "#EEF2FF",
  warningBg: "#FEF3C7",
  warningText: "#D97706",
};

export const getVerificationEmail = (name: string, link: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:${COLORS.background}; padding:40px; margin:0;">
<div style="max-width:600px;margin:auto;background:${COLORS.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <div style="background:${COLORS.primary};padding:30px;text-align:center;">
    <h1 style="color:${COLORS.white};margin:0;">${APP_NAME}</h1>
  </div>
  <div style="padding:40px;">
    <h2 style="color:${COLORS.textDark};">Welcome to our platform, ${name}!</h2>
    <p style="color:${COLORS.textMedium};font-size:16px;">Please verify your email by clicking the button below:</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${link}" style="
        background:${COLORS.primary};
        color:${COLORS.white} !important;
        padding:12px 24px;
        border-radius:8px;
        text-decoration:none;
        font-weight:bold;
        display:inline-block;">
        Verify Email
      </a>
    </div>
    <p style="font-size:12px;color:#555;margin-top:20px;">
      If the button doesn’t work, copy and paste this link into your browser:
    </p>
    <p style="font-size:12px;color:${COLORS.primary};word-break:break-all;">
      ${link}
    </p>
  </div>
  <div style="padding:20px;text-align:center;font-size:14px;color:${COLORS.textMuted};background:${COLORS.footerBg};">
    <p style="margin:5px;">&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
  </div>
</div>
</body>
</html>
`;

export const getForgotPasswordEmail = (name: string, link: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:${COLORS.background}; padding:40px; margin:0;">
<div style="max-width:600px;margin:auto;background:${COLORS.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <div style="background:${COLORS.primary};padding:30px;text-align:center;">
    <h1 style="color:${COLORS.white};margin:0;">${APP_NAME}</h1>
  </div>
  <div style="padding:40px;">
    <h2 style="color:${COLORS.textDark};">Reset your password</h2>
    <p style="color:${COLORS.textMedium};font-size:16px;">Hi ${name},</p>
    <p style="color:${COLORS.textMedium};font-size:16px;">We received a request to reset your password. Click the button below to proceed:</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${link}" style="
        background:${COLORS.primary};
        color:${COLORS.white} !important;
        padding:12px 24px;
        border-radius:8px;
        text-decoration:none;
        font-weight:bold;
        display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color:${COLORS.textMedium};font-size:14px;">This link will expire in 1 hour.</p>
    <p style="font-size:12px;color:${COLORS.textMuted};margin-top:20px;">If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
  <div style="padding:20px;text-align:center;font-size:14px;color:${COLORS.textMuted};background:${COLORS.footerBg};">
    <p style="margin:5px;">&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
  </div>
</div>
</body>
</html>
`;

export const getOtpEmail = (name: string, code: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>OTP Email</title>
</head>
<body style="font-family: Arial, sans-serif; background:${COLORS.background}; padding:40px; margin:0;">
<div style="max-width:600px;margin:auto;background:${COLORS.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <!-- Header -->
  <div style="background:${COLORS.primary};padding:30px;text-align:center;">
    <h1 style="color:${COLORS.white};margin:0;">${APP_NAME}</h1>
  </div>
  <!-- Content -->
  <div style="padding:40px;">
    <h2 style="color:${COLORS.textDark};">Your Security Code</h2>
    <p style="color:${COLORS.textMedium};font-size:16px;">Hi ${name},</p>
    <p style="color:${COLORS.textMedium};font-size:16px;">Use the following code to verify your account:</p>
    <div style="text-align:center;margin:30px 0;">
      <span style="font-size:32px;font-weight:bold;color:${COLORS.primary};letter-spacing:8px;">
        ${code}
      </span>
    </div>
    <p style="color:${COLORS.textMedium};font-size:14px;">This code will expire in 10 minutes.</p>
  </div>
  <!-- Footer -->
  <div style="padding:20px;text-align:center;font-size:14px;color:${COLORS.textMuted};background:${COLORS.footerBg};">
    <p style="margin:5px;">&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
    <p style="margin:5px;">If you didn’t request this, you can safely ignore it.</p>
  </div>
</div>
</body>
</html>
`;

export const getOrderConfirmationEmail = (name: string, order: any) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background};font-family:Segoe UI,Arial,sans-serif;">
<div style="max-width:650px;margin:40px auto;background:${COLORS.white};border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
  <!-- HEADER -->
  <div style="background:${COLORS.primaryGradient};padding:30px;text-align:center;">
    <h1 style="color:${COLORS.white};margin:0;font-size:24px;">🛍 ${APP_NAME}</h1>
  </div>

  <!-- SUCCESS BADGE -->
  <div style="text-align:center;margin-top:-20px;">
    <div style="display:inline-block;background:${COLORS.successBg};color:${COLORS.successText};padding:10px 20px;border-radius:999px;font-weight:bold;font-size:14px;">
      ✔ Order Confirmed
    </div>
  </div>

  <!-- CONTENT -->
  <div style="padding:40px;">
    <h2 style="margin-top:10px;color:${COLORS.textDark};">Thank you for your purchase! 🎉</h2>
    <p style="color:${COLORS.textLight};">Order #${order.orderNumber} • Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

    <p>Hi <strong>${name}</strong>, your order has been successfully placed and is being processed.</p>

    <!-- ORDER SUMMARY -->
    <h3 style="margin-top:30px;">🧾 Order Summary</h3>

    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <thead>
        <tr style="background:${COLORS.footerBg};">
          <th style="padding:12px;text-align:left;">Product</th>
          <th style="padding:12px;text-align:center;">Qty</th>
          <th style="padding:12px;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.orderItems.map((item: any) => `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:16px;">
              <div style="font-weight:600;">${item.product.title}</div>
              ${item.selectedSize ? `<div style="font-size:12px;color:#888;">Size: ${item.selectedSize}</div>` : ''}
            </td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">₹${item.price}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- TOTAL -->
    <div style="margin-top:20px;text-align:right;">
      <p style="color:${COLORS.textLight};">Subtotal: ₹${order.totalAmount}</p>
      <p style="font-size:20px;font-weight:bold;color:${COLORS.primary};">Total: ₹${order.totalAmount}</p>
    </div>

    <!-- 💳 PAYMENT METHOD -->
    <div style="margin-top:25px;padding:20px;background:${COLORS.infoBg};border-radius:10px;">
      <h4 style="margin:0 0 12px;color:${COLORS.primary};">💳 Payment Method</h4>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="margin:0;font-weight:600;color:${COLORS.textDark};">
            ${order.paymentMethod || 'Online Payment'}
          </p>
          ${order.paymentId ? `
          <p style="margin:4px 0 0;font-size:13px;color:${COLORS.textLight};">
            Transaction ID: ${order.paymentId}
          </p>` : ''}
        </div>
        <div style="
          background:${order.paymentStatus === 'PAID' ? COLORS.successBg : COLORS.warningBg};
          color:${order.paymentStatus === 'PAID' ? COLORS.successText : COLORS.warningText};
          padding:6px 12px;
          border-radius:9999px;
          font-size:12px;
          font-weight:600;
        ">
          ${order.paymentStatus === 'PAID' ? 'Paid ✅' : 'Pending ⏳'}
        </div>
      </div>
    </div>

    <!-- SHIPPING -->
    <div style="margin-top:30px;padding:20px;background:${COLORS.footerBg};border-radius:10px;">
      <h4 style="margin:0 0 10px;">📍 Shipping Address</h4>
      <p style="margin:0;font-size:14px;color:#444;">
        ${order.shippingAddress[0].name}<br>
        ${order.shippingAddress[0].address}, ${order.shippingAddress[0].city}<br>
        ${order.shippingAddress[0].state}, ${order.shippingAddress[0].country} - ${order.shippingAddress[0].postalCode}
      </p>
    </div>

    <!-- BUTTON -->
    <div style="text-align:center;margin-top:35px;">
      <a href="${process.env.FRONTEND_URL}/orders/${order.id}" style="
        background:${COLORS.primaryGradient};
        color:${COLORS.white};
        padding:14px 28px;
        border-radius:10px;
        text-decoration:none;
        font-weight:600;
        display:inline-block;
        box-shadow:0 4px 12px rgba(79,70,229,0.3);
      ">
        🚚 Track Your Order
      </a>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:${COLORS.footerBg};padding:20px;text-align:center;font-size:13px;color:${COLORS.textLight};">
    <p style="margin:5px;">Need help? Contact support anytime.</p>
    <p style="margin:5px;">&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
  </div>
</div>
</body>
</html>
`;
