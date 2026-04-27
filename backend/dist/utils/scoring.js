"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCompatibility = void 0;
const calculateCompatibility = (p1, p2) => {
    let score = 0;
    let maxScore = 0;
    const details = [];
    // Deal Breaker Check: Smoking
    if (p1.smoking && !p2.smokingTolerant)
        return { score: 0, details: ["Conflict: Non-tolerant of smoking"] };
    if (p2.smoking && !p1.smokingTolerant)
        return { score: 0, details: ["Conflict: Non-tolerant of smoking"] };
    // Sleep Schedule (Weight: 20)
    maxScore += 20;
    if (p1.sleepSchedule === p2.sleepSchedule) {
        score += 20;
        details.push("Perfect sleep schedule match");
    }
    else {
        details.push("Different sleep schedules");
    }
    // Noise Tolerance (Weight: 15)
    maxScore += 15;
    if (p1.noiseTolerance === p2.noiseTolerance) {
        score += 15;
        details.push("Compatible noise tolerance");
    }
    else {
        score += 5; // Partial match
        details.push("Differing noise preferences");
    }
    // Cleanliness (Weight: 25)
    maxScore += 25;
    const cleanDiff = Math.abs(p1.cleanliness - p2.cleanliness);
    if (cleanDiff === 0) {
        score += 25;
        details.push("Identical cleanliness standards");
    }
    else if (cleanDiff === 1) {
        score += 15;
        details.push("Very similar cleanliness standards");
    }
    else if (cleanDiff === 2) {
        score += 5;
        details.push("Manageable cleanliness difference");
    }
    else {
        details.push("Significant cleanliness mismatch");
    }
    // Study Style (Weight: 15)
    maxScore += 15;
    if (p1.studyStyle === p2.studyStyle) {
        score += 15;
        details.push("Identical study habits");
    }
    else {
        score += 5;
        details.push("Different study environments");
    }
    // Social Level (Weight: 15)
    maxScore += 15;
    if (p1.socialLevel === p2.socialLevel) {
        score += 15;
        details.push("Matching social energy");
    }
    else {
        score += 5;
        details.push("Mixed social preferences");
    }
    // Temperature Preference (Weight: 10)
    maxScore += 10;
    if (p1.tempPreference === p2.tempPreference) {
        score += 10;
        details.push("Comfortable room temperature match");
    }
    const finalPercentage = Math.round((score / maxScore) * 100);
    return { score: finalPercentage, details };
};
exports.calculateCompatibility = calculateCompatibility;
