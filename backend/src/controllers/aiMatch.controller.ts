/**
 * aiMatch.controller.ts
 * ─────────────────────
 * POST /api/match/ai
 *
 * Accepts two student profile objects and returns:
 *   - The deterministic compatibility score (rule-based)
 *   - An AI-generated match narrative (Gemini)
 *   - Personality archetypes for each student
 *   - Actionable roommate tips
 *
 * This endpoint demonstrates Rommify's hybrid AI+rule-based approach.
 */

import { Request, Response } from 'express';
import { calculateCompatibility, ScoringProfile } from '../utils/scoring';
import { enrichWithLLM } from '../utils/llmScoring';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helper: map Prisma user to ScoringProfile ─────────────────────────────────
function userToScoringProfile(user: any): ScoringProfile | null {
  if (!user?.preferences) return null;
  const p = user.preferences;
  return {
    sleepSchedule:  p.sleepSchedule  || 'EARLY',
    noiseTolerance: p.noiseTolerance || 'MEDIUM',
    smoking:        p.smoking        ?? false,
    smokingTolerant: p.smokingTolerant ?? true,
    cleanliness:    p.cleanliness    ?? 3,
    studyStyle:     p.studyStyle     || 'QUIET',
    tempPreference: p.tempPreference || 'MEDIUM',
    socialLevel:    p.socialLevel    || 'AMBIVERT',
    guestFrequency: p.guestFrequency,
    petFriendly:    p.petFriendly,
  };
}

// ── POST /api/match/ai/profiles ───────────────────────────────────────────────
/**
 * Direct profile comparison — pass two profiles in the body.
 * Useful for real-time UI demo or testing.
 *
 * Body: { profileA: ScoringProfile, profileB: ScoringProfile }
 */
export const compareProfilesWithAI = async (req: Request, res: Response) => {
  try {
    const { profileA, profileB } = req.body;

    if (!profileA || !profileB) {
      return res.status(400).json({
        error: 'Both profileA and profileB are required in the request body.'
      });
    }

    // Step 1: Fast rule-based scoring
    const ruleResult = calculateCompatibility(profileA as ScoringProfile, profileB as ScoringProfile);

    // Step 2: LLM enrichment (async, falls back gracefully)
    const enrichedResult = await enrichWithLLM(
      profileA as ScoringProfile,
      profileB as ScoringProfile,
      ruleResult
    );

    return res.json({
      success: true,
      ...enrichedResult,
    });
  } catch (err: any) {
    console.error('[aiMatch] compareProfilesWithAI error:', err);
    return res.status(500).json({ error: 'Failed to compute AI match', details: err.message });
  }
};

// ── POST /api/match/ai/users ──────────────────────────────────────────────────
/**
 * Compare two users by their IDs from the database.
 *
 * Body: { userIdA: string, userIdB: string }
 */
export const compareUsersWithAI = async (req: Request, res: Response) => {
  try {
    const { userIdA, userIdB } = req.body;

    if (!userIdA || !userIdB) {
      return res.status(400).json({ error: 'Both userIdA and userIdB are required.' });
    }

    // Fetch both users with their preferences
    const [userA, userB] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userIdA },
        include: { preferences: true }
      }),
      prisma.user.findUnique({
        where: { id: userIdB },
        include: { preferences: true }
      }),
    ]);

    if (!userA) return res.status(404).json({ error: `User ${userIdA} not found.` });
    if (!userB) return res.status(404).json({ error: `User ${userIdB} not found.` });

    const profileA = userToScoringProfile(userA);
    const profileB = userToScoringProfile(userB);

    if (!profileA) return res.status(400).json({ error: `User ${userIdA} has no preferences set.` });
    if (!profileB) return res.status(400).json({ error: `User ${userIdB} has no preferences set.` });

    // Step 1: Rule-based scoring
    const ruleResult = calculateCompatibility(profileA, profileB);

    // Step 2: LLM enrichment
    const enrichedResult = await enrichWithLLM(profileA, profileB, ruleResult);

    return res.json({
      success: true,
      users: {
        a: { id: userA.id, name: userA.name, archetype: enrichedResult.archetypeA },
        b: { id: userB.id, name: userB.name, archetype: enrichedResult.archetypeB },
      },
      ...enrichedResult,
    });
  } catch (err: any) {
    console.error('[aiMatch] compareUsersWithAI error:', err);
    return res.status(500).json({ error: 'Failed to compute AI match', details: err.message });
  }
};
