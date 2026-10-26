import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - no userId' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // If user is already in a group, remove them from previous group seamlessly
    if (user?.groupId) {
      const oldGroupId = user.groupId;
      await prisma.user.update({
        where: { id: userId },
        data: { groupId: null }
      });
      const remaining = await prisma.user.count({ where: { groupId: oldGroupId } });
      if (remaining === 0) {
        await prisma.group.delete({ where: { id: oldGroupId } }).catch(() => null);
      }
    }

    // Create group first, then add user to it
    const group = await prisma.group.create({
      data: {
        name
      }
    });

    // Update user to join the group
    await prisma.user.update({
      where: { id: userId },
      data: { groupId: group.id }
    });

    // Fetch group with members
    const groupWithMembers = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          select: { id: true, name: true, email: true, studentId: true, profile: true }
        }
      }
    });

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...groupWithMembers,
        inviteCode: groupWithMembers?.id,
      }
    });
  } catch (error: any) {
    console.error('Create Group Error:', error);
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

export const inviteToGroup = async (req: AuthRequest, res: Response) => {
  try {
    const fromId = req.user?.userId;
    const { toId } = req.body;

    if (!fromId) return res.status(401).json({ message: 'Unauthorized' });

    const fromUser = await prisma.user.findUnique({ where: { id: fromId }, include: { group: true } });
    if (!fromUser?.groupId || !fromUser.group) {
      return res.status(400).json({ message: 'You must be in a group to invite others' });
    }

    if (fromUser.group.isLocked) {
      return res.status(400).json({ message: 'This group is locked' });
    }

    res.json({ message: 'Invitation sent', inviteCode: fromUser.group.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error inviting to group', error: error.message });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { inviteCode } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });

    const group = await prisma.group.findUnique({ where: { id: inviteCode } });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.isLocked) {
      return res.status(400).json({ message: 'This group is locked' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (currentUser?.groupId) {
      const oldGroupId = currentUser.groupId;
      await prisma.user.update({
        where: { id: userId },
        data: { groupId: null }
      });
      const remaining = await prisma.user.count({ where: { groupId: oldGroupId } });
      if (remaining === 0) {
        await prisma.group.delete({ where: { id: oldGroupId } }).catch(() => null);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { groupId: group.id }
    });

    const updatedGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          select: { id: true, name: true, email: true, studentId: true, profile: true }
        }
      }
    });

    res.json({ message: 'Joined group successfully', group: { ...updatedGroup, inviteCode: updatedGroup?.id } });
  } catch (error: any) {
    res.status(500).json({ message: 'Error joining group', error: error.message });
  }
};

export const addMemberToGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const requester = await prisma.user.findUnique({ where: { id: userId }, include: { group: true } });
    if (!requester?.groupId || !requester.group) {
      return res.status(400).json({ message: 'You must be in a group to add members' });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.groupId) {
      return res.status(400).json({ message: 'That user is already in a group' });
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { groupId: requester.group.id }
    });

    const updatedGroup = await prisma.group.findUnique({
      where: { id: requester.group.id },
      include: {
        members: {
          select: { id: true, name: true, email: true, profile: true }
        }
      }
    });

    res.json({ message: 'Member added', group: { ...updatedGroup, inviteCode: updatedGroup?.id } });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
};

export const removeMemberFromGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const requester = await prisma.user.findUnique({ where: { id: userId }, include: { group: true } });
    if (!requester?.groupId || !requester.group) {
      return res.status(400).json({ message: 'You must be in a group to remove members' });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.groupId !== requester.group.id) {
      return res.status(400).json({ message: 'That user is not in your group' });
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { groupId: null }
    });

    const updatedGroup = await prisma.group.findUnique({
      where: { id: requester.group.id },
      include: {
        members: {
          select: { id: true, name: true, email: true, studentId: true, profile: true }
        }
      }
    });

    res.json({ message: 'Member removed', group: { ...updatedGroup, inviteCode: updatedGroup?.id } });
  } catch (error: any) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
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
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        group: {
          include: {
            members: {
              select: { id: true, name: true, email: true, studentId: true, profile: true }
            }
          }
        }
      }
    });

    if (!user?.group) {
      return res.status(404).json({ message: 'No group found' });
    }

    res.json({ ...user.group, inviteCode: user.group.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching group', error: error.message });
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.groupId) {
      return res.status(200).json({ message: 'You are not in a group', ok: true });
    }

    const groupId = user.groupId;

    // Remove user from group
    await prisma.user.update({
      where: { id: userId },
      data: { groupId: null }
    });

    // Check if the group has any remaining members. If not, delete it.
    const remainingMembers = await prisma.user.count({
      where: { groupId }
    });

    if (remainingMembers === 0) {
      await prisma.group.delete({ where: { id: groupId } }).catch(() => null);
    }

    res.json({ message: 'Left group successfully', ok: true });
  } catch (error: any) {
    res.status(500).json({ message: 'Error leaving group', error: error.message });
  }
};
