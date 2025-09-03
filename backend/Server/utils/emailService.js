const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const createTransporter = async () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN || !process.env.EMAIL_USER) {
    throw new Error('Gmail OAuth2 credentials not configured');
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const accessToken = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: process.env.GOOGLE_ACCESS_TOKEN
    }
  });
};

const createEmailTemplate = (title, userName, content, buttonText, buttonLink, buttonColor = '#007bff', expiryText = '') => {
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
        
        ${expiryText ? `<p style="color: #666; line-height: 1.6;">${expiryText}</p>` : ''}
        
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

const sendEmail = async (userEmail, subject, html) => {
  const transporter = await createTransporter();
  const info = await transporter.sendMail({
    from: '"Izaj Inventory" <noreply@izajinventory.com>',
    to: userEmail,
    subject,
    html
  });
  return { success: true, messageId: info.messageId };
};

const sendSetupEmail = async (userEmail, userName, setupLink) => {
  try {
    const html = createEmailTemplate(
      'Welcome to Izaj Inventory',
      userName,
      'Your account has been created by the Superadmin. To complete your account setup, please click the button below to set up your password.',
      'Set Up Your Account',
      setupLink,
      '#007bff',
      'This link will expire in 24 hours. If you didn\'t expect this email, please contact your administrator.'
    );

    return await sendEmail(userEmail, 'Set Up Your Account - Izaj Inventory', html);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const sendResetPasswordEmail = async (userEmail, userName, resetLink) => {
  try {
    const html = createEmailTemplate(
      'Password Reset Request',
      userName,
      'We received a request to reset your password for your Izaj Inventory account. Click the button below to create a new password.',
      'Reset Password',
      resetLink,
      '#dc3545',
      'This link will expire in 1 hour. If you didn\'t request a password reset, you can safely ignore this email.'
    );

    return await sendEmail(userEmail, 'Reset Your Password - Izaj Inventory', html);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const sendRequestNotificationEmail = async (userEmail, userName, requesterName, requestId) => {
  try {
    const html = createEmailTemplate(
      'New Product Request',
      userName,
      `${requesterName} has sent you a new product request (Request ID: ${requestId}). Please review and respond to this request in your inventory system.`,
      'View Request',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pending_request`,
      '#28a745',
      'Please respond to this request as soon as possible to maintain efficient inventory management.'
    );

    return await sendEmail(userEmail, 'New Product Request - Izaj Inventory', html);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const sendRequestStatusEmail = async (userEmail, userName, status, requestId, reviewerName, notes) => {
  try {
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'approved' : 'denied';
    const buttonColor = isApproved ? '#28a745' : '#dc3545';

    const html = createEmailTemplate(
      `Product Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      userName,
      `Your product request (Request ID: ${requestId}) has been ${statusText} by ${reviewerName}.${notes ? ` Notes: ${notes}` : ''}`,
      'View Request',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requested_item`,
      buttonColor,
      isApproved ? 'The requested products will be processed for transfer.' : 'You may submit a new request if needed.'
    );

    return await sendEmail(userEmail, `Product Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)} - Izaj Inventory`, html);
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
