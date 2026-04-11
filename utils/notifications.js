const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, title, message, relatedEvent }) => {
  try {
    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      relatedEvent
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    return null;
  }
};

const notifyMultiple = async (recipientIds, data) => {
  try {
    const notifications = recipientIds.map(recipientId => ({
      recipient: recipientId,
      ...data
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Bulk notification error:', error);
  }
};

module.exports = { createNotification, notifyMultiple };
