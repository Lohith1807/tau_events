const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Enable connection pooling
  maxConnections: 3,
  maxMessages: 100,
  rateLimit: 10, // Max 10 messages per second
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOTP = async (email, otp, type = 'Verification') => {
  const mailOptions = {
    from: `"TAU Event Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `[TAU] ${type} Code: ${otp}`,
    html: `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eef2f7; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c41e3a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">TAU EVENT PORTAL</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Official Institutional Verification System</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #f1f5f9;">
          <p style="color: #334155; font-size: 16px; margin-bottom: 24px;">Greetings! You are attempting to <strong>${type.toLowerCase()}</strong> your account.</p>
          
          <div style="margin-bottom: 24px;">
            <span style="display: block; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Security Code</span>
            <div style="background-color: #ffffff; color: #1e293b; font-size: 42px; font-weight: 800; padding: 15px 30px; border-radius: 8px; border: 2px solid #e2e8f0; display: inline-block; letter-spacing: 6px;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            This code will expire in <strong style="color: #ef4444;">5 minutes</strong>.<br/>
            If you did not request this, please ignore this email or contact security.
          </p>
        </div>
        
        <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px;">This is an automated institutional message. Please do not reply.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">&copy; 2026 The Apollo University (TAU). All Rights Reserved.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};
