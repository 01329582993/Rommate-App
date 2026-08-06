import { Router } from 'express';
import { createGroup, getMyGroup, lockGroup, inviteToGroup, joinGroup, addMemberToGroup, removeMemberFromGroup, leaveGroup } from '../controllers/group.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/me', getMyGroup);
router.post('/create', createGroup);
router.post('/invite', inviteToGroup);
router.post('/join', joinGroup);
router.post('/leave', leaveGroup);
router.post('/members/add', addMemberToGroup);
router.post('/members/remove', removeMemberFromGroup);
router.post('/lock', lockGroup);

export default router;
