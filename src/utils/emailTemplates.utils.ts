/**
 * Email Templates
 * Production-grade responsive HTML email templates.
 */

const APP_NAME = "Ecommerce Store";
const FRONTEND = process.env.FRONTEND_URL ?? "https://yourstore.com";
const YEAR     = new Date().getFullYear();

const C = {
    brand:       "#111111",
    accent:      "#C9A96E",
    accentLight: "#FAF6EF",
    bg:          "#F2F2F2",
    white:       "#FFFFFF",
    textDark:    "#111111",
    textMid:     "#444444",
    textLight:   "#888888",
    border:      "#E5E5E5",
    successBg:   "#F0FDF4",
    successText: "#16A34A",
    warningBg:   "#FFFBEB",
    warningText: "#D97706",
    footerBg:    "#F7F7F7",
} as const;

interface OrderItem {
    product:       { title: string };
    quantity:      number;
    price:         number;
    selectedSize?: string;
}
interface ShippingAddress {
    name: string; address: string; city: string;
    state: string; country: string; postalCode: string;
}
interface Order {
    id: string; orderNumber: string; createdAt: string | Date;
    totalAmount: number; paymentMethod?: string; paymentId?: string;
    paymentStatus: "PAID" | "PENDING" | string;
    orderItems: OrderItem[]; shippingAddress: ShippingAddress[];
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const shell = (preheader: string, body: string) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
<tr><td align="center" style="padding:48px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:${C.brand};padding:32px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:13px;font-weight:700;color:${C.white};letter-spacing:0.18em;text-transform:uppercase;">${APP_NAME}</span>
          </td>
          <td align="right">
            <span style="display:inline-block;width:28px;height:1px;background:${C.accent};vertical-align:middle;"></span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- GOLD LINE -->
  <tr><td style="height:3px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- BODY -->
  <tr>
    <td style="background:${C.white};padding:48px;">
      ${body}
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:${C.footerBg};border-top:1px solid ${C.border};padding:28px 48px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:${C.textLight};">
        Questions? <a href="${FRONTEND}/support" style="color:${C.accent};text-decoration:none;font-weight:600;">Contact Support</a>
      </p>
      <p style="margin:0;font-size:11px;color:${C.textLight};">&copy; ${YEAR} ${APP_NAME}. All rights reserved.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

// ─── Reusable pieces ──────────────────────────────────────────────────────────

const heading = (text: string) =>
    `<h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${C.textDark};letter-spacing:-0.02em;line-height:1.2;">${text}</h1>`;

const subheading = (text: string) =>
    `<h2 style="margin:32px 0 12px;font-size:13px;font-weight:700;color:${C.textDark};letter-spacing:0.12em;text-transform:uppercase;border-bottom:1px solid ${C.border};padding-bottom:10px;">${text}</h2>`;

const bodyText = (text: string) =>
    `<p style="margin:0 0 16px;font-size:15px;color:${C.textMid};line-height:1.7;">${text}</p>`;

const greeting = (name: string) =>
    `<p style="margin:0 0 20px;font-size:15px;color:${C.textMid};line-height:1.7;">Hi <strong style="color:${C.textDark};">${name}</strong>,</p>`;

const btn = (href: string, label: string) => `
<table cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
  <tr>
    <td style="background:${C.brand};">
      <a href="${href}" style="display:inline-block;padding:15px 36px;font-size:12px;font-weight:700;color:${C.white};text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">${label}</a>
    </td>
    <td style="width:4px;background:${C.accent};"></td>
  </tr>
</table>`;

const accentBtn = (href: string, label: string) => `
<table cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
  <tr>
    <td style="background:${C.accent};">
      <a href="${href}" style="display:inline-block;padding:15px 36px;font-size:12px;font-weight:700;color:${C.white};text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">${label}</a>
    </td>
  </tr>
</table>`;

const otpBox = (code: string) => `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0;">
  <tr>
    <td style="background:${C.accentLight};border:1px solid #E8D9C0;border-left:4px solid ${C.accent};padding:28px;text-align:center;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.textLight};">Your Verification Code</p>
      <span style="font-size:40px;font-weight:700;color:${C.brand};letter-spacing:14px;font-family:'Courier New',monospace;">${code}</span>
      <p style="margin:12px 0 0;font-size:12px;color:${C.textLight};">Expires in <strong>10 minutes</strong></p>
    </td>
  </tr>
</table>`;

const infoBox = (content: string) => `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
  <tr>
    <td style="background:${C.accentLight};border:1px solid #E8D9C0;padding:20px 24px;">
      ${content}
    </td>
  </tr>
</table>`;

const successBadge = (label: string) => `
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
  <tr>
    <td style="background:${C.successBg};border:1px solid #BBF7D0;padding:8px 18px;">
      <span style="font-size:12px;font-weight:700;color:${C.successText};letter-spacing:0.08em;text-transform:uppercase;">&#10003; ${label}</span>
    </td>
  </tr>
</table>`;

const statusPill = (status: string) => {
    const paid = status === "PAID";
    return `<span style="display:inline-block;padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:${paid ? C.successBg : C.warningBg};color:${paid ? C.successText : C.warningText};border:1px solid ${paid ? "#BBF7D0" : "#FDE68A"};">${paid ? "Paid" : "Pending"}</span>`;
};

const fallback = (link: string) => `
<p style="margin:20px 0 0;font-size:11px;color:${C.textLight};line-height:1.6;">
  Button not working? Copy and paste this link:<br/>
  <a href="${link}" style="color:${C.accent};word-break:break-all;text-decoration:none;">${link}</a>
</p>`;

const securityNote = (msg: string) =>
    `<p style="margin:20px 0 0;font-size:12px;color:${C.textLight};line-height:1.7;border-top:1px solid ${C.border};padding-top:20px;">${msg}</p>`;

const divider = () =>
    `<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="border-top:1px solid ${C.border};padding:0;margin:28px 0;font-size:0;">&nbsp;</td></tr></table>`;

// ─── Templates ────────────────────────────────────────────────────────────────

export const getVerificationEmail = (name: string, link: string) =>
    shell("Verify your email address", `
        ${greeting(name)}
        ${heading("Verify your email address")}
        ${bodyText("Thanks for signing up. Please confirm your email address to activate your account and start shopping.")}
        ${btn(link, "Verify Email Address")}
        ${fallback(link)}
        ${securityNote("If you didn't create an account with ${APP_NAME}, you can safely ignore this email.")}
    `);

export const getForgotPasswordEmail = (name: string, link: string) =>
    shell("Reset your password", `
        ${greeting(name)}
        ${heading("Reset your password")}
        ${bodyText("We received a request to reset the password for your account. Click the button below to choose a new password.")}
        ${infoBox(`<p style="margin:0;font-size:13px;color:${C.textMid};">&#128274;&nbsp; This link will expire in <strong>1 hour</strong>. After that, you'll need to request a new one.</p>`)}
        ${btn(link, "Reset Password")}
        ${fallback(link)}
        ${securityNote("If you didn't request a password reset, no action is needed. Your password will remain unchanged.")}
    `);

export const getForgotPasswordOtpEmail = (name: string, code: string, link: string) =>
    shell("Your password reset code", `
        ${greeting(name)}
        ${heading("Your password reset code")}
        ${bodyText("We received a request to reset your password. Use the code below, or click the button to reset directly.")}
        ${otpBox(code)}
        ${bodyText("Alternatively, click the button below to be taken directly to the reset page:")}
        ${btn(link, "Reset Password")}
        ${fallback(link)}
        ${securityNote("If you didn't request a password reset, please ignore this email. Your account remains secure.")}
    `);

export const getOtpEmail = (name: string, code: string) =>
    shell("Your security code", `
        ${greeting(name)}
        ${heading("Your security code")}
        ${bodyText("Use the code below to complete your verification. Do not share this code with anyone.")}
        ${otpBox(code)}
        ${securityNote("If you didn't request this code, someone may be trying to access your account. Please change your password immediately.")}
    `);

export const getOrderConfirmationEmail = (name: string, order: Order) => {
    const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
    });

    const addr = order.shippingAddress[0];

    const itemRows = order.orderItems.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? C.white : C.footerBg};">
            <td style="padding:14px 16px;font-size:14px;color:${C.textDark};border-bottom:1px solid ${C.border};">
                <strong>${item.product.title}</strong>
                ${item.selectedSize ? `<br/><span style="font-size:12px;color:${C.textLight};">Size: ${item.selectedSize}</span>` : ""}
            </td>
            <td style="padding:14px 16px;font-size:14px;color:${C.textMid};text-align:center;border-bottom:1px solid ${C.border};">${item.quantity}</td>
            <td style="padding:14px 16px;font-size:14px;color:${C.textDark};text-align:right;border-bottom:1px solid ${C.border};font-weight:600;">&#8377;${item.price.toLocaleString("en-IN")}</td>
        </tr>
    `).join("");

    return shell("Order Confirmed", `
        ${successBadge("Order Confirmed")}
        ${greeting(name)}
        ${heading("Thank you for your order")}
        ${bodyText(`Your order has been received and is being processed. We'll send you an update when it ships.`)}

        ${infoBox(`
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.textLight};">Order Number</td>
                    <td style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.textLight};text-align:right;">Date</td>
                </tr>
                <tr>
                    <td style="font-size:16px;font-weight:700;color:${C.brand};padding-top:4px;">#${order.orderNumber}</td>
                    <td style="font-size:14px;color:${C.textMid};text-align:right;padding-top:4px;">${date}</td>
                </tr>
            </table>
        `)}

        ${subheading("Order Summary")}
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};border-collapse:collapse;">
            <thead>
                <tr style="background:${C.brand};">
                    <th style="padding:12px 16px;font-size:11px;font-weight:700;color:${C.white};letter-spacing:0.12em;text-transform:uppercase;text-align:left;">Item</th>
                    <th style="padding:12px 16px;font-size:11px;font-weight:700;color:${C.white};letter-spacing:0.12em;text-transform:uppercase;text-align:center;">Qty</th>
                    <th style="padding:12px 16px;font-size:11px;font-weight:700;color:${C.white};letter-spacing:0.12em;text-transform:uppercase;text-align:right;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
            <tfoot>
                <tr style="background:${C.footerBg};">
                    <td colspan="2" style="padding:16px;font-size:13px;font-weight:700;color:${C.textDark};letter-spacing:0.06em;text-transform:uppercase;">Order Total</td>
                    <td style="padding:16px;font-size:18px;font-weight:700;color:${C.brand};text-align:right;">&#8377;${order.totalAmount.toLocaleString("en-IN")}</td>
                </tr>
            </tfoot>
        </table>

        ${subheading("Payment")}
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};">
            <tr>
                <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td>
                                <p style="margin:0;font-size:14px;font-weight:600;color:${C.textDark};">${order.paymentMethod ?? "Online Payment"}</p>
                                ${order.paymentId ? `<p style="margin:4px 0 0;font-size:12px;color:${C.textLight};">Transaction: ${order.paymentId}</p>` : ""}
                            </td>
                            <td align="right">${statusPill(order.paymentStatus)}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        ${subheading("Shipping Address")}
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${C.border};">
            <tr>
                <td style="padding:20px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:${C.textDark};">${addr.name}</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${C.textMid};line-height:1.7;">
                        ${addr.address}<br/>
                        ${addr.city}, ${addr.state} &mdash; ${addr.postalCode}<br/>
                        ${addr.country}
                    </p>
                </td>
            </tr>
        </table>

        ${accentBtn(`${FRONTEND}/orders/${order.id}`, "Track Your Order")}

        ${securityNote("This is an automated confirmation. Please do not reply to this email. For help, visit our support centre.")}
    `);
};