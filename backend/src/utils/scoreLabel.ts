/**
 * scoreLabel.ts
 * ─────────────
 * Converts a numeric compatibility score (0–100) into
 * a human-readable tier label and emoji for the Rommify UI.
 */

export interface ScoreLabel {
  tier: 'Perfect Match' | 'Great Match' | 'Good Match' | 'Possible Match' | 'Not Compatible';
  emoji: string;
  color: string;       // Hex color for the UI badge
  description: string;
}

/**
 * Returns a visual label for a given compatibility score.
 * @param score - Numeric score from calculateCompatibility (0–100)
 */
export const getScoreLabel = (score: number): ScoreLabel => {
  if (score >= 92) {
    return {
      tier: 'Perfect Match',
      emoji: '🔥',
      color: '#22c55e',
      description: 'Exceptional lifestyle alignment — you two were made to room together!'
    };
  } else if (score >= 80) {
    return {
      tier: 'Great Match',
      emoji: '⭐',
      color: '#3b82f6',
      description: 'Strong compatibility — a few small differences that are easy to work through.'
    };
  } else if (score >= 65) {
    return {
      tier: 'Good Match',
      emoji: '👍',
      color: '#f59e0b',
      description: 'Decent overlap — open communication will make this work well.'
    };
  } else if (score >= 50) {
    return {
      tier: 'Possible Match',
      emoji: '🤔',
      color: '#f97316',
      description: 'Some differences to navigate — set clear boundaries early.'
    };
  } else {
    return {
      tier: 'Not Compatible',
      emoji: '❌',
      color: '#ef4444',
      description: 'Significant lifestyle gaps — this pairing may lead to friction.'
    };
  }
};

/**
 * Returns a short one-liner summary for the match cards.
 */
export const getScoreSummary = (score: number): string => {
  const label = getScoreLabel(score);
  return `${label.emoji} ${label.tier} (${score}%)`;
};
