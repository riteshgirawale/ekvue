// Using EmailJS REST API to bypass Render's SMTP port blocking

const EMAILJS_SERVICE_ID = 'service_9bkzv4r';
const EMAILJS_TEMPLATE_ID = 'template_sfqxpaa';
const EMAILJS_PUBLIC_KEY = 'o7-fa1S112WT8TyZa';
const EMAILJS_PRIVATE_KEY = 'O4Lt7UxtZ1B4-96f-XX9P';

async function sendEmailJS(email, message, otp) {
  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    accessToken: EMAILJS_PRIVATE_KEY,
    template_params: {
      email: email,
      message: message,
      otp: otp || '' // if no OTP is provided, pass empty string
    }
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS Error: ${response.status} - ${errorText}`);
  }
  
  return { messageId: 'emailjs-' + Date.now() };
}

async function sendOTP(email, otp) {
  return await sendEmailJS(
    email,
    'Welcome to EKVUE! Please use the following 4-digit code to complete your signup. This code will expire in 10 minutes.',
    otp
  );
}

async function sendNotificationEmail(email, title, message) {
  return await sendEmailJS(
    email,
    `${title}\n\n${message}\n\nYou are receiving this because you are registered on the EKVUE Platform.`,
    '' // No OTP for notifications
  );
}

module.exports = {
  sendOTP,
  sendNotificationEmail
};
