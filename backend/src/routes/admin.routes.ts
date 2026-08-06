import { Router } from 'express';
import multer from 'multer';
import { runAutoAssignment } from '../controllers/assignment.controller';
import { getStudents, uploadStudents } from '../controllers/admin.controller';
import { authenticateJWT, isAdmin } from '../middleware/auth.middleware';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// Only Admins can trigger auto-assignment
router.post('/run', authenticateJWT, isAdmin, runAutoAssignment);

// Admin student management
router.get('/students', authenticateJWT, isAdmin, getStudents);
router.post('/upload', authenticateJWT, isAdmin, upload.single('file'), uploadStudents);

export default router;
