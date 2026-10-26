import { Router } from 'express';
import { getMatches, likeUser, passUser, getLikedProfiles } from '../controllers/match.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getMatches);
router.get('/likes', getLikedProfiles);
router.post('/like', likeUser);
router.post('/pass', passUser);

export default router;
