import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    
    // Validate if group exists
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

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
    // Assuming auth middleware puts userId in req.user
    const myId = (req as any).user.userId;

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

export const getConversations = async (req: Request, res: Response) => {
  try {
    const myId = (req as any).user?.userId;
    if (!myId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch the current user to find their group
    const me = await prisma.user.findUnique({
      where: { id: myId },
      include: { group: true }
    });

    const conversations: any[] = [];

    // 1. Add Group conversation if the user has a group
    if (me?.groupId && me.group) {
      // Find last message in the group
      const lastGroupMsg = await prisma.message.findFirst({
        where: { groupId: me.groupId },
        orderBy: { createdAt: 'desc' }
      });

      conversations.push({
        id: me.groupId,
        name: me.group.name || 'My Group',
        lastMessage: lastGroupMsg?.content || 'Tap to open group chat',
        time: lastGroupMsg ? new Date(lastGroupMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: 0,
        isGroup: true
      });
    }

    // 2. Fetch other users who are NOT in the current user's group
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
        email: true
      }
    });

    for (const other of otherUsers) {
      // Find last message between me and other
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
        name: other.name || 'Student User',
        lastMessage: lastMsg?.content || 'Tap to start direct message',
        time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: 0,
        isGroup: false
      });
    }

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

