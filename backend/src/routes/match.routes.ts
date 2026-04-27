import { Router } from 'express';
import { getMatches, likeUser } from '../controllers/match.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getMatches);
router.post('/like', likeUser);

export default router;
