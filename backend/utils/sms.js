const twilio = require('twilio');

let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log("SMS stub: (Twilio not configured) SMS to " + to + " with message: " + message);
    return;
  }
  try {
    const twilioMessage = await twilioClient.messages.create({ body: message, to, from: process.env.TWILIO_PHONE_NUMBER });
    console.log("SMS sent via Twilio, sid: " + twilioMessage.sid);
  } catch (err) {
    console.error("Twilio SMS error:", err);
  }
}

module.exports = { sendSMS }; 