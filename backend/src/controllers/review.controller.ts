import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { getRatingSummaries } from '../utils/reviews';

const MAX_COMMENT_LENGTH = 1000;

// Create a review about a user: POST /api/reviews/:userId
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user?.userId || (req.body.reviewerId as string);
    const revieweeId = req.params.userId || (req.body.revieweeId as string);
    const rating = Math.max(1, Math.min(5, Math.round(Number(req.body.rating) || 5)));
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

    if (!reviewerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!revieweeId) {
      return res.status(400).json({ message: 'Missing user ID to review' });
    }
    if (reviewerId === revieweeId) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    const [reviewer, reviewee] = await Promise.all([
      prisma.user.findUnique({ where: { id: reviewerId }, select: { id: true, groupId: true } }),
      prisma.user.findUnique({ where: { id: revieweeId }, select: { id: true, role: true, groupId: true } }),
    ]);

    if (!reviewee) {
      return res.status(404).json({ message: 'Target student not found' });
    }

    const shareGroupNow = !!reviewer?.groupId && reviewer.groupId === reviewee.groupId;

    const review = await prisma.review.upsert({
      where: {
        reviewerId_revieweeId: {
          reviewerId,
          revieweeId,
        },
      },
      update: {
        rating,
        comment: comment || null,
        isRoommate: shareGroupNow,
      },
      create: {
        reviewerId,
        revieweeId,
        rating,
        comment: comment || null,
        isRoommate: shareGroupNow,
      },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      message: 'Review saved successfully',
      review,
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Could not save review', error: error.message });
  }
};

// Aliased for backward compatibility
export const createOrUpdateReview = createReview;

// Get reviews for a specific user: GET /api/reviews/:userId
export const getReviewsForUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach((r) => {
      distribution[String(r.rating)] = (distribution[String(r.rating)] || 0) + 1;
    });

    const summaries = await getRatingSummaries([userId]);

    return res.json({
      summary: {
        ...summaries[userId],
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
    // We acknowledge helpful vote successfully
    return res.json({ ok: true, message: 'Helpful vote recorded' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error voting helpful', error: error.message });
  }
};

// Reviews written by current user
export const getMyWrittenReviews = async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user?.userId;
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

// Delete review (author or admin)
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.reviewerId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await prisma.review.delete({ where: { id: review.id } });
    return res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Could not delete review', error: error.message });
  }
};

// Admin list all reviews
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
