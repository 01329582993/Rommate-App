/**
 * Rommify Compatibility Scoring Engine
 * ======================================
 * Compares two student profiles across weighted lifestyle categories
 * and applies strict deal-breaker rules to produce a 0–100 compatibility score.
 *
 * Categories & Weights:
 *   - Sleep Schedule       → 20 pts
 *   - Cleanliness          → 25 pts
 *   - Study / Noise        → 20 pts
 *   - Social Level         → 20 pts
 *   - Temperature Pref     → 15 pts
 *
 * Deal Breakers (instant 0% score):
 *   - Smoker paired with smoke-intolerant roommate
 */

export interface ScoringProfile {
  sleepSchedule: string;    // "EARLY" | "LATE"
  noiseTolerance: string;   // "LOW" | "MEDIUM" | "HIGH"
  smoking: boolean;
  smokingTolerant: boolean;
  cleanliness: number;      // 1 (messy) – 5 (very clean)
  studyStyle: string;       // "QUIET" | "MUSIC" | "GROUP"
  tempPreference: string;   // "COLD" | "MEDIUM" | "WARM"
  socialLevel: string;      // "INTROVERT" | "EXTROVERT" | "AMBIVERT"
  dealBreakers?: string[];
  guestFrequency?: string;  // "RARELY" | "SOMETIMES" | "OFTEN"
  petFriendly?: boolean;
}

export type Profile = ScoringProfile;

export interface CompatibilityResult {
  score: number;          // Final 0–100 score
  dealBreakerHit: boolean;
  breakdown: {
    lifestyle: number;    // Sleep + Temp (0–100)
    cleanliness: number;  // Chore expectations (0–100)
    socializing: number;  // Social + Study/Noise (0–100)
  };
  details: string[];
  reasons: Array<{
    title: string;
    description: string;
    type: 'smoke' | 'study' | 'clean' | 'sleep' | 'social' | 'temp' | 'guest' | 'pet';
    positive: boolean;
  }>;
  warnings: string[];
}

// ─── Weights ────────────────────────────────────────────────────────────────
const WEIGHT_SLEEP   = 20;
const WEIGHT_CLEAN   = 25;
const WEIGHT_STUDY   = 10;
const WEIGHT_NOISE   = 10;
const WEIGHT_SOCIAL  = 20;
const WEIGHT_TEMP    = 15;
// Total max = 100

// ─── Main Function ───────────────────────────────────────────────────────────
export const calculateCompatibility = (
  p1: ScoringProfile,
  p2: ScoringProfile
): CompatibilityResult => {
  let totalScore = 0;
  const details: string[] = [];
  const warnings: string[] = [];
  const reasons: CompatibilityResult['reasons'] = [];

  // ── DEAL BREAKER: Smoking ─────────────────────────────────────────────────
  if ((p1.smoking && !p2.smokingTolerant) || (p2.smoking && !p1.smokingTolerant)) {
    return {
      score: 0,
      dealBreakerHit: true,
      breakdown: { lifestyle: 0, cleanliness: 0, socializing: 0 },
      details: ['Critical deal-breaker: Smoking vs. smoke-free preference'],
      warnings: ['One roommate smokes and the other has zero tolerance.'],
      reasons: [{
        title: 'Smoking Conflict',
        description: 'One person smokes and the other requires a smoke-free space. This is a fundamental incompatibility.',
        type: 'smoke',
        positive: false
      }]
    };
  }

  // Smoke-free bonus
  if (!p1.smoking && !p2.smoking) {
    reasons.push({
      title: 'Smoke-Free Lifestyle ✓',
      description: 'Both prefer a clean, smoke-free living environment.',
      type: 'smoke',
      positive: true
    });
  }

  // ── 1. SLEEP SCHEDULE (20 pts) ────────────────────────────────────────────
  let sleepScore = 0;
  if (p1.sleepSchedule === p2.sleepSchedule) {
    sleepScore = WEIGHT_SLEEP;
    const label = p1.sleepSchedule === 'EARLY'
      ? 'Early Birds 🌅 (before 7 am)'
      : 'Night Owls 🌙 (after midnight)';
    details.push(`Synchronized sleep cycles — ${label}`);
    reasons.push({
      title: 'Sleep Schedule Sync ✓',
      description: `Both are ${label}. No late-night light disturbances.`,
      type: 'sleep',
      positive: true
    });
  } else {
    sleepScore = 8;
    warnings.push('Different sleep schedules — set quiet hours agreement early on.');
    details.push('Mismatched sleep schedule — quiet hours negotiation recommended');
  }
  totalScore += sleepScore;

  // ── 2. CLEANLINESS (25 pts) ───────────────────────────────────────────────
  let cleanScore = 0;
  const diffClean = Math.abs(p1.cleanliness - p2.cleanliness);
  if (diffClean === 0) {
    cleanScore = WEIGHT_CLEAN;
    details.push('Identical cleanliness standards — shared chore expectations');
    reasons.push({
      title: 'Cleanliness Match ✓',
      description: 'Mutual commitment to a tidy space and shared chore schedule.',
      type: 'clean',
      positive: true
    });
  } else if (diffClean === 1) {
    cleanScore = 20;
    details.push('Very similar cleanliness standards');
    reasons.push({
      title: 'Near-Perfect Cleanliness ✓',
      description: 'High overlap in room maintenance expectations.',
      type: 'clean',
      positive: true
    });
  } else if (diffClean === 2) {
    cleanScore = 12;
    warnings.push('Some difference in cleanliness — set a weekly cleaning schedule.');
    details.push('Manageable chore balance with communication');
  } else {
    cleanScore = 4;
    warnings.push('Significant cleanliness gap — this often causes friction.');
    details.push('Very different expectations on daily tidiness');
    reasons.push({
      title: 'Cleanliness Gap ⚠️',
      description: 'You have different standards for how clean the shared space should be.',
      type: 'clean',
      positive: false
    });
  }
  totalScore += cleanScore;

  // ── 3. STUDY HABITS & NOISE (20 pts) ─────────────────────────────────────
  let studyScore = 0;
  if (p1.studyStyle === p2.studyStyle) {
    studyScore += WEIGHT_STUDY;
    const studyLabel = p1.studyStyle === 'QUIET'
      ? 'quiet focus sessions'
      : p1.studyStyle === 'MUSIC'
      ? 'music-friendly study atmosphere'
      : 'group study sessions';
    details.push(`Both prefer ${studyLabel}`);
    reasons.push({
      title: 'Study Habits Match ✓',
      description: `Both enjoy ${studyLabel}.`,
      type: 'study',
      positive: true
    });
  } else {
    studyScore += 5;
  }

  if (p1.noiseTolerance === p2.noiseTolerance) {
    studyScore += WEIGHT_NOISE;
    details.push(`Matching noise tolerance — both prefer ${p1.noiseTolerance.toLowerCase()} noise levels`);
  } else {
    studyScore += 4;
    const higher = p1.noiseTolerance > p2.noiseTolerance ? 'Person 1' : 'Person 2';
    warnings.push(`Different noise preferences — ${higher} has higher tolerance.`);
  }
  totalScore += studyScore;

  // ── 4. SOCIAL LEVEL (20 pts) ──────────────────────────────────────────────
  let socialScore = 0;
  if (p1.socialLevel === p2.socialLevel) {
    socialScore = WEIGHT_SOCIAL;
    details.push(`Complementary ${p1.socialLevel.toLowerCase()} social energy`);
    reasons.push({
      title: 'Social Energy Match ✓',
      description: p1.socialLevel === 'INTROVERT'
        ? 'Both appreciate personal space and calm evening downtime.'
        : p1.socialLevel === 'EXTROVERT'
        ? 'Both love an energetic, friendly home environment.'
        : 'Both balance social time and alone time naturally.',
      type: 'social',
      positive: true
    });
  } else if (
    (p1.socialLevel === 'AMBIVERT') ||
    (p2.socialLevel === 'AMBIVERT')
  ) {
    socialScore = 15; // ambivert adapts well
    details.push('Good social balance — ambivert flexibility helps');
  } else {
    socialScore = 10;
    warnings.push('Different social energy levels — discuss guest and party boundaries.');
    details.push('Different social preferences — open communication is key');
    reasons.push({
      title: 'Social Energy Difference',
      description: 'One person is more social than the other — establish shared expectations for guests.',
      type: 'social',
      positive: false
    });
  }
  totalScore += socialScore;

  // ── 5. TEMPERATURE PREFERENCE (15 pts) ───────────────────────────────────
  let tempScore = 0;
  if (p1.tempPreference === p2.tempPreference) {
    tempScore = WEIGHT_TEMP;
    details.push(`Matching room temperature preference — both prefer ${p1.tempPreference.toLowerCase()}`);
    reasons.push({
      title: 'Temperature Comfort ✓',
      description: `You both prefer a ${p1.tempPreference.toLowerCase()} room — no thermostat wars!`,
      type: 'temp',
      positive: true
    });
  } else {
    tempScore = 7;
    warnings.push('Different temperature preferences — thermostat compromise needed.');
    details.push('Temperature preferences differ — compromise recommended');
  }
  totalScore += tempScore;

  // ── BONUS: Guest Frequency ────────────────────────────────────────────────
  if (p1.guestFrequency && p2.guestFrequency && p1.guestFrequency === p2.guestFrequency) {
    reasons.push({
      title: 'Guest Policy Agreement ✓',
      description: 'Both have the same expectations for having guests over.',
      type: 'guest',
      positive: true
    });
  }

  // ── BONUS: Pet Friendly ───────────────────────────────────────────────────
  if (p1.petFriendly !== undefined && p2.petFriendly !== undefined) {
    if (p1.petFriendly === p2.petFriendly) {
      reasons.push({
        title: 'Pet Preference Aligned ✓',
        description: p1.petFriendly ? 'Both are pet-friendly.' : 'Neither wants pets in the space.',
        type: 'pet',
        positive: true
      });
    } else {
      warnings.push('Different pet preferences — discuss before signing a lease.');
    }
  }

  // ── FINAL SCORE CALCULATION ───────────────────────────────────────────────
  // Cap to realistic range: 50 minimum if no deal-breaker, 99 max
  const rawScore = Math.round(totalScore);
  const finalScore = Math.max(50, Math.min(99, rawScore));

  // Category breakdowns (0–100%)
  const lifestylePercentage  = Math.min(100, Math.round(((sleepScore + tempScore) / (WEIGHT_SLEEP + WEIGHT_TEMP)) * 100));
  const cleanlinessPercentage = Math.min(100, Math.round((cleanScore / WEIGHT_CLEAN) * 100));
  const socializingPercentage = Math.min(100, Math.round(((studyScore + socialScore) / (WEIGHT_STUDY + WEIGHT_NOISE + WEIGHT_SOCIAL)) * 100));

  return {
    score: finalScore,
    dealBreakerHit: false,
    breakdown: {
      lifestyle: lifestylePercentage,
      cleanliness: cleanlinessPercentage,
      socializing: socializingPercentage,
    },
    details,
    warnings,
    reasons,
  };
};
