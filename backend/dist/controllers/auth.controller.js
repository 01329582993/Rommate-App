"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const register = async (req, res) => {
    try {
        const { email, studentId, password, name, gender } = req.body;
        // Check if user exists
        const existingUser = await prisma_1.default.user.findFirst({
            where: { OR: [{ email }, { studentId }] }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or student ID already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                email,
                studentId,
                password: hashedPassword,
                name,
                gender
            }
        });
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    }
    catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
exports.login = login;
