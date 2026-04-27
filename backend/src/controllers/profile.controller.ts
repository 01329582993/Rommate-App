import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const createOrUpdateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
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
    } = req.body;

    const profile = await prisma.profile.upsert({
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
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, gender: true } } }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};
