const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') // remove spaces just in case
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('[ERROR] Gmail connection error:', error);
  } else {
    console.log('[SUCCESS] Nodemailer is ready to send messages via Gmail!');
  }
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: `"EKVUE Platform" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your EKVUE Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #4f46e5; margin-top: 0;">Verify your email address</h2>
        <p style="color: #475569; font-size: 16px;">Welcome to EKVUE. Please use the following 4-digit code to complete your signup:</p>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

async function sendNotificationEmail(email, title, message) {
  const mailOptions = {
    from: `"EKVUE Notifications" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #10b981; margin-top: 0;">EKVUE Dashboard Update</h2>
        <h3 style="color: #1e293b;">${title}</h3>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">${message}</p>
        <div style="margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          You are receiving this because you are registered on the EKVUE Platform.
        </div>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  sendOTP,
  sendNotificationEmail
};
