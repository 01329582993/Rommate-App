import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { calculateCompatibility } from '../utils/scoring';
import { getRatingSummaries } from '../utils/reviews';

const parseDealBreakers = (raw: any): string[] => {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
};

// Public view of another student: what they've shared + how well you match + their reviews.
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user!.userId;
    const { id } = req.params;

    const target = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, group: { select: { id: true, name: true } } },
    });
    if (!target || target.role !== 'STUDENT') return res.status(404).json({ message: 'User not found' });

    const me = await prisma.user.findUnique({ where: { id: myId }, include: { profile: true } });
    const isMe = id === myId;

    let compatibility: number | null = null;
    let compatibilityDetails: string[] = [];
    if (!isMe && me?.profile && target.profile) {
      const result = calculateCompatibility(
        { ...me.profile, dealBreakers: parseDealBreakers(me.profile.dealBreakers) },
        { ...target.profile, dealBreakers: parseDealBreakers(target.profile.dealBreakers) }
      );
      compatibility = result.score;
      compatibilityDetails = result.details;
    }

    const [summaries, myReview, like] = await Promise.all([
      getRatingSummaries([id]),
      isMe ? null : prisma.review.findUnique({ where: { reviewerId_revieweeId: { reviewerId: myId, revieweeId: id } } }),
      isMe ? null : prisma.like.findUnique({ where: { fromId_toId: { fromId: myId, toId: id } } }),
    ]);

    const p = target.profile;
    res.json({
      id: target.id,
      name: target.name,
      gender: target.gender,
      isMe,
      bio: p?.bio || '',
      profile: p
        ? {
            sleepSchedule: p.sleepSchedule,
            noiseTolerance: p.noiseTolerance,
            smoking: p.smoking,
            cleanliness: p.cleanliness,
            studyStyle: p.studyStyle,
            tempPreference: p.tempPreference,
            socialLevel: p.socialLevel,
          }
        : null,
      compatibility,
      compatibilityDetails,
      rating: summaries[id],
      liked: !!like,
      isMutual: !!like?.isMutual,
      sharesGroup: !!me?.groupId && me.groupId === target.groupId,
      group: target.group ? { id: target.group.id, name: target.group.name } : null,
      myReview: myReview ? { id: myReview.id, rating: myReview.rating, comment: myReview.comment } : null,
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Could not load this profile' });
  }
};
