/**
 * Golden Bond - Messaging Routes
 * Chat between matched profiles
 */

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/messages/conversations
 * Get all conversations (matches with messages)
 */
router.get('/conversations', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Check if user has messaging permission
    if (!req.isPremium && req.membershipPlan !== 'DIAMOND' && req.membershipPlan !== 'ELITE') {
      res.status(403).json({
        error: 'Messaging requires Diamond or Elite membership',
        upgradeUrl: '/membership'
      });
      return;
    }

    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Get all mutual matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { profile1Id: userProfile.id },
          { profile2Id: userProfile.id }
        ],
        status: 'MUTUAL'
      },
      include: {
        profile1: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            user: { select: { id: true } }
          }
        },
        profile2: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            user: { select: { id: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format conversations
    const conversations = matches.map(match => {
      const otherProfile = match.profile1Id === userProfile.id 
        ? match.profile2 
        : match.profile1;
      
      const lastMessage = match.messages[0];
      const isLastMessageMine = lastMessage?.senderId === req.userId;

      return {
        matchId: match.id,
        profile: {
          id: otherProfile.id,
          userId: otherProfile.user.id,
          firstName: otherProfile.firstName,
          photo: otherProfile.photos[0]?.url || null,
          verified: otherProfile.verified
        },
        lastMessage: lastMessage ? {
          content: lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : ''),
          isRead: lastMessage.isRead,
          isMine: isLastMessageMine,
          timestamp: lastMessage.createdAt
        } : null,
        compatibilityScore: match.score
      };
    });

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });

    res.json({ conversations });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

/**
 * GET /api/messages/:matchId
 * Get messages for a specific match
 */
router.get('/:matchId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Check messaging permission
    if (!req.isPremium && req.membershipPlan !== 'DIAMOND' && req.membershipPlan !== 'ELITE') {
      res.status(403).json({
        error: 'Messaging requires Diamond or Elite membership',
        upgradeUrl: '/membership'
      });
      return;
    }

    const matchId = parseInt(req.params.matchId, 10);

    if (isNaN(matchId)) {
      res.status(400).json({ error: 'Invalid match ID' });
      return;
    }

    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Get match and verify user is part of it
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        profile1: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            user: { select: { id: true } }
          }
        },
        profile2: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            user: { select: { id: true } }
          }
        }
      }
    });

    if (!match) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (match.profile1Id !== userProfile.id && match.profile2Id !== userProfile.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' }
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: { not: req.userId },
        isRead: false
      },
      data: { isRead: true }
    });

    // Get other profile info
    const otherProfile = match.profile1Id === userProfile.id 
      ? match.profile2 
      : match.profile1;

    res.json({
      matchId: match.id,
      compatibilityScore: match.score,
      otherProfile: {
        id: otherProfile.id,
        userId: otherProfile.user.id,
        firstName: otherProfile.firstName,
        photo: otherProfile.photos[0]?.url || null,
        verified: otherProfile.verified
      },
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        isMine: m.senderId === req.userId,
        isRead: m.isRead,
        timestamp: m.createdAt
      }))
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /api/messages/:matchId
 * Send a message in a conversation
 */
router.post('/:matchId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    // Check messaging permission
    if (!req.isPremium && req.membershipPlan !== 'DIAMOND' && req.membershipPlan !== 'ELITE') {
      res.status(403).json({
        error: 'Messaging requires Diamond or Elite membership',
        upgradeUrl: '/membership'
      });
      return;
    }

    const matchId = parseInt(req.params.matchId, 10);
    const { content } = req.body;

    if (isNaN(matchId)) {
      res.status(400).json({ error: 'Invalid match ID' });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({ error: 'Message too long (max 2000 characters)' });
      return;
    }

    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Verify match exists and user is part of it
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (match.profile1Id !== userProfile.id && match.profile2Id !== userProfile.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (match.status !== 'MUTUAL') {
      res.status(400).json({ error: 'Cannot message - match is not mutual' });
      return;
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: req.userId!,
        content: content.trim()
      }
    });

    // Update match timestamp
    await prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() }
    });

    res.json({
      message: {
        id: message.id,
        content: message.content,
        isMine: true,
        isRead: false,
        timestamp: message.createdAt
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/messages/:matchId/read
 * Mark all messages in a conversation as read
 */
router.put('/:matchId/read', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const matchId = parseInt(req.params.matchId, 10);

    if (isNaN(matchId)) {
      res.status(400).json({ error: 'Invalid match ID' });
      return;
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: { not: req.userId },
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/**
 * GET /api/messages/unread/count
 * Get count of unread messages
 */
router.get('/unread/count', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (!userProfile) {
      res.json({ count: 0 });
      return;
    }

    // Get matches user is part of
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { profile1Id: userProfile.id },
          { profile2Id: userProfile.id }
        ],
        status: 'MUTUAL'
      },
      select: { id: true }
    });

    const matchIds = matches.map(m => m.id);

    // Count unread messages
    const count = await prisma.message.count({
      where: {
        matchId: { in: matchIds },
        senderId: { not: req.userId },
        isRead: false
      }
    });

    res.json({ count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;

