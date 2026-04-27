import { Router } from 'express';
import { runAutoAssignment } from '../controllers/assignment.controller';
import { authenticateJWT, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Only Admins can trigger auto-assignment
router.post('/run', authenticateJWT, isAdmin, runAutoAssignment);

export default router;
