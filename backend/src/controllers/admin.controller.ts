import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import fs from 'fs';
import csv from 'csv-parser';
import { calculateCompatibility, Profile as ScoringProfile } from '../utils/scoring';

// Compute pairwise compatibility for every pair of members that has a completed profile,
// and return both the group average and the individual pairwise breakdown.
const computeGroupCompatibility = (
  members: { id: string; name: string; profile: any }[]
): {
  average: number;
  pairwise: { memberA: { id: string; name: string }; memberB: { id: string; name: string }; score: number; details: string[] }[];
} => {
  const withProfiles = members.filter(m => m.profile);
  const pairwise: { memberA: { id: string; name: string }; memberB: { id: string; name: string }; score: number; details: string[] }[] = [];

  for (let i = 0; i < withProfiles.length; i++) {
    for (let j = i + 1; j < withProfiles.length; j++) {
      const result = calculateCompatibility(
        withProfiles[i].profile as unknown as ScoringProfile,
        withProfiles[j].profile as unknown as ScoringProfile
      );
      pairwise.push({
        memberA: { id: withProfiles[i].id, name: withProfiles[i].name },
        memberB: { id: withProfiles[j].id, name: withProfiles[j].name },
        score: result.score,
        details: result.details
      });
    }
  }

  const average = pairwise.length > 0
    ? Math.round(pairwise.reduce((sum, p) => sum + p.score, 0) / pairwise.length)
    : 0;

  return { average, pairwise };
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        profile: true,
        group: {
          include: {
            room: true,
            members: { select: { id: true, name: true, profile: true } }
          }
        }
      }
    });

    // Cache per-group compatibility so it's only computed once per group, not once per member.
    const groupCompatCache = new Map<string, number>();

    // Map to the format Admin expects
    const formattedStudents = students.map(s => {
      let roomStatus = 'Unassigned';
      if (s.groupId) {
        roomStatus = s.group?.roomId ? 'Assigned' : 'Pending Room';
      }

      // Real average pairwise compatibility across the student's group (based on completed
      // profiles only). Stays 0 if the student is ungrouped or nobody in the group has a
      // completed profile yet.
      let compatibility = 0;
      if (s.groupId && s.group) {
        if (!groupCompatCache.has(s.groupId)) {
          groupCompatCache.set(s.groupId, computeGroupCompatibility(s.group.members).average);
        }
        compatibility = groupCompatCache.get(s.groupId)!;
      }

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        studentId: s.studentId,
        compatibility,
        roomStatus,
        groupId: s.groupId
      };
    });

    res.json(formattedStudents);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// List every group with its room assignment and average compatibility, flagging rooms whose
// average compatibility is low so admins can catch conflicts before they escalate.
export const getGroups = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        room: true,
        members: { select: { id: true, name: true, email: true, studentId: true, profile: true } }
      }
    });

    const LOW_COMPATIBILITY_THRESHOLD = 50;

    const formattedGroups = groups.map(g => {
      const { average } = computeGroupCompatibility(g.members);
      const hasCompleteData = g.members.length >= 2 && g.members.every(m => m.profile);

      return {
        id: g.id,
        name: g.name,
        roomNumber: g.room?.roomNumber || null,
        isLocked: g.isLocked,
        memberCount: g.members.length,
        members: g.members.map(m => ({ id: m.id, name: m.name, email: m.email, studentId: m.studentId })),
        averageCompatibility: average,
        flagged: hasCompleteData && average < LOW_COMPATIBILITY_THRESHOLD
      };
    });

    res.json(formattedGroups);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
};

// Full compatibility breakdown for a single group: every pairwise score plus the reasoning
// behind it, so admins can see exactly why a room is (or isn't) working.
export const getGroupDetails = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        room: true,
        members: { select: { id: true, name: true, email: true, studentId: true, profile: true } }
      }
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const { average, pairwise } = computeGroupCompatibility(group.members);

    res.json({
      id: group.id,
      name: group.name,
      room: group.room,
      isLocked: group.isLocked,
      members: group.members.map(m => ({ id: m.id, name: m.name, email: m.email, studentId: m.studentId, hasProfile: !!m.profile })),
      averageCompatibility: average,
      pairwise
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching group details', error: error.message });
  }
};

export const uploadStudents = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const results: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('error', () => {
        res.status(400).json({ message: 'Could not read that CSV file' });
      })
      .on('end', async () => {
       try {
        let addedCount = 0;
        for (const row of results) {
          // Expected CSV format: Name, Email, StudentId, Gender
          const { Name, Email, StudentId, Gender } = row;
          if (Name && Email) {
            // Check if exists
            const existing = await prisma.user.findUnique({ where: { email: Email } });
            if (!existing) {
              await prisma.user.create({
                data: {
                  name: Name,
                  email: Email,
                  studentId: StudentId || null,
                  gender: (Gender?.toUpperCase() as any) || 'OTHER',
                  role: 'STUDENT'
                }
              });
              addedCount++;
            }
          }
        }
        
        // Clean up the uploaded file
        if (req.file) {
           fs.unlinkSync(req.file.path);
        }

        res.json({ message: `Successfully uploaded ${addedCount} students` });
       } catch (err: any) {
        res.status(500).json({ message: 'Error processing CSV', error: err.message });
       }
      });
  } catch (error: any) {
    res.status(500).json({ message: 'Error processing CSV', error: error.message });
  }
};

// Confirm / Lock room assignment and notify group
export const confirmRoomAssignment = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { roomNumber } = req.body;
    const adminId = (req as any).user?.userId;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { room: true, members: true }
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    let roomIdToSet = group.roomId;
    if (roomNumber) {
      let room = await prisma.room.findUnique({ where: { roomNumber } });
      if (!room) {
        room = await prisma.room.create({
          data: { roomNumber, capacity: Math.max(group.members.length, 4) }
        });
      }
      // If another group is currently holding this room, release it first so unique constraint succeeds
      await prisma.group.updateMany({
        where: { roomId: room.id, id: { not: groupId } },
        data: { roomId: null }
      });
      roomIdToSet = room.id;
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        isLocked: true,
        ...(roomIdToSet ? { roomId: roomIdToSet } : {})
      },
      include: {
        room: true,
        members: { select: { id: true, name: true, email: true } }
      }
    });

    // Create official announcement in group chat
    if (adminId) {
      const roomDisplay = updatedGroup.room?.roomNumber ? `Room ${updatedGroup.room.roomNumber}` : 'your assigned room';
      await prisma.message.create({
        data: {
          content: `🏛️ [Official Notice] University Housing has CONFIRMED and LOCKED ${roomDisplay} for your roommate group. Assignments are now official!`,
          senderId: adminId,
          groupId: groupId,
        }
      }).catch(err => console.warn('Could not post confirm message:', err));
    }

    res.json({
      message: 'Room assignment confirmed and locked successfully',
      group: updatedGroup
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error confirming room', error: error.message });
  }
};

// Deny / Unassign or Dissolve room assignment
export const denyRoomAssignment = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { reason, dissolve } = req.body;
    const adminId = (req as any).user?.userId;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { room: true, members: true }
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const reasonText = reason ? `: ${reason}` : '.';

    if (dissolve) {
      if (adminId) {
        await prisma.message.create({
          data: {
            content: `⚠️ [Housing Notice] University Housing has DISSOLVED this room group${reasonText} All members are now available for re-matching.`,
            senderId: adminId,
            groupId: groupId
          }
        }).catch(() => null);
      }

      await prisma.user.updateMany({
        where: { groupId },
        data: { groupId: null }
      });

      await prisma.group.delete({ where: { id: groupId } });

      return res.json({ message: 'Room assignment denied and group dissolved successfully' });
    }

    // Deny room assignment (unlock & remove assigned room)
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        isLocked: false,
        roomId: null
      },
      include: {
        room: true,
        members: { select: { id: true, name: true, email: true } }
      }
    });

    if (adminId) {
      await prisma.message.create({
        data: {
          content: `⚠️ [Housing Notice] University Housing has DENIED / UNASSIGNED this room${reasonText} The group is unlocked and pending reassignment.`,
          senderId: adminId,
          groupId: groupId
        }
      }).catch(err => console.warn('Could not post deny message:', err));
    }

    res.json({
      message: 'Room assignment denied successfully. Room unassigned and unlocked.',
      group: updatedGroup
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error denying room assignment', error: error.message });
  }
};

// Send message to group as Admin
export const sendAdminGroupMessage = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const adminId = (req as any).user?.userId;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const savedMessage = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: adminId,
        groupId: groupId,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });

    res.status(201).json(savedMessage);
  } catch (error: any) {
    res.status(500).json({ message: 'Error sending admin message', error: error.message });
  }
};

// Get group chat messages for Admin inspection
export const getAdminGroupMessages = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const messages = await prisma.message.findMany({
      where: { groupId },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching group messages', error: error.message });
  }
};

