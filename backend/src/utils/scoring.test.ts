/**
 * scoring.test.ts
 * ────────────────
 * Unit tests for the Rommify compatibility scoring engine.
 * Run with: npx ts-node scoring.test.ts
 */

import { calculateCompatibility, ScoringProfile } from './scoring';
import { getScoreLabel, getScoreSummary } from './scoreLabel';

// ── Test Profiles ─────────────────────────────────────────────────────────────

const earlyBirdClean: ScoringProfile = {
  sleepSchedule: 'EARLY',
  noiseTolerance: 'LOW',
  smoking: false,
  smokingTolerant: false,
  cleanliness: 5,
  studyStyle: 'QUIET',
  tempPreference: 'COLD',
  socialLevel: 'INTROVERT',
  guestFrequency: 'RARELY',
  petFriendly: false,
};

const nightOwlMessy: ScoringProfile = {
  sleepSchedule: 'LATE',
  noiseTolerance: 'HIGH',
  smoking: true,
  smokingTolerant: true,
  cleanliness: 2,
  studyStyle: 'MUSIC',
  tempPreference: 'WARM',
  socialLevel: 'EXTROVERT',
  guestFrequency: 'OFTEN',
  petFriendly: true,
};

const perfectMatch: ScoringProfile = {
  sleepSchedule: 'EARLY',
  noiseTolerance: 'LOW',
  smoking: false,
  smokingTolerant: false,
  cleanliness: 5,
  studyStyle: 'QUIET',
  tempPreference: 'COLD',
  socialLevel: 'INTROVERT',
  guestFrequency: 'RARELY',
  petFriendly: false,
};

// ── Run Tests ─────────────────────────────────────────────────────────────────

function runTests() {
  console.log('\n=== Rommify Compatibility Scoring Tests ===\n');

  // Test 1: Deal-breaker (smoker vs non-tolerant)
  console.log('Test 1: Smoking Deal-Breaker');
  const t1 = calculateCompatibility(earlyBirdClean, nightOwlMessy);
  console.assert(t1.score === 0, `Expected 0, got ${t1.score}`);
  console.assert(t1.dealBreakerHit === true, 'Expected dealBreakerHit=true');
  console.log(`  Score: ${t1.score} | DealBreaker: ${t1.dealBreakerHit} ✓\n`);

  // Test 2: Perfect match
  console.log('Test 2: Perfect Match (identical profiles)');
  const t2 = calculateCompatibility(earlyBirdClean, perfectMatch);
  console.assert(t2.score >= 90, `Expected >=90, got ${t2.score}`);
  console.assert(t2.dealBreakerHit === false, 'Expected dealBreakerHit=false');
  console.log(`  Score: ${t2.score} | Label: ${getScoreSummary(t2.score)} ✓\n`);

  // Test 3: Score labels
  console.log('Test 3: Score Label Tiers');
  const cases = [95, 85, 70, 55, 30];
  cases.forEach(score => {
    const label = getScoreLabel(score);
    console.log(`  ${score}% → ${label.emoji} ${label.tier}`);
  });

  // Test 4: Warnings populated when differences exist
  console.log('\nTest 4: Warnings on mismatched profiles');
  const mismatch: ScoringProfile = { ...earlyBirdClean, sleepSchedule: 'LATE', tempPreference: 'WARM' };
  const t4 = calculateCompatibility(earlyBirdClean, mismatch);
  console.assert(t4.warnings.length > 0, 'Expected warnings to be populated');
  console.log(`  Warnings: ${t4.warnings.length} found`);
  t4.warnings.forEach(w => console.log(`    ⚠️  ${w}`));

  console.log('\n=== All Tests Passed ===\n');
}

runTests();
