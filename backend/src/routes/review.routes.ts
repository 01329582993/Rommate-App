import { Router } from 'express';
import { getReviewsForUser, createReview, voteHelpful } from '../controllers/review.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Publicly readable reviews
router.get('/:userId', getReviewsForUser);

// Authenticated actions
router.post('/:userId', authenticateJWT, createReview);
router.post('/helpful/:reviewId', authenticateJWT, voteHelpful);

export default router;
