const nodemailer = require("nodemailer");

// --- Gmail App Password Transporter ---
const createTransporter = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Gmail credentials not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use your Gmail App Password here
    },
  });
};

// --- HTML Email Template ---
const createEmailTemplate = (
  title,
  userName,
  content,
  buttonText,
  buttonLink,
  buttonColor = "#007bff",
  expiryText = ""
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333; margin: 0;">${title}</h1>
      </div>
      
      <div style="padding: 20px; background-color: white;">
        <h2 style="color: #333;">Hello ${userName},</h2>
        
        <p style="color: #666; line-height: 1.6;">${content}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${buttonLink}" 
             style="background-color: ${buttonColor}; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            ${buttonText}
          </a>
        </div>
        
        ${expiryText ? `<p style="color: #666; line-height: 1.6;">${expiryText}</p>` : ""}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If the button doesn't work, you can copy and paste this link into your browser:<br>
          <a href="${buttonLink}" style="color: ${buttonColor};">${buttonLink}</a>
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <p style="color: #666; margin: 0; font-size: 12px;">
          © 2024 Izaj Inventory. All rights reserved.
        </p>
      </div>
    </div>
  `;
};

// --- Frontend link builder (supports custom schemes) ---
const FRONTEND_BASE = process.env.FRONTEND_URL || process.env.FRONTEND_SCHEME || "http://localhost:3000";
const buildFrontendLink = (path) => {
  const base = String(FRONTEND_BASE || "");
  if (/^https?:\/\//i.test(base)) {
    return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  }
  if (base.endsWith("//")) {
    return `${base}${path.replace(/^\//, "")}`;
  }
  if (base.endsWith(":")) {
    return `${base}//${path.replace(/^\//, "")}`;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

// --- Core Email Sending Function ---
const sendEmail = async (userEmail, subject, html) => {
  const transporter = await createTransporter();
  const info = await transporter.sendMail({
    from: `"Izaj Inventory" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject,
    html,
  });
  return { success: true, messageId: info.messageId };
};

// --- Setup Account Email ---
const sendSetupEmail = async (userEmail, userName, setupLink) => {
  try {
    const html = createEmailTemplate(
      "Welcome to Izaj Inventory",
      userName,
      "Your account has been created by the Superadmin. To complete your account setup, please click the button below to set up your password.",
      "Set Up Your Account",
      setupLink,
      "#007bff",
      "This link will expire in 24 hours. If you didn't expect this email, please contact your administrator."
    );

    return await sendEmail(userEmail, "Set Up Your Account - Izaj Inventory", html);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Reset Password Email ---
const sendResetPasswordEmail = async (userEmail, userName, resetLink) => {
  try {
    const html = createEmailTemplate(
      "Password Reset Request",
      userName,
      "We received a request to reset your password for your Izaj Inventory account. Click the button below to create a new password.",
      "Reset Password",
      resetLink,
      "#dc3545",
      "This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email."
    );

    return await sendEmail(userEmail, "Reset Your Password - Izaj Inventory", html);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Request Notification Email ---
const sendRequestNotificationEmail = async (userEmail, userName, requesterName, requestId) => {
  try {
    const html = createEmailTemplate(
      "New Product Request",
      userName,
      `${requesterName} has sent you a new product request (Request ID: ${requestId}). Please review and respond to this request in your inventory system.`,
      "View Request",
      buildFrontendLink("/pending_request"),
      "#28a745",
      "Please respond to this request as soon as possible to maintain efficient inventory management."
    );

    return await sendEmail(userEmail, "New Product Request - Izaj Inventory", html);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Request Status Update Email ---
const sendRequestStatusEmail = async (userEmail, userName, status, requestId, reviewerName, notes) => {
  try {
    const isApproved = status === "approved";
    const statusText = isApproved ? "approved" : "denied";
    const buttonColor = isApproved ? "#28a745" : "#dc3545";

    const html = createEmailTemplate(
      `Product Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      userName,
      `Your product request (Request ID: ${requestId}) has been ${statusText} by ${reviewerName}.${notes ? ` Notes: ${notes}` : ""}`,
      "View Request",
      buildFrontendLink("/requested_item"),
      buttonColor,
      isApproved
        ? "The requested products will be processed for transfer."
        : "You may submit a new request if needed."
    );

    return await sendEmail(
      userEmail,
      `Product Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)} - Izaj Inventory`,
      html
    );
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSetupEmail,
  sendResetPasswordEmail,
  sendRequestNotificationEmail,
  sendRequestStatusEmail,
};
