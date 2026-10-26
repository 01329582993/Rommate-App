import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    
    const messages = await prisma.message.findMany({
      where: { groupId },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

export const getDirectMessages = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const myId = (req as any).user?.userId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: userId },
          { senderId: userId, receiverId: myId }
        ]
      },
      include: {
        sender: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching direct messages', error: error.message });
  }
};

export const sendHttpMessage = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user?.userId;
    const { content, groupId, receiverId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Resolve valid sender
    let validSenderId = senderId;
    let senderUser = senderId ? await prisma.user.findUnique({ where: { id: senderId } }) : null;
    if (!senderUser) {
      senderUser = await prisma.user.findFirst();
      if (senderUser) validSenderId = senderUser.id;
    }

    if (!validSenderId) {
      return res.status(401).json({ message: 'No valid sender found' });
    }

    // Resolve valid targets
    let validGroupId = null;
    let validReceiverId = null;

    if (groupId) {
      const g = await prisma.group.findUnique({ where: { id: groupId } });
      if (g) validGroupId = g.id;
    }

    if (receiverId) {
      const r = await prisma.user.findUnique({ where: { id: receiverId } });
      if (r) validReceiverId = r.id;
    }

    const savedMessage = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: validSenderId,
        groupId: validGroupId,
        receiverId: validReceiverId,
      },
      include: {
        sender: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(savedMessage);
  } catch (error: any) {
    console.error('sendHttpMessage error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user?.userId;
    if (!myId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch current user with group
    const me = await prisma.user.findUnique({
      where: { id: myId },
      include: { 
        group: {
          include: {
            members: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    const conversations: any[] = [];

    // 1. Add Group conversation if user is in a squad
    if (me?.groupId && me.group) {
      const lastGroupMsg = await prisma.message.findFirst({
        where: { groupId: me.groupId },
        orderBy: { createdAt: 'desc' }
      });

      conversations.push({
        id: me.groupId,
        name: me.group.name || 'Scholar Sanctuary',
        lastMessage: lastGroupMsg?.content || 'Ava: Room 101 looks amazing, we should apply!',
        time: lastGroupMsg ? new Date(lastGroupMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '3:54 PM',
        unread: 1,
        isGroup: true,
        memberCount: me.group.members.length,
        isLocked: me.group.isLocked,
        matchScore: 94
      });
    }

    // 2. Fetch other student users
    const groupUsers = me?.groupId 
      ? await prisma.user.findMany({ where: { groupId: me.groupId }, select: { id: true } })
      : [];
    const groupUserIds = groupUsers.map(u => u.id);
    groupUserIds.push(myId); // Exclude self

    const otherUsers = await prisma.user.findMany({
      where: {
        id: { notIn: groupUserIds },
        role: { not: 'ADMIN' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            studyStyle: true,
            sleepSchedule: true,
            cleanliness: true
          }
        }
      },
      take: 10
    });

    const demoScores = [98, 95, 92, 89, 88, 85];
    const demoMessages = [
      "Hey! Are you also looking at Northwood Residence for fall?",
      "Sounds great! I usually wake up around 7:30 AM for morning lectures.",
      "Are you bringing a mini fridge or microwave for the shared area?",
      "I love keeping the room quiet after 11 PM on weekdays.",
      "Let's definitely team up for housing application!"
    ];

    for (let i = 0; i < otherUsers.length; i++) {
      const other = otherUsers[i];
      const lastMsg = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: myId, receiverId: other.id },
            { senderId: other.id, receiverId: myId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      conversations.push({
        id: other.id,
        name: other.name || 'Student Candidate',
        lastMessage: lastMsg?.content || demoMessages[i % demoMessages.length],
        time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (i === 0 ? 'Yesterday' : 'Aug 14'),
        unread: i === 0 ? 1 : 0,
        isGroup: false,
        matchScore: demoScores[i % demoScores.length],
        email: other.email
      });
    }

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};
