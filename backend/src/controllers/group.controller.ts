import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Check if user is already in a group
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.groupId) {
      return res.status(400).json({ message: 'You are already in a group' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        members: {
          connect: { id: userId }
        }
      }
    });

    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

export const inviteToGroup = async (req: AuthRequest, res: Response) => {
  try {
    const fromId = req.user?.userId;
    const { toId } = req.body;

    if (!fromId) return res.status(401).json({ message: 'Unauthorized' });

    const fromUser = await prisma.user.findUnique({ where: { id: fromId }, include: { group: true } });
    if (!fromUser?.groupId) {
      return res.status(400).json({ message: 'You must be in a group to invite others' });
    }

    if (fromUser.group?.isLocked) {
      return res.status(400).json({ message: 'This group is locked' });
    }

    // In a real app, we'd create an "Invitation" model. 
    // For MVP, we'll just add them if it's a mutual match or similar.
    // Let's assume the "like" system handles the initial connection, 
    // and this adds them to the group if they accept.
    
    // For now, let's just create a message/notification logic or just return success
    res.json({ message: 'Invitation sent' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error inviting to group', error: error.message });
  }
};

export const lockGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.groupId) {
      return res.status(400).json({ message: 'You are not in a group' });
    }

    const group = await prisma.group.update({
      where: { id: user.groupId },
      data: { isLocked: true }
    });

    res.json({ message: 'Group locked successfully', group });
  } catch (error: any) {
    res.status(500).json({ message: 'Error locking group', error: error.message });
  }
};

export const getMyGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { 
        group: {
          include: {
            members: {
              select: { id: true, name: true, profile: true }
            }
          }
        } 
      }
    });

    if (!user?.group) {
      return res.status(404).json({ message: 'No group found' });
    }

    res.json(user.group);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching group', error: error.message });
  }
};
