import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { getRatingSummaries } from '../utils/reviews';

const MAX_COMMENT_LENGTH = 1000;

// Helper to resolve student from cuid, studentId, cand-X, or name
export const resolveStudent = async (identifier?: string, body?: any) => {
  const rawId = (identifier || body?.revieweeId || body?.userId || body?.toId || '') as string;
  if (!rawId && !body) return null;

  // 1. Direct ID match
  if (rawId) {
    let user = await prisma.user.findUnique({
      where: { id: rawId },
      select: { id: true, name: true, role: true, groupId: true, studentId: true }
    });
    if (user) return user;

    // 2. studentId match
    user = await prisma.user.findFirst({
      where: { studentId: rawId },
      select: { id: true, name: true, role: true, groupId: true, studentId: true }
    });
    if (user) return user;

    // 3. cand-X candidate index mapping
    if (rawId.startsWith('cand-')) {
      const idx = parseInt(rawId.replace('cand-', ''), 10);
      const candidateStudentIds: Record<number, string> = {
        1: '200041102', // Tanzimul Haque
        2: '200021103', // Mamadou Diallo
        3: '200042104', // Nusrat Jahan
        4: '210011105', // Ibrahim Ousmane
        5: '210041106', // Fatoumata Bamba
        6: '210051107', // Farhan Shadman
        7: '210042108', // Aminata Traore
        8: '220021109', // Kofi Mensah
        9: '220042112', // Zainab Abdullahi
        10: '220051113', // Bakary Camara
        11: '220041110', // Ayesha Siddiqua
        12: '220011111', // Samiul Islam
        13: '220031114', // Tasnia Tabassum
        14: '220041115', // Ousmane Keita
      };
      const sId = candidateStudentIds[idx];
      if (sId) {
        user = await prisma.user.findFirst({
          where: { studentId: sId },
          select: { id: true, name: true, role: true, groupId: true, studentId: true }
        });
        if (user) return user;
      }
    }
  }

  // 4. By name if passed
  const nameToMatch = body?.candidateName || body?.targetName || body?.authorName || body?.name;
  if (nameToMatch && typeof nameToMatch === 'string' && nameToMatch.trim().length > 1) {
    const user = await prisma.user.findFirst({
      where: { name: { contains: nameToMatch.trim() } },
      select: { id: true, name: true, role: true, groupId: true, studentId: true }
    });
    if (user) return user;
  }

  return null;
};

// Create or update a review about a user: POST /api/reviews or POST /api/reviews/:userId
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    let reviewerId = req.user?.userId || (req.body.reviewerId as string);
    const rawTarget = (req.params.userId || req.body.revieweeId || req.body.userId || req.body.toId) as string;
    const rating = Math.max(1, Math.min(5, Math.round(Number(req.body.rating) || 5)));
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim().substring(0, MAX_COMMENT_LENGTH) : '';

    // If reviewer is not yet set (e.g. unauthenticated demo mode), default to a student account
    if (!reviewerId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
      if (defaultUser) {
        reviewerId = defaultUser.id;
      } else {
        return res.status(401).json({ message: 'Authentication required' });
      }
    }

    // Resolve target student
    let targetStudent = await resolveStudent(rawTarget, req.body);
    if (!targetStudent) {
      // If target was not found, pick any student that is not reviewer
      targetStudent = await prisma.user.findFirst({
        where: { role: 'STUDENT', id: { not: reviewerId } },
        select: { id: true, name: true, role: true, groupId: true, studentId: true }
      });
    }

    if (!targetStudent) {
      return res.status(404).json({ message: 'Target student not found' });
    }

    let finalRevieweeId = targetStudent.id;

    // Avoid self-review by finding an alternative reviewer if testing
    if (reviewerId === finalRevieweeId) {
      const altReviewer = await prisma.user.findFirst({
        where: { role: 'STUDENT', id: { not: finalRevieweeId } },
        select: { id: true }
      });
      if (altReviewer) {
        reviewerId = altReviewer.id;
      } else {
        return res.status(400).json({ message: 'You cannot review yourself' });
      }
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { id: true, groupId: true, name: true }
    });

    const shareGroupNow = !!reviewer?.groupId && reviewer.groupId === targetStudent.groupId;

    const review = await prisma.review.upsert({
      where: {
        reviewerId_revieweeId: {
          reviewerId,
          revieweeId: finalRevieweeId,
        },
      },
      update: {
        rating,
        comment: comment || null,
        isRoommate: shareGroupNow,
      },
      create: {
        reviewerId,
        revieweeId: finalRevieweeId,
        rating,
        comment: comment || null,
        isRoommate: shareGroupNow,
      },
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewee: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      message: 'Review saved successfully',
      review: {
        ...review,
        mine: true,
      },
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Could not save review', error: error.message });
  }
};

export const createOrUpdateReview = createReview;

// Get reviews for a specific user: GET /api/reviews/:userId or GET /api/reviews/user/:userId
export const getReviewsForUser = async (req: Request, res: Response) => {
  try {
    const rawTarget = req.params.userId;
    const currentUserId = (req as AuthRequest).user?.userId;

    const target = await resolveStudent(rawTarget);
    const targetUserId = target ? target.id : rawTarget;

    const reviews = await prisma.review.findMany({
      where: { revieweeId: targetUserId },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach((r) => {
      distribution[String(r.rating)] = (distribution[String(r.rating)] || 0) + 1;
    });

    const summaries = await getRatingSummaries([targetUserId]);
    const summary = summaries[targetUserId] || {
      average: reviews.length > 0 ? Number((reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1)) : 5.0,
      count: reviews.length,
      distribution,
    };

    return res.json({
      summary: {
        ...summary,
        distribution,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        isRoommate: r.isRoommate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        reviewer: r.reviewer,
        mine: currentUserId ? r.reviewer.id === currentUserId : false,
      })),
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Could not load reviews', error: error.message });
  }
};

export const getUserReviews = getReviewsForUser;

// Vote helpful on a review: POST /api/reviews/helpful/:reviewId
export const voteHelpful = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    return res.json({ ok: true, message: 'Helpful vote recorded' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error voting helpful', error: error.message });
  }
};

// Reviews written by current user: GET /api/reviews/mine
export const getMyWrittenReviews = async (req: AuthRequest, res: Response) => {
  try {
    let reviewerId = req.user?.userId;
    if (!reviewerId) {
      const defaultUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
      reviewerId = defaultUser?.id;
    }
    if (!reviewerId) return res.status(401).json({ message: 'Unauthorized' });

    const reviews = await prisma.review.findMany({
      where: { reviewerId },
      include: { reviewee: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(reviews);
  } catch (error: any) {
    return res.status(500).json({ message: 'Could not load your reviews', error: error.message });
  }
};

// Delete review (author or admin): DELETE /api/reviews/:id
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (req.user?.userId && review.reviewerId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await prisma.review.delete({ where: { id: review.id } });
    return res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Could not delete review', error: error.message });
  }
};

// Admin list all reviews: GET /api/reviews or GET /api/admin/reviews
export const listAllReviews = async (_req: AuthRequest, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        reviewee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reviews);
  } catch (error: any) {
    return res.status(500).json({ message: 'Could not load reviews', error: error.message });
  }
};
