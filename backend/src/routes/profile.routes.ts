import { Router } from 'express';
import { createOrUpdateProfile, getMyProfile, getUserProfile } from '../controllers/profile.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/me', getMyProfile);
router.get('/user/:userId', getUserProfile);
router.post('/', createOrUpdateProfile);

export default router;
