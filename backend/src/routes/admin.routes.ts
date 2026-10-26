import { Router } from 'express';
import multer from 'multer';
import { runAutoAssignment } from '../controllers/assignment.controller';
import {
  getStudents,
  uploadStudents,
  getGroups,
  getGroupDetails,
  confirmRoomAssignment,
  denyRoomAssignment,
  sendAdminGroupMessage,
  getAdminGroupMessages,
} from '../controllers/admin.controller';
import { listAllReviews, deleteReview } from '../controllers/review.controller';
import { authenticateJWT, isAdmin } from '../middleware/auth.middleware';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// Only Admins can trigger auto-assignment
router.post('/run', authenticateJWT, isAdmin, runAutoAssignment);

// Admin student management
router.get('/students', authenticateJWT, isAdmin, getStudents);
router.post('/upload', authenticateJWT, isAdmin, upload.single('file'), uploadStudents);

// Room/group compatibility monitoring & actions
router.get('/groups', authenticateJWT, isAdmin, getGroups);
router.get('/groups/:groupId', authenticateJWT, isAdmin, getGroupDetails);
router.post('/groups/:groupId/confirm', authenticateJWT, isAdmin, confirmRoomAssignment);
router.post('/groups/:groupId/deny', authenticateJWT, isAdmin, denyRoomAssignment);

// Admin Group Chat Messaging
router.get('/groups/:groupId/messages', authenticateJWT, isAdmin, getAdminGroupMessages);
router.post('/groups/:groupId/message', authenticateJWT, isAdmin, sendAdminGroupMessage);

// Review moderation
router.get('/reviews', authenticateJWT, isAdmin, listAllReviews);
router.delete('/reviews/:id', authenticateJWT, isAdmin, deleteReview);

export default router;
