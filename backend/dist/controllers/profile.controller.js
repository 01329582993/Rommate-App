"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = exports.createOrUpdateProfile = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const createOrUpdateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { sleepSchedule, noiseTolerance, smoking, smokingTolerant, cleanliness, studyStyle, tempPreference, socialLevel, dealBreakers, bio } = req.body;
        const profile = await prisma_1.default.profile.upsert({
            where: { userId },
            update: {
                sleepSchedule,
                noiseTolerance,
                smoking,
                smokingTolerant,
                cleanliness,
                studyStyle,
                tempPreference,
                socialLevel,
                dealBreakers,
                bio
            },
            create: {
                userId,
                sleepSchedule,
                noiseTolerance,
                smoking,
                smokingTolerant,
                cleanliness,
                studyStyle,
                tempPreference,
                socialLevel,
                dealBreakers,
                bio
            }
        });
        res.json({ message: 'Profile updated successfully', profile });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};
exports.createOrUpdateProfile = createOrUpdateProfile;
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const profile = await prisma_1.default.profile.findUnique({
            where: { userId },
            include: { user: { select: { name: true, email: true, gender: true } } }
        });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};
exports.getMyProfile = getMyProfile;
