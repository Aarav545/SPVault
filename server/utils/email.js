// Email service: sends OTP codes via Gmail SMTP
const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // App Password, not regular password
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'SP Vault - Your Login Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">SP Vault - Verification Code</h2>
          <p>Your login verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `Your SP Vault login verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  testEmailConfig
};


