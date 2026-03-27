const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'AEGIS-SOC <noreply@aegis-soc.com>',
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Alert email template
const alertEmailTemplate = (threatType, severity, details) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    .header { background: #00d4ff; color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .severity { padding: 10px 15px; border-radius: 5px; display: inline-block; font-weight: bold; }
    .critical { background: #ff6b6b; color: white; }
    .high { background: #ffa500; color: white; }
    .medium { background: #ffeb3b; color: black; }
    .low { background: #4caf50; color: white; }
    .details { background: #f9f9f9; padding: 15px; border-left: 4px solid #00d4ff; margin: 20px 0; }
    .button { background: #00d4ff; color: black; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚡ AEGIS-SOC THREAT ALERT</h2>
    </div>
    
    <h3>New Threat Detected!</h3>
    
    <div class="details">
      <p><strong>Threat Type:</strong> ${threatType}</p>
      <p><strong>Severity:</strong> <span class="severity ${severity.toLowerCase()}">${severity}</span></p>
      <p><strong>Details:</strong></p>
      <p>${details}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <a href="http://localhost:3000/dashboard.html" class="button">View in Dashboard</a>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This is an automated alert from AEGIS-SOC. Do not reply to this email.
    </p>
  </div>
</body>
</html>
`;

module.exports = { transporter, sendEmail, alertEmailTemplate };
