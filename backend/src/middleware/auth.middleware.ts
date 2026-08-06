import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded?.userId) {
      return res.sendStatus(403);
    }

    let user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: decoded.userId,
          email: `${decoded.userId}@demo.local`,
          name: decoded.userId,
          role: decoded.role || 'STUDENT'
        }
      });
    }

    req.user = {
      userId: user.id,
      role: user.role
    };

    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Require Admin Role' });
  }
};
