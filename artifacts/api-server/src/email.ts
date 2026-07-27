/**
 * Email helper — uses Gmail SMTP (nodemailer) when GMAIL_USER + GMAIL_APP_PASSWORD are set,
 * otherwise logs to console so the app works without credentials.
 */
import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.log(
      `[EMAIL - no Gmail credentials set] To: ${opts.to} | Subject: ${opts.subject}`
    );
    return;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `"Rainbow Loom Vibe Store" <${gmailUser}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    console.log(`[EMAIL] Sent to ${opts.to}: ${opts.subject}`);
  } catch (err) {
    console.error(`[EMAIL] Gmail send error:`, err);
  }
}

function orderItemsHtml(
  items: Array<{ productName: string; colors: string[]; pattern: string; price: number }>
) {
  return items
    .map(
      (item) =>
        `<li style="margin-bottom:8px">
          <strong>${item.productName}</strong>
          (${item.pattern.replace(/_/g, " ")}) — 
          Colors: ${item.colors.join(", ")} — 
          $${item.price}
        </li>`
    )
    .join("");
}

export function orderConfirmationEmail(opts: {
  customerName: string;
  orderNumber: string;
  items: Array<{ productName: string; colors: string[]; pattern: string; price: number }>;
  total: number;
}) {
  return {
    subject: `🌈 Order Confirmed — ${opts.orderNumber}`,
    html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #fffdf7; border-radius: 16px; padding: 32px; border: 2px solid #fce7f3;">
  <h1 style="color: #ec4899; font-size: 28px; margin-bottom: 4px;">Yay! Order Placed! 🎉</h1>
  <p style="color: #6b7280; font-size: 16px;">Hi <strong>${opts.customerName}</strong>, thanks for your order!</p>
  <div style="background: #fdf2f8; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
    <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 14px;">Your order number is</p>
    <p style="color: #ec4899; font-size: 36px; font-weight: bold; margin: 0;">${opts.orderNumber}</p>
  </div>
  <h3 style="color: #374151;">Your Items</h3>
  <ul style="color: #4b5563; font-size: 15px; padding-left: 20px;">
    ${orderItemsHtml(opts.items)}
  </ul>
  <p style="font-size: 18px; font-weight: bold; color: #0d9488;">Total: $${opts.total}</p>
  <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">We'll be in touch with updates. Save your order number to track your order!</p>
</div>`,
  };
}

export function orderOnHoldEmail(opts: {
  customerName: string;
  orderNumber: string;
}) {
  return {
    subject: `⏸️ Your order ${opts.orderNumber} is on hold`,
    html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #fffdf7; border-radius: 16px; padding: 32px; border: 2px solid #fce7f3;">
  <h1 style="color: #f59e0b; font-size: 28px;">Your order is on hold ⏸️</h1>
  <p style="color: #6b7280;">Hi <strong>${opts.customerName}</strong>,</p>
  <p style="color: #6b7280;">Your order <strong>${opts.orderNumber}</strong> has been put on hold for a moment. We'll start making it very soon!</p>
  <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">Questions? Just reply to this email.</p>
</div>`,
  };
}

export function orderUnholdEmail(opts: {
  customerName: string;
  orderNumber: string;
}) {
  return {
    subject: `✅ Your order ${opts.orderNumber} is back in progress!`,
    html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #fffdf7; border-radius: 16px; padding: 32px; border: 2px solid #ccfbf1;">
  <h1 style="color: #0d9488; font-size: 28px;">Order back in progress! ✅</h1>
  <p style="color: #6b7280;">Hi <strong>${opts.customerName}</strong>,</p>
  <p style="color: #6b7280;">Good news! Your order <strong>${opts.orderNumber}</strong> is no longer on hold — we're getting back to it right now!</p>
  <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">We'll keep you posted with updates.</p>
</div>`,
  };
}

export function orderCompletedEmail(opts: {
  customerName: string;
  orderNumber: string;
}) {
  return {
    subject: `🎀 Your order ${opts.orderNumber} is ready!`,
    html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #fffdf7; border-radius: 16px; padding: 32px; border: 2px solid #fce7f3;">
  <h1 style="color: #ec4899; font-size: 28px;">Your order is ready! 🎀</h1>
  <p style="color: #6b7280;">Hi <strong>${opts.customerName}</strong>,</p>
  <p style="color: #6b7280;">We finished making your order <strong>${opts.orderNumber}</strong>! It's all done and ready for you. 🌈</p>
  <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">Thank you so much for your order — we hope you love it!</p>
</div>`,
  };
}

export function orderStartedEmail(opts: {
  customerName: string;
  orderNumber: string;
  estimatedLabel: string;
}) {
  return {
    subject: `🎨 We're making your order ${opts.orderNumber}!`,
    html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #fffdf7; border-radius: 16px; padding: 32px; border: 2px solid #ccfbf1;">
  <h1 style="color: #0d9488; font-size: 28px;">We're making it right now! 🎨</h1>
  <p style="color: #6b7280;">Hi <strong>${opts.customerName}</strong>,</p>
  <p style="color: #6b7280;">Great news — we've started working on your order <strong>${opts.orderNumber}</strong>!</p>
  <div style="background: #f0fdfa; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
    <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 14px;">Estimated time</p>
    <p style="color: #0d9488; font-size: 28px; font-weight: bold; margin: 0;">${opts.estimatedLabel}</p>
  </div>
  <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">We'll let you know when it's ready!</p>
</div>`,
  };
}
