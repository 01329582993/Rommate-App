import { Router } from 'express';
import { getUserProfile } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/:id', getUserProfile);

export default router;
