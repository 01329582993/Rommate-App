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

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true, gender: true } } }
    });

    if (!profile) {
      const demoUsers: Record<string, any> = {
        'demo-1': {
          bio: "I'm a fairly quiet person who loves deep-focus work sessions during the day but enjoys a good movie night on weekends. I keep my space organized and value open communication about house chores. Looking for someone with a similar academic-focused lifestyle.",
          sleepSchedule: 'EARLY',
          noiseTolerance: 'LOW',
          smoking: false,
          smokingTolerant: true,
          cleanliness: 4,
          studyStyle: 'QUIET',
          tempPreference: 'MEDIUM',
          socialLevel: 'INTROVERT',
          dealBreakers: '[]',
          user: { name: 'Elena Rodriguez', email: 'elena.r@stanford.edu', gender: 'FEMALE' }
        },
        'demo-2': {
          bio: "Hey there! Looking for an outgoing roommate to share a clean and active space. I love cooking and playing video games in my downtime.",
          sleepSchedule: 'LATE',
          noiseTolerance: 'MEDIUM',
          smoking: false,
          smokingTolerant: true,
          cleanliness: 3,
          studyStyle: 'MUSIC',
          tempPreference: 'MEDIUM',
          socialLevel: 'EXTROVERT',
          dealBreakers: '[]',
          user: { name: 'Noah Brooks', email: 'noah.b@university.edu', gender: 'MALE' }
        },
        'demo-3': {
          bio: "Quiet and studios. Love morning coffee and running. Non-smoker and very neat.",
          sleepSchedule: 'EARLY',
          noiseTolerance: 'LOW',
          smoking: false,
          smokingTolerant: false,
          cleanliness: 5,
          studyStyle: 'QUIET',
          tempPreference: 'MEDIUM',
          socialLevel: 'INTROVERT',
          dealBreakers: '[]',
          user: { name: 'Mina Patel', email: 'mina.p@university.edu', gender: 'FEMALE' }
        }
      };

      const matchId = userId.startsWith('demo-') ? userId : 'demo-1';
      const demo = demoUsers[matchId] || demoUsers['demo-1'];
      return res.json({
        id: matchId,
        userId: matchId,
        ...demo,
        dealBreakers: []
      });
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


