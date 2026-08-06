import { Router } from 'express';
import { getGroupMessages, getDirectMessages, getConversations } from '../controllers/message.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all message routes
router.use(authenticateJWT);

router.get('/conversations', getConversations);
router.get('/group/:groupId', getGroupMessages);
router.get('/direct/:userId', getDirectMessages);

export default router;
