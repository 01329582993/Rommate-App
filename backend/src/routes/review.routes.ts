import { Router } from 'express';
import {
  getReviewsForUser,
  createReview,
  voteHelpful,
  getMyWrittenReviews,
  deleteReview,
  listAllReviews,
} from '../controllers/review.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Current user's reviews (must precede parameterized routes)
router.get('/mine', authenticateJWT, getMyWrittenReviews);

// Helpful vote on a review
router.post('/helpful/:reviewId', authenticateJWT, voteHelpful);

// Reviews for a specific user (/api/reviews/user/:userId or /api/reviews/:userId)
router.get('/user/:userId', getReviewsForUser);
router.get('/:userId', getReviewsForUser);

// List all reviews
router.get('/', listAllReviews);

// Create or update review (POST /api/reviews or POST /api/reviews/:userId)
router.post('/', authenticateJWT, createReview);
router.post('/:userId', authenticateJWT, createReview);

// Delete review
router.delete('/:id', authenticateJWT, deleteReview);

export default router;
