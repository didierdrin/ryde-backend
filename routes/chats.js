const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Driver-passenger chat (per trip)
 */

/**
 * @swagger
 * /api/chats/conversations:
 *   get:
 *     summary: Get my conversations (trips with chat)
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tripId:
 *                         type: string
 *                       pickupAddress:
 *                         type: string
 *                       destinationAddress:
 *                         type: string
 *                       status:
 *                         type: string
 *                       otherPartyName:
 *                         type: string
 *                       otherPartyUserId:
 *                         type: string
 *                       lastMessage:
 *                         type: string
 *                       lastMessageAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/conversations', authenticateToken, chatController.getConversations);

/**
 * @swagger
 * /api/chats/conversations/{tripId}/messages:
 *   get:
 *     summary: Get messages for a trip
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       messageId:
 *                         type: string
 *                       tripId:
 *                         type: string
 *                       senderId:
 *                         type: string
 *                       senderName:
 *                         type: string
 *                       text:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Trip not found or access denied
 */
router.get('/conversations/:tripId/messages', authenticateToken, chatController.getMessages);

/**
 * @swagger
 * /api/chats/conversations/{tripId}/messages:
 *   post:
 *     summary: Send a message in a trip conversation
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                     tripId:
 *                       type: string
 *                     senderId:
 *                       type: string
 *                     senderName:
 *                       type: string
 *                     text:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Message text required
 *       404:
 *         description: Trip not found or access denied
 */
router.post('/conversations/:tripId/messages', authenticateToken, chatController.sendMessage);

module.exports = router;
