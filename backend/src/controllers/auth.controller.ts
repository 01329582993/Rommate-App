import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../utils/prisma';
import { JWT_SECRET, GOOGLE_CLIENT_ID } from '../utils/config';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const signToken = (user: { id: string; role: string }) =>
  jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

const publicUser = (u: { id: string; studentId?: string | null; name: string; email: string; role: string; gender: string | null }) => ({
  id: u.id,
  studentId: u.studentId,
  name: u.name,
  email: u.email,
  role: u.role,
  gender: u.gender,
});

export const register = async (req: Request, res: Response) => {
  try {
    const rawEmail = String(req.body.email || '').trim().toLowerCase();
    const email = rawEmail.includes('@') ? rawEmail : `${rawEmail}@iut-dhaka.edu`;
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const studentId = req.body.studentId ? String(req.body.studentId).trim() : null;
    const gender = req.body.gender ? String(req.body.gender).toUpperCase() : null;

    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid IUT email address (e.g. name@iut-dhaka.edu)' });
    if (name.length < 2) return res.status(400).json({ message: 'Please enter your name' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (gender && !GENDERS.includes(gender)) return res.status(400).json({ message: 'Invalid gender value' });

    if (studentId) {
      const idTaken = await prisma.user.findFirst({ where: { studentId, NOT: { email } } });
      if (idTaken) return res.status(409).json({ message: 'That IUT Student ID is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existing) {
      if (existing.password || existing.googleId) {
        return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
      }
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashedPassword, name, gender: gender || existing.gender, studentId: studentId || existing.studentId },
      });
    } else {
      user = await prisma.user.create({
        data: { email, password: hashedPassword, name, gender, studentId },
      });
    }

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Could not create your account. Please try again.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const input = String(req.body.email || req.body.identifier || req.body.studentId || '').trim();
    const inputLower = input.toLowerCase();
    const password = String(req.body.password || '');

    if (!input || !password) {
      return res.status(400).json({ message: 'IUT Student ID or Email and password are required' });
    }

    // Support logging in via IUT Student ID OR IUT Email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: inputLower },
          { studentId: input },
          { studentId: inputLower }
        ]
      }
    });

    const valid = !!user && !!user.password && (await bcrypt.compare(password, user.password));

    if (!user || !valid) {
      return res.status(401).json({ message: 'Incorrect IUT Student ID/Email or password' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in. Please try again.' });
  }
};

const googleClient = new OAuth2Client();

export const googleLogin = async (req: Request, res: Response) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(501).json({ message: 'Google sign-in is not configured on this server' });
    }

    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Google ID token is required' });

    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    let user = await prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });

    if (!user) {
      user = await prisma.user.create({ data: { email, googleId, name: payload.name || email.split('@')[0] } });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error: any) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Google sign-in failed' });
  }
};
