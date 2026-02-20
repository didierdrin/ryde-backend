const Chat = require('../models/Chat');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Chat.getConversations(req.user.userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const messages = await Chat.getMessages(tripId, req.user.userId);
    if (messages === null) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    const message = await Chat.sendMessage(tripId, req.user.userId, text.trim());
    if (message === null) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }
    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
