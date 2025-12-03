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
        
        ${
          expiryText
            ? `<p style="color: #666; line-height: 1.6;">${expiryText}</p>`
            : ""
        }
        
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

// --- HTML Email Template Without Button (for displaying all info) ---
const createEmailTemplateNoButton = (
  title,
  userName,
  content,
  details = ""
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333; margin: 0;">${title}</h1>
      </div>
      
      <div style="padding: 20px; background-color: white;">
        <h2 style="color: #333;">Hello ${userName},</h2>
        
        <div style="color: #666; line-height: 1.6;">
          ${content}
        </div>
        
        ${details ? `<div style="margin-top: 20px;">${details}</div>` : ""}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          You can view more details in your Izaj Inventory application.
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
const FRONTEND_BASE =
  process.env.FRONTEND_URL ||
  process.env.FRONTEND_SCHEME ||
  "http://localhost:3000";
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

    return await sendEmail(
      userEmail,
      "Set Up Your Account - Izaj Inventory",
      html
    );
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

    return await sendEmail(
      userEmail,
      "Reset Your Password - Izaj Inventory",
      html
    );
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Request Notification Email ---
const sendRequestNotificationEmail = async (
  userEmail,
  userName,
  requesterName,
  requestId,
  items = []
) => {
  try {
    let itemsDetails = "";
    if (items && items.length > 0) {
      const itemsList = items
        .map(
          (item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name || "Unknown Product"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 0}</td>
          </tr>`
        )
        .join("");
      
      itemsDetails = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Requested Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product Name</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          <p style="margin-top: 10px; color: #666; font-weight: bold;">
            Total Items: ${items.length} | Total Quantity: ${items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
          </p>
        </div>
      `;
    }

    const content = `
      <p><strong>${requesterName}</strong> has sent you a new product request.</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p style="margin-top: 15px;">Please review and respond to this request in your inventory system as soon as possible to maintain efficient inventory management.</p>
    `;

    const html = createEmailTemplateNoButton(
      "New Product Request",
      userName,
      content,
      itemsDetails
    );

    return await sendEmail(
      userEmail,
      "New Product Request - Izaj Inventory",
      html
    );
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Request Status Update Email ---
const sendRequestStatusEmail = async (
  userEmail,
  userName,
  status,
  requestId,
  reviewerName,
  notes,
  items = []
) => {
  try {
    const isApproved = status === "approved";
    const statusText = isApproved ? "approved" : "denied";
    const statusColor = isApproved ? "#28a745" : "#dc3545";

    let itemsDetails = "";
    if (items && items.length > 0) {
      const itemsList = items
        .map(
          (item) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name || "Unknown Product"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 0}</td>
          </tr>`
        )
        .join("");
      
      itemsDetails = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Requested Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product Name</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          <p style="margin-top: 10px; color: #666; font-weight: bold;">
            Total Items: ${items.length} | Total Quantity: ${items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
          </p>
        </div>
      `;
    }

    const content = `
      <p>Your product request has been <strong style="color: ${statusColor};">${statusText.toUpperCase()}</strong>.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Request ID:</strong> ${requestId}</p>
        <p style="margin: 5px 0;"><strong>Reviewed By:</strong> ${reviewerName}</p>
        ${notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${notes}</p>` : ""}
      </div>
      <p style="margin-top: 15px;">
        ${isApproved
          ? "The requested products will be processed for transfer."
          : "You may submit a new request if needed."}
      </p>
    `;

    const html = createEmailTemplateNoButton(
      `Product Request ${
        statusText.charAt(0).toUpperCase() + statusText.slice(1)
      }`,
      userName,
      content,
      itemsDetails
    );

    return await sendEmail(
      userEmail,
      `Product Request ${
        statusText.charAt(0).toUpperCase() + statusText.slice(1)
      } - Izaj Inventory`,
      html
    );
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Transfer Arrival Email ---
const sendTransferArrivalEmail = async (
  userEmail,
  userName,
  requestId,
  receivingBranch,
  changes = []
) => {
  try {
    let changeDetails = "";
    if (changes && changes.length > 0) {
      const changesList = changes
        .map(
          (change) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${change.product_name || "Unknown Product"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${change.tag || "N/A"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${change.previous_quantity || 0}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #28a745; font-weight: bold;">+${change.added_quantity || 0}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">${change.new_quantity || 0}</td>
          </tr>`
        )
        .join("");
      
      changeDetails = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Inventory Changes:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product Name</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Previous Qty</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Added</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">New Qty</th>
              </tr>
            </thead>
            <tbody>
              ${changesList}
            </tbody>
          </table>
          <p style="margin-top: 10px; color: #666; font-weight: bold;">
            Total Items Transferred: ${changes.length} | Total Quantity: ${changes.reduce((sum, change) => sum + (change.added_quantity || 0), 0)}
          </p>
        </div>
      `;
    }

    const content = `
      <p>Branch <strong>${receivingBranch}</strong> has confirmed that request #${requestId} arrived and has been merged into their local inventory.</p>
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #0d9488;">
        <p style="margin: 5px 0;"><strong>Request ID:</strong> ${requestId}</p>
        <p style="margin: 5px 0;"><strong>Receiving Branch:</strong> ${receivingBranch}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> Transfer Completed</p>
      </div>
      <p style="margin-top: 15px;">You can review the updated request details anytime inside the application.</p>
    `;

    const html = createEmailTemplateNoButton(
      "Transfer Received",
      userName,
      content,
      changeDetails
    );

    return await sendEmail(
      userEmail,
      `Request #${requestId} Received - Izaj Inventory`,
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
  sendTransferArrivalEmail,
};
