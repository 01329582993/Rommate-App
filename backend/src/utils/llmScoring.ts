/**
 * llmScoring.ts  —  Rommify AI Layer
 * =====================================
 * Uses Google Gemini to enrich rule-based compatibility results with:
 *   1. A natural language "match narrative" explaining WHY two students
 *      are (or aren't) compatible in a friendly, human tone.
 *   2. 2–3 concrete roommate tips tailored to their specific mismatches.
 *   3. A personality archetype tag for each student ("The Night Scholar",
 *      "The Social Butterfly", etc.)
 *
 * Architecture — HYBRID approach:
 *   - Rule-based engine   → fast, deterministic, explainable 0–100 score
 *   - LLM (Gemini)        → rich narrative, tips, personality archetypes
 *
 * This gives us the best of both worlds:
 *   ✅ Deterministic scoring for fairness & reproducibility
 *   ✅ Human-friendly explanations powered by AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScoringProfile, CompatibilityResult } from './scoring';

// ── Init ─────────────────────────────────────────────────────────────────────
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface LLMEnrichedResult {
  /** The original deterministic score (0–100) */
  score: number;
  dealBreakerHit: boolean;

  /** AI-generated narrative explaining the match */
  matchNarrative: string;

  /** 2–3 actionable roommate tips from the AI */
  roommiateTips: string[];

  /** Personality archetype for student 1 */
  archetypeA: string;

  /** Personality archetype for student 2 */
  archetypeB: string;

  /** Original rule-based result */
  ruleBasedResult: CompatibilityResult;

  /** Whether LLM enrichment succeeded */
  llmEnriched: boolean;
}

// ── Prompt Builder ────────────────────────────────────────────────────────────

function buildPrompt(
  p1: ScoringProfile,
  p2: ScoringProfile,
  result: CompatibilityResult
): string {
  return `
You are Rommify's AI roommate advisor. You help university students understand their roommate compatibility in a friendly, insightful, and practical way.

You are given two student lifestyle profiles and their pre-calculated compatibility score of ${result.score}%.

## Student A Profile
- Sleep Schedule: ${p1.sleepSchedule}
- Noise Tolerance: ${p1.noiseTolerance}
- Smoker: ${p1.smoking ? 'Yes' : 'No'}, Smoke-tolerant: ${p1.smokingTolerant ? 'Yes' : 'No'}
- Cleanliness (1-5): ${p1.cleanliness}
- Study Style: ${p1.studyStyle}
- Room Temp Preference: ${p1.tempPreference}
- Social Level: ${p1.socialLevel}
${p1.guestFrequency ? `- Guest Frequency: ${p1.guestFrequency}` : ''}
${p1.petFriendly !== undefined ? `- Pet Friendly: ${p1.petFriendly}` : ''}

## Student B Profile
- Sleep Schedule: ${p2.sleepSchedule}
- Noise Tolerance: ${p2.noiseTolerance}
- Smoker: ${p2.smoking ? 'Yes' : 'No'}, Smoke-tolerant: ${p2.smokingTolerant ? 'Yes' : 'No'}
- Cleanliness (1-5): ${p2.cleanliness}
- Study Style: ${p2.studyStyle}
- Room Temp Preference: ${p2.tempPreference}
- Social Level: ${p2.socialLevel}
${p2.guestFrequency ? `- Guest Frequency: ${p2.guestFrequency}` : ''}
${p2.petFriendly !== undefined ? `- Pet Friendly: ${p2.petFriendly}` : ''}

## Compatibility Score: ${result.score}%
## Key Matches: ${result.details.join(', ')}
## Warnings: ${result.warnings?.join(', ') || 'None'}

Respond ONLY with valid JSON in this exact structure — no markdown, no extra text:

{
  "matchNarrative": "<2-3 sentences in a warm, conversational tone explaining why these two students match or don't, referencing their specific traits>",
  "roommiateTips": [
    "<Tip 1 — specific and actionable, referencing a real difference from above>",
    "<Tip 2>",
    "<Tip 3>"
  ],
  "archetypeA": "<A creative 2-4 word personality archetype for Student A, e.g. 'The Quiet Scholar' or 'The Social Owl'>",
  "archetypeB": "<A creative 2-4 word personality archetype for Student B>"
}
`.trim();
}

// ── Main Function ─────────────────────────────────────────────────────────────

/**
 * Enriches a rule-based compatibility result with AI-generated insights.
 * Falls back gracefully if the LLM call fails (no API key, quota, etc.)
 */
export async function enrichWithLLM(
  p1: ScoringProfile,
  p2: ScoringProfile,
  result: CompatibilityResult
): Promise<LLMEnrichedResult> {
  // Base fallback (no LLM)
  const fallback: LLMEnrichedResult = {
    score: result.score,
    dealBreakerHit: result.dealBreakerHit,
    matchNarrative: result.details.join('. ') + '.',
    roommiateTips: result.warnings?.length
      ? result.warnings
      : ['Discuss daily schedules early', 'Set shared cleaning expectations', 'Agree on guest policies'],
    archetypeA: getLabelFromProfile(p1),
    archetypeB: getLabelFromProfile(p2),
    ruleBasedResult: result,
    llmEnriched: false,
  };

  // If no API key, return fallback immediately
  if (!process.env.GEMINI_API_KEY) {
    return fallback;
  }

  // Deal-breaker — no need for AI narrative
  if (result.dealBreakerHit) {
    return {
      ...fallback,
      matchNarrative: 'Unfortunately, this pairing has a fundamental incompatibility around smoking preferences. It\'s best to look for a more suitable match.',
      roommiateTips: ['Look for smoke-tolerant roommates', 'Be upfront about smoking in your profile', 'Consider requesting a single room'],
      llmEnriched: false,
    };
  }

  try {
    const prompt = buildPrompt(p1, p2, result);
    const model = getGeminiModel();
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();

    // Strip markdown code fences if Gemini returns ```json ... ```
    const cleanedText = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    // Parse the JSON response
    const parsed = JSON.parse(cleanedText);

    return {
      score: result.score,
      dealBreakerHit: false,
      matchNarrative: parsed.matchNarrative || fallback.matchNarrative,
      roommiateTips: Array.isArray(parsed.roommiateTips)
        ? parsed.roommiateTips.slice(0, 3)
        : fallback.roommiateTips,
      archetypeA: parsed.archetypeA || fallback.archetypeA,
      archetypeB: parsed.archetypeB || fallback.archetypeB,
      ruleBasedResult: result,
      llmEnriched: true,
    };
  } catch (err) {
    console.warn('[Rommify AI] LLM enrichment failed, using rule-based fallback:', err);
    return fallback;
  }
}

// ── Simple Archetype (Fallback) ───────────────────────────────────────────────
function getLabelFromProfile(p: ScoringProfile): string {
  if (p.sleepSchedule === 'EARLY' && p.socialLevel === 'INTROVERT') return 'The Quiet Early Bird';
  if (p.sleepSchedule === 'LATE'  && p.socialLevel === 'EXTROVERT') return 'The Night Social Owl';
  if (p.studyStyle === 'QUIET'    && p.cleanliness >= 4)            return 'The Focused Scholar';
  if (p.studyStyle === 'GROUP'    && p.socialLevel === 'EXTROVERT') return 'The Social Butterfly';
  if (p.sleepSchedule === 'LATE'  && p.studyStyle === 'MUSIC')      return 'The Creative Night Owl';
  if (p.cleanliness >= 5)                                           return 'The Neat Organizer';
  return 'The Balanced Roommate';
}
