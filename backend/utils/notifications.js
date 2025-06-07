const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('./email'); 
// Assuming an SMS utility exists
// const { sendSMS } = require('./sms');

// General notification dispatcher
exports.sendNotification = async (options) => {
  const { userId, type, title, message, data } = options;

  const user = await User.findById(userId);
  if (!user) return;

  // Create in-app notification
  await Notification.create({
    recipient: userId,
    type,
    title,
    message,
    data
  });

  // Send email if user has notifications enabled
  if (user.preferences?.notifications?.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: title,
        html: `<p>${message}</p>`,
      });
    } catch (err) {
      console.error(`Failed to send email notification to ${user.email}:`, err);
    }
  }

  // Send SMS if user has notifications enabled
  // if (user.preferences?.notifications?.sms && user.phone) {
  //   try {
  //     await sendSMS(user.phone, message);
  //   } catch (err) {
  //     console.error(`Failed to send SMS notification to ${user.phone}:`, err);
  //   }
  // }

  // Push notification logic would go here
};