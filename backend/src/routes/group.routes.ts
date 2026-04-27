import { Router } from 'express';
import { createGroup, getMyGroup, lockGroup, inviteToGroup } from '../controllers/group.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/me', getMyGroup);
router.post('/create', createGroup);
router.post('/invite', inviteToGroup);
router.post('/lock', lockGroup);

export default router;
