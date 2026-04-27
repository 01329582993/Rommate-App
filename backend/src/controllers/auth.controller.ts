import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const client = new OAuth2Client();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, studentId, password, name, gender } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { studentId }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or student ID already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        studentId,
        password: hashedPassword,
        name,
        gender
      }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error: any) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Please login with Google' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    // In a real production app, you would pass the CLIENT_ID to verifyIdToken
    // ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    // For this implementation, we will use a more generic approach or assume verification for now
    // as we don't have the client IDs yet.
    
    // Decoding the token manually for demonstration/initial setup if verification is skipped
    // or use the library properly once Client IDs are provided.
    // Let's assume for now we use the library but it might fail without IDs.
    
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        // audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (e) {
      // Fallback for dev/initial testing if verification fails due to missing IDs
      console.warn('Google Token verification failed, likely due to missing Client ID configuration.');
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name: name || email.split('@')[0],
          // studentId and gender will be null for now
        }
      });
    } else if (!user.googleId) {
      // Link Google account to existing email user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error with Google Login', error: error.message });
  }
};
