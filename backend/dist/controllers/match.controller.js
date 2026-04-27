"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeUser = exports.getMatches = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const scoring_1 = require("../utils/scoring");
const getMatches = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Get my profile
        const myProfile = await prisma_1.default.profile.findUnique({ where: { userId } });
        if (!myProfile)
            return res.status(400).json({ message: 'Please complete your profile first' });
        // Get other users' profiles (simple approach for now: all students in same gender group)
        const me = await prisma_1.default.user.findUnique({ where: { id: userId } });
        const others = await prisma_1.default.profile.findMany({
            where: {
                userId: { not: userId },
                user: { gender: me?.gender } // Match by gender for university housing
            },
            include: { user: { select: { id: true, name: true, gender: true } } }
        });
        const matches = others.map(other => {
            const result = (0, scoring_1.calculateCompatibility)(myProfile, other);
            return {
                userId: other.userId,
                name: other.user.name,
                compatibility: result.score,
                details: result.details
            };
        });
        // Sort by compatibility score
        matches.sort((a, b) => b.compatibility - a.compatibility);
        res.json(matches.slice(0, 10)); // Top 10 matches
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching matches', error: error.message });
    }
};
exports.getMatches = getMatches;
const likeUser = async (req, res) => {
    try {
        const fromId = req.user?.userId;
        const { toId } = req.body;
        if (!fromId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if reverse like exists
        const reverseLike = await prisma_1.default.like.findFirst({
            where: { fromId: toId, toId: fromId }
        });
        const like = await prisma_1.default.like.create({
            data: {
                fromId,
                toId,
                isMutual: !!reverseLike
            }
        });
        if (reverseLike) {
            await prisma_1.default.like.update({
                where: { id: reverseLike.id },
                data: { isMutual: true }
            });
        }
        res.json({ message: reverseLike ? 'It is a mutual match!' : 'Liked successfully', isMutual: !!reverseLike });
    }
    catch (error) {
        res.status(500).json({ message: 'Error liking user', error: error.message });
    }
};
exports.likeUser = likeUser;
