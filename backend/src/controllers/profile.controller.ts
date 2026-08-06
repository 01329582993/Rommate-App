import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const createOrUpdateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      sleepSchedule = 'EARLY',
      noiseTolerance = 'MEDIUM',
      smoking = false,
      smokingTolerant = false,
      cleanliness = 3,
      studyStyle = 'QUIET',
      tempPreference = 'MEDIUM',
      socialLevel = 'INTROVERT',
      dealBreakers = [],
      bio = ''
    } = req.body;

    const dealBreakersStr = typeof dealBreakers === 'string' ? dealBreakers : JSON.stringify(dealBreakers || []);

    const profileData = {
      sleepSchedule,
      noiseTolerance,
      smoking: Boolean(smoking),
      smokingTolerant: Boolean(smokingTolerant),
      cleanliness: Number(cleanliness) || 3,
      studyStyle,
      tempPreference,
      socialLevel,
      dealBreakers: dealBreakersStr,
      bio
    };

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });

    const formattedProfile = {
      ...profile,
      dealBreakers: JSON.parse(profile.dealBreakers || '[]')
    };

    res.json({ message: 'Profile updated successfully', profile: formattedProfile });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, gender: true } } }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const formattedProfile = {
      ...profile,
      dealBreakers: typeof profile.dealBreakers === 'string' ? JSON.parse(profile.dealBreakers || '[]') : profile.dealBreakers
    };

    res.json(formattedProfile);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

