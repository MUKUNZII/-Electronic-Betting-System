const nodemailer = require('nodemailer');

// Check if SMTP is properly configured
const isSMTPConfigured = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return user && pass &&
    user !== 'your_email@gmail.com' &&
    pass !== 'your_app_password' &&
    pass !== 'your_16char_app_password';
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!isSMTPConfigured()) {
    console.warn('⚠️  SMTP not configured. Email not sent to:', to);
    console.warn('   Set SMTP_USER and SMTP_PASS in backend/.env to enable emails.');
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    const info = await transporter.sendMail({
      from: `"Electronic Betting System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('✅ Email sent to', to, '| ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendVerificationEmail = async (email, token, fullName) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Electronic Betting System',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h1 style="color:#f59e0b;font-size:28px;">🎰 Electronic Betting System</h1>
        </div>
        <h2 style="color:#f59e0b;">Hello, ${fullName}!</h2>
        <p style="color:#ccc;line-height:1.6;">Thank you for registering. Please verify your email address to activate your account.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${verifyUrl}" style="background:#f59e0b;color:#000;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Verify Email Address</a>
        </div>
        <p style="color:#888;font-size:13px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
        <hr style="border-color:#333;margin:20px 0;">
        <p style="color:#666;font-size:12px;text-align:center;">© 2024 Electronic Betting System. All rights reserved.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, token, fullName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Electronic Betting System',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h1 style="color:#f59e0b;font-size:28px;">🎰 Electronic Betting System</h1>
        </div>
        <h2 style="color:#f59e0b;">Password Reset Request</h2>
        <p style="color:#ccc;">Hello ${fullName}, we received a request to reset your password.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="background:#ef4444;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Reset Password</a>
        </div>
        <p style="color:#888;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <hr style="border-color:#333;margin:20px 0;">
        <p style="color:#666;font-size:12px;text-align:center;">© 2024 Electronic Betting System. All rights reserved.</p>
      </div>
    `,
  });
};

const sendDepositNotification = async (email, fullName, amount, status) => {
  const color = status === 'approved' ? '#22c55e' : '#ef4444';
  const icon = status === 'approved' ? '✅' : '❌';
  return sendEmail({
    to: email,
    subject: `Deposit ${status.charAt(0).toUpperCase() + status.slice(1)} - Electronic Betting System`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;">
        <h1 style="color:#f59e0b;text-align:center;">🎰 Electronic Betting System</h1>
        <h2 style="color:${color};">${icon} Deposit ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p style="color:#ccc;">Hello ${fullName},</p>
        <p style="color:#ccc;">Your deposit of <strong style="color:#f59e0b;">$${parseFloat(amount).toFixed(2)}</strong> has been <strong style="color:${color};">${status}</strong>.</p>
        <p style="color:#888;font-size:13px;">Log in to your account to view your updated balance.</p>
      </div>
    `,
  });
};

const sendWithdrawalNotification = async (email, fullName, amount, status) => {
  const color = status === 'approved' ? '#22c55e' : '#ef4444';
  const icon = status === 'approved' ? '✅' : '❌';
  return sendEmail({
    to: email,
    subject: `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)} - Electronic Betting System`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:30px;border-radius:10px;">
        <h1 style="color:#f59e0b;text-align:center;">🎰 Electronic Betting System</h1>
        <h2 style="color:${color};">${icon} Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p style="color:#ccc;">Hello ${fullName},</p>
        <p style="color:#ccc;">Your withdrawal of <strong style="color:#f59e0b;">$${parseFloat(amount).toFixed(2)}</strong> has been <strong style="color:${color};">${status}</strong>.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDepositNotification,
  sendWithdrawalNotification,
};
