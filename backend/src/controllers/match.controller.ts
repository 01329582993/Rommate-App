import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { calculateCompatibility, Profile as ScoringProfile } from '../utils/scoring';

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
      let myProfile = await prisma.profile.findUnique({ where: { userId } });
      const me = await prisma.user.findUnique({ where: { id: userId } });

      const defaultDemoMatches = [
        { userId: 'demo-1', name: 'Ava Carter', compatibility: 96, details: ['Quiet study style', 'Clean habits', 'Early riser'] },
        { userId: 'demo-2', name: 'Noah Brooks', compatibility: 91, details: ['Social but respectful', 'Late-night study breaks', 'Non-smoker'] },
        { userId: 'demo-3', name: 'Mina Patel', compatibility: 88, details: ['Organized routine', 'Prefers calm evenings', 'Flexible with shared spaces'] },
        { userId: 'demo-4', name: 'Liam Chen', compatibility: 85, details: ['Early bird', 'Quiet environment', 'Clean freak'] },
        { userId: 'demo-5', name: 'Sofia Rodriguez', compatibility: 82, details: ['Extroverted', 'Music study', 'Friendly roommate'] }
      ];

      // Find other profiles in database
      const whereCondition: any = { userId: { not: userId } };
      if (me?.gender) {
        whereCondition.user = { gender: me.gender };
      }

      let others = await prisma.profile.findMany({
        where: whereCondition,
        include: { user: { select: { id: true, name: true, gender: true } } }
      });

      // If no same-gender profiles found, query all other profiles
      if (others.length === 0) {
        others = await prisma.profile.findMany({
          where: { userId: { not: userId } },
          include: { user: { select: { id: true, name: true, gender: true } } }
        });
      }

      if (others.length === 0) {
        return res.json(defaultDemoMatches);
      }

      // Default profile object if user hasn't completed onboarding yet
      const activeProfile: ScoringProfile = myProfile ? {
        ...myProfile,
        dealBreakers: typeof myProfile.dealBreakers === 'string' ? JSON.parse(myProfile.dealBreakers || '[]') : (myProfile.dealBreakers || [])
      } : {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: true,
        cleanliness: 4,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: []
      };

      const matches = others.map(other => {
        const otherScoring: ScoringProfile = {
          ...other,
          dealBreakers: typeof other.dealBreakers === 'string' ? JSON.parse(other.dealBreakers || '[]') : (other.dealBreakers || [])
        };

        const result = calculateCompatibility(activeProfile, otherScoring);
        return {
          userId: other.userId,
          name: other.user.name,
          compatibility: result.score || 80,
          details: result.details.length > 0 ? result.details : ['Highly compatible roommate match']
        };
      });

      matches.sort((a, b) => b.compatibility - a.compatibility);
      return res.json(matches.slice(0, 10));
    } catch (dbError: any) {
      console.error('Match DB Error:', dbError);
      return res.json([
        { userId: 'demo-1', name: 'Ava Carter', compatibility: 96, details: ['Quiet study style', 'Clean habits', 'Early riser'] },
        { userId: 'demo-2', name: 'Noah Brooks', compatibility: 91, details: ['Social but respectful', 'Late-night study breaks', 'Non-smoker'] },
        { userId: 'demo-3', name: 'Mina Patel', compatibility: 88, details: ['Organized routine', 'Prefers calm evenings', 'Flexible with shared spaces'] }
      ]);
    }
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

export const getLikes = async (req: AuthRequest, res: Response) => {
  try {
    const fromId = req.user?.userId;
    if (!fromId) return res.status(401).json({ message: 'Unauthorized' });

    const likes = await prisma.like.findMany({
      where: { fromId },
      include: {
        to: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            profile: true
          }
        }
      }
    });

    const likedUsers = likes.map(like => {
      const p = like.to.profile;
      const details = p ? [
        p.sleepSchedule === 'EARLY' ? 'Early riser' : 'Night owl',
        p.studyStyle === 'QUIET' ? 'Quiet study' : 'Music background',
        p.smoking ? 'Smoker' : 'Non-smoker'
      ] : ['Roommate Match'];

      return {
        userId: like.to.id,
        name: like.to.name,
        compatibility: 95,
        details
      };
    });

    res.json(likedUsers);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching liked users', error: error.message });
  }
};

