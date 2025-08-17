// Email service for development and production
// Configure your email service here

const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Gmail OAuth2 Configuration using your existing Google credentials
const createGmailTransporter = async () => {
  try {
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
        accessToken: accessToken.token
      }
    });
  } catch (error) {
    console.error('Error creating Gmail OAuth2 transporter:', error);
    return null;
  }
};

// Ethereal Email for development (fallback)
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error('Error creating test account:', error);
    return null;
  }
};

// Choose email service based on environment
const createTransporter = async () => {
  // Check if Google OAuth credentials are configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN && process.env.EMAIL_USER) {
    console.log('Using Gmail OAuth2 for email service');
    return await createGmailTransporter();
  } else {
    console.log('Using Ethereal Email for development (emails will not be sent to real addresses)');
    return await createTestAccount();
  }
};

// Send setup email
const sendSetupEmail = async (userEmail, userName, setupLink) => {
  try {
    const transporter = await createTransporter();

    if (!transporter) {
      console.error('Failed to create email transporter');
      return { success: false, error: 'Email service not available' };
    }

    const mailOptions = {
      from: '"Izaj Inventory" <noreply@izajinventory.com>',
      to: userEmail,
      subject: 'Set Up Your Account - Izaj Inventory',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Welcome to Izaj Inventory</h1>
          </div>
          
          <div style="padding: 20px; background-color: white;">
            <h2 style="color: #333;">Hello ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Your account has been created by the Superadmin. To complete your account setup, 
              please click the button below to set up your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Set Up Your Account
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              This link will expire in 24 hours. If you didn't expect this email, 
              please contact your administrator.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${setupLink}" style="color: #007bff;">${setupLink}</a>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 12px;">
              © 2024 Izaj Inventory. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send reset password email
const sendResetPasswordEmail = async (userEmail, userName, resetLink) => {
  try {
    const transporter = await createTransporter();

    if (!transporter) {
      console.error('Failed to create email transporter');
      return { success: false, error: 'Email service not available' };
    }

    const mailOptions = {
      from: '"Izaj Inventory" <noreply@izajinventory.com>',
      to: userEmail,
      subject: 'Reset Your Password - Izaj Inventory',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="padding: 20px; background-color: white;">
            <h2 style="color: #333;">Hello ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password for your Izaj Inventory account. 
              Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              This link will expire in 1 hour. If you didn't request a password reset, 
              you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #dc3545;">${resetLink}</a>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 12px;">
              © 2024 Izaj Inventory. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Reset password email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };

  } catch (error) {
    console.error('Error sending reset password email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSetupEmail,
  sendResetPasswordEmail,
};
