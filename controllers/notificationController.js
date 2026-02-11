const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : null;
    const notifications = await Notification.findByUserId(req.user.userId, isRead);
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.markAsRead(req.params.notificationId, req.user.userId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read', details: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.userId);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count', details: error.message });
  }
};
