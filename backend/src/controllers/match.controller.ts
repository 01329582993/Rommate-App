import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { calculateCompatibility, Profile as ScoringProfile } from '../utils/scoring';

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Get my profile
    const myProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!myProfile) return res.status(400).json({ message: 'Please complete your profile first' });

    // Get other users' profiles (simple approach for now: all students in same gender group)
    const me = await prisma.user.findUnique({ where: { id: userId } });
    
    const others = await prisma.profile.findMany({
      where: {
        userId: { not: userId },
        user: { gender: me?.gender } // Match by gender for university housing
      },
      include: { user: { select: { id: true, name: true, gender: true } } }
    });

    const matches = others.map(other => {
      const result = calculateCompatibility(
        myProfile as unknown as ScoringProfile,
        other as unknown as ScoringProfile
      );
      return {
        userId: other.userId,
        name: other.user.name,
        compatibility: result.score,
        details: result.details
      };
    });

    // Sort by compatibility score
    matches.sort((a, b) => b.compatibility - a.compatibility);

    res.json(matches.slice(0, 10)); // Top 10 matches
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
};

export const likeUser = async (req: AuthRequest, res: Response) => {
  try {
    const fromId = req.user?.userId;
    const { toId } = req.body;
    if (!fromId) return res.status(401).json({ message: 'Unauthorized' });

    // Check if reverse like exists
    const reverseLike = await prisma.like.findFirst({
      where: { fromId: toId, toId: fromId }
    });

    const like = await prisma.like.create({
      data: {
        fromId,
        toId,
        isMutual: !!reverseLike
      }
    });

    if (reverseLike) {
      await prisma.like.update({
        where: { id: reverseLike.id },
        data: { isMutual: true }
      });
    }

    res.json({ message: reverseLike ? 'It is a mutual match!' : 'Liked successfully', isMutual: !!reverseLike });
  } catch (error: any) {
    res.status(500).json({ message: 'Error liking user', error: error.message });
  }
};
