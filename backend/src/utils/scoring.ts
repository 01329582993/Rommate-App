export interface ScoringProfile {
  sleepSchedule: string;      // "EARLY" | "LATE"
  noiseTolerance: string;     // "LOW" | "MEDIUM" | "HIGH"
  smoking: boolean;
  smokingTolerant: boolean;
  cleanliness: number;        // 1 - 5
  studyStyle: string;         // "QUIET" | "MUSIC" | "GROUP"
  tempPreference: string;     // "COLD" | "MEDIUM" | "WARM"
  socialLevel: string;        // "INTROVERT" | "EXTROVERT"
  dealBreakers?: string[];
}

export type Profile = ScoringProfile;

export interface CompatibilityResult {
  score: number;
  breakdown: {
    lifestyle: number;
    cleanliness: number;
    socializing: number;
  };
  details: string[];
  reasons: Array<{
    title: string;
    description: string;
    type: 'smoke' | 'study' | 'clean' | 'sleep' | 'social';
  }>;
}

export const calculateCompatibility = (p1: ScoringProfile, p2: ScoringProfile): CompatibilityResult => {
  let totalScore = 0;
  let maxPossibleScore = 100;
  const details: string[] = [];
  const reasons: CompatibilityResult['reasons'] = [];

  // 1. Strict Deal-Breaker: Smoking Compatibility
  if (p1.smoking && !p2.smokingTolerant) {
    return {
      score: 0,
      breakdown: { lifestyle: 0, cleanliness: 0, socializing: 0 },
      details: ["Critical dealbreaker: Smoking intolerance"],
      reasons: []
    };
  }
  if (p2.smoking && !p1.smokingTolerant) {
    return {
      score: 0,
      breakdown: { lifestyle: 0, cleanliness: 0, socializing: 0 },
      details: ["Critical dealbreaker: Smoking intolerance"],
      reasons: []
    };
  }

  // If both smoke-free, award bonus insight
  if (!p1.smoking && !p2.smoking) {
    reasons.push({
      title: 'Smoke-free lifestyle',
      description: 'Both of you prefer a clean, smoke-free air environment.',
      type: 'smoke'
    });
  }

  // 2. Sleep Schedule Alignment (Weight: 20 pts)
  let sleepScore = 0;
  if (p1.sleepSchedule === p2.sleepSchedule) {
    sleepScore = 20;
    const label = p1.sleepSchedule === 'EARLY' ? 'Early Birds [7am - 8am]' : 'Night Owls [after midnight]';
    details.push(`Synchronized sleep cycle (${label})`);
    reasons.push({
      title: 'Sleep Schedule Sync',
      description: `Both are ${label}.`,
      type: 'sleep'
    });
  } else {
    sleepScore = 8;
    details.push("Compatible sleep schedules with mutual quiet hours");
  }
  totalScore += sleepScore;

  // 3. Cleanliness Harmony (Weight: 25 pts)
  let cleanScore = 0;
  const diffClean = Math.abs(p1.cleanliness - p2.cleanliness);
  if (diffClean === 0) {
    cleanScore = 25;
    details.push("Identical cleanliness and chore standards");
    reasons.push({
      title: 'Cleanliness Level',
      description: 'Mutual commitment to a tidy common space and shared chore schedule.',
      type: 'clean'
    });
  } else if (diffClean === 1) {
    cleanScore = 20;
    details.push("Very close cleanliness standards");
    reasons.push({
      title: 'Cleanliness Standards',
      description: 'High overlap in room cleanliness and maintenance expectations.',
      type: 'clean'
    });
  } else if (diffClean === 2) {
    cleanScore = 12;
    details.push("Manageable chore balance");
  } else {
    cleanScore = 4;
    details.push("Different expectations on daily chores");
  }
  totalScore += cleanScore;

  // 4. Study Habits & Noise Tolerance (Weight: 20 pts)
  let studyScore = 0;
  if (p1.studyStyle === p2.studyStyle) {
    studyScore += 10;
    details.push("Shared study focus atmosphere");
    reasons.push({
      title: 'Study Habits',
      description: p1.studyStyle === 'QUIET' 
        ? 'Both value quiet focus hours during study sessions.' 
        : 'Both enjoy lively background tunes while working.',
      type: 'study'
    });
  } else {
    studyScore += 5;
  }

  if (p1.noiseTolerance === p2.noiseTolerance) {
    studyScore += 10;
    details.push("Matching noise preferences");
  } else {
    studyScore += 4;
  }
  totalScore += studyScore;

  // 5. Social Calibration (Weight: 20 pts)
  let socialScore = 0;
  if (p1.socialLevel === p2.socialLevel) {
    socialScore = 20;
    details.push(`Complementary ${p1.socialLevel.toLowerCase()} social energy`);
    reasons.push({
      title: 'Social Energy',
      description: p1.socialLevel === 'INTROVERT'
        ? 'Both appreciate personal space and calm evening downtime.'
        : 'Both love an energetic, friendly room environment.',
      type: 'social'
    });
  } else {
    socialScore = 12;
    details.push("Balanced social dynamic (blend of social and quiet hours)");
  }
  totalScore += socialScore;

  // 6. Temperature Preference (Weight: 15 pts)
  let tempScore = 0;
  if (p1.tempPreference === p2.tempPreference) {
    tempScore = 15;
    details.push("Identical room temperature comfort zone");
  } else {
    tempScore = 8;
  }
  totalScore += tempScore;

  // Compute category breakdowns
  const lifestylePercentage = Math.min(100, Math.round(((sleepScore + tempScore) / 35) * 100));
  const cleanlinessPercentage = Math.min(100, Math.round((cleanScore / 25) * 100));
  const socializingPercentage = Math.min(100, Math.round(((studyScore + socialScore) / 40) * 100));

  const finalScore = Math.max(50, Math.min(99, Math.round(totalScore)));

  return {
    score: finalScore,
    breakdown: {
      lifestyle: lifestylePercentage,
      cleanliness: cleanlinessPercentage,
      socializing: socializingPercentage,
    },
    details,
    reasons
  };
};
