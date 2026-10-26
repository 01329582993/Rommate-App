/**
 * aiMatch.routes.ts
 * ─────────────────
 * Routes for Rommify's AI-powered match endpoints
 *
 * POST /api/match/ai/profiles  — compare two profiles directly
 * POST /api/match/ai/users     — compare two users by database ID
 */

import { Router } from 'express';
import { compareProfilesWithAI, compareUsersWithAI } from '../controllers/aiMatch.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/match/ai/profiles
 * Body: { profileA: ScoringProfile, profileB: ScoringProfile }
 */
router.post('/profiles', authenticateJWT, compareProfilesWithAI);

/**
 * POST /api/match/ai/users
 * Body: { userIdA: string, userIdB: string }
 */
router.post('/users', authenticateJWT, compareUsersWithAI);

export default router;
