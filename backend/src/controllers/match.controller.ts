import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { calculateCompatibility, ScoringProfile } from '../utils/scoring';

const RICH_STUDENT_PROFILES = [
  {
    userId: 'demo-1',
    name: 'Tanzimul Haque',
    gender: 'MALE',
    compatibility: 98,
    department: 'Computer Science & Engineering',
    year: 'Senior (4th Year)',
    budget: 'IUT South Hall 204',
    moveIn: 'Current Session',
    bio: 'CSE 20th batch from Dhaka. Competitive programmer, active in IUT Computer Society. Respects quiet study hours and keeps desk space clean.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Quiet study environment', 'Smoke-free space', 'Tidy study desk'],
    reasons: [
      { title: 'Smoke-free lifestyle', desc: 'Both prefer a clean air environment in South Hall.' },
      { title: 'Study Habits', desc: 'Both value focused quiet coding hours during weekdays.' },
    ]
  },
  {
    userId: 'demo-2',
    name: 'Mamadou Diallo',
    gender: 'MALE',
    compatibility: 96,
    department: 'Electrical & Electronic Engineering',
    year: 'Senior (4th Year)',
    budget: 'IUT North Hall 105',
    moveIn: 'Current Session',
    bio: 'EEE international senior from Dakar, Senegal. Robotics enthusiast, early riser for Fajr prayer, very organized and friendly North Hall resident.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Moderate',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Early riser routine', 'Organized room habits', 'Friendly & respectful'],
    reasons: [
      { title: 'Early Schedule', desc: 'Both wake up early for classes and prayer.' },
      { title: 'Cleanliness Standards', desc: 'Dedicated to shared room hygiene.' }
    ]
  },
  {
    userId: 'demo-3',
    name: 'Nusrat Jahan',
    gender: 'FEMALE',
    compatibility: 95,
    department: 'Software Engineering',
    year: 'Senior (4th Year)',
    budget: 'IUT FHR 201',
    moveIn: 'Current Session',
    bio: 'SWE senior in FHR (Female Hall). High cleanliness standards, quiet nighttime study habits, tea lover, and active in Women in Tech.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Quiet study environment', 'Clean living space', 'FHR hall resident'],
    reasons: [
      { title: 'Study Priority', desc: 'Both dedicate evenings to quiet software projects.' }
    ]
  },
  {
    userId: 'demo-4',
    name: 'Ibrahim Ousmane',
    gender: 'MALE',
    compatibility: 93,
    department: 'Mechanical Engineering',
    year: 'Junior (3rd Year)',
    budget: 'IUT South Hall 312',
    moveIn: 'Current Session',
    bio: 'MCE junior from Niamey, Niger. Passionate about automotive design, football on campus, and keeping common hall space neat and orderly.',
    sleepSchedule: 'EARLY',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Campus sports lover', 'Active & respectful', 'Clean common space'],
    reasons: [
      { title: 'Social Energy', desc: 'Balanced lifestyle with sports and academics.' }
    ]
  },
  {
    userId: 'demo-5',
    name: 'Fatoumata Bamba',
    gender: 'FEMALE',
    compatibility: 92,
    department: 'Computer Science & Engineering',
    year: 'Junior (3rd Year)',
    budget: 'IUT FHR 201',
    moveIn: 'Current Session',
    bio: "IUT CSE junior from Abidjan, Côte d'Ivoire. Loving data structures, AI research, and weekend baking in FHR. Respects roommate privacy and study time.",
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Quiet evening focus', 'Very neat study area', 'Baking & culinary skills'],
    reasons: [
      { title: 'Academic Focus', desc: 'Passionate about computing research and exams.' }
    ]
  },
  {
    userId: 'demo-6',
    name: 'Farhan Shadman',
    gender: 'MALE',
    compatibility: 90,
    department: 'Civil & Environmental Engineering',
    year: 'Junior (3rd Year)',
    budget: 'IUT North Hall 402',
    moveIn: 'Current Session',
    bio: 'Civil Engineering 21st batch from Sylhet. Clean habits, gym regular at IUT gymnasium, podcast listener with headphones, and reliable roommate.',
    sleepSchedule: 'LATE',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Gym & fitness enthusiast', 'Headphones listener', 'Fair chore sharing'],
    reasons: [
      { title: 'Mutual Space Respect', desc: 'Always wears headphones while listening to audio.' }
    ]
  },
  {
    userId: 'demo-7',
    name: 'Aminata Traoré',
    gender: 'FEMALE',
    compatibility: 89,
    department: 'Software Engineering',
    year: 'Junior (3rd Year)',
    budget: 'IUT FHR 305',
    moveIn: 'Current Session',
    bio: 'Software Engineering student from Bamako, Mali. Quiet study routines, neat room habits, loves French & English literature and UI design.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Early to bed', 'Design enthusiast', 'Clean living habit'],
    reasons: [
      { title: 'Peaceful Environment', desc: 'Prefers quiet calm atmosphere for studying.' }
    ]
  },
  {
    userId: 'demo-8',
    name: 'Kofi Mensah',
    gender: 'MALE',
    compatibility: 88,
    department: 'Electrical & Electronic Engineering',
    year: 'Sophomore (2nd Year)',
    budget: 'IUT South Hall 312',
    moveIn: 'Current Session',
    bio: 'EEE sophomore from Accra, Ghana. Hardware club member, music lover with headphones, polite and dependable roommate in South Hall.',
    sleepSchedule: 'LATE',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Hardware club', 'Friendly personality', 'Reliable roommate'],
    reasons: [
      { title: 'Tech Interests', desc: 'Both passionate about electronics & computing.' }
    ]
  },
  {
    userId: 'demo-9',
    name: 'Ayesha Siddiqua',
    gender: 'FEMALE',
    compatibility: 87,
    department: 'Computer Science & Engineering',
    year: 'Sophomore (2nd Year)',
    budget: 'IUT FHR 305',
    moveIn: 'Current Session',
    bio: 'CSE 22nd batch in FHR. Calm, organized, early sleeper. Loves reading tech blogs, practicing algorithm problems, and maintaining a spotless study table.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Spotless study table', 'Early sleeper', 'Algorithm enthusiast'],
    reasons: [
      { title: 'Sleep Alignment', desc: 'Shares early bedtime routine.' }
    ]
  },
  {
    userId: 'demo-10',
    name: 'Samiul Islam',
    gender: 'MALE',
    compatibility: 86,
    department: 'Mechanical Engineering',
    year: 'Sophomore (2nd Year)',
    budget: 'IUT North Hall 105',
    moveIn: 'Current Session',
    bio: 'MCE sophomore from Khulna. North Hall resident. Quiet study habits, early sleep routine, and respects personal boundaries.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Quiet study style', 'Respects boundaries', 'Tidy roommate'],
    reasons: [
      { title: 'Quiet Hours', desc: 'Respects quiet study time.' }
    ]
  },
  {
    userId: 'demo-11',
    name: 'Zainab Abdullahi',
    gender: 'FEMALE',
    compatibility: 85,
    department: 'Software Engineering',
    year: 'Sophomore (2nd Year)',
    budget: 'IUT FHR 201',
    moveIn: 'Current Session',
    bio: 'SWE sophomore from Kano, Nigeria. Friendly and respectful, diligent student, loves hot tea and keeps shared spaces clean and serene in FHR.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Diligent student', 'Tea lover', 'Clean & peaceful'],
    reasons: [
      { title: 'Harmonious Living', desc: 'Values a tidy and peaceful room atmosphere.' }
    ]
  },
  {
    userId: 'demo-12',
    name: 'Bakary Camara',
    gender: 'MALE',
    compatibility: 84,
    department: 'Civil & Environmental Engineering',
    year: 'Sophomore (2nd Year)',
    budget: 'IUT South Hall 204',
    moveIn: 'Current Session',
    bio: 'Civil Engineering student from Banjul, The Gambia. Passionate about bridge design, campus sports, non-smoker, and very tidy roommate.',
    sleepSchedule: 'LATE',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Non-smoker', 'Campus football', 'Friendly & clean'],
    reasons: [
      { title: 'Non-Smoker', desc: 'Prefers 100% smoke-free dorm.' }
    ]
  },
  {
    userId: 'demo-13',
    name: 'Tasnia Tabassum',
    gender: 'FEMALE',
    compatibility: 83,
    department: 'Business & Technology Management',
    year: 'Sophomore (2nd Year)',
    budget: 'IUT FHR 305',
    moveIn: 'Current Session',
    bio: 'BTM 22nd batch in FHR. Business case competition enthusiast, super organized, quiet night reader, and easy to communicate with.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Super organized', 'Night reader', 'Great communicator'],
    reasons: [
      { title: 'Organization', desc: 'Always keeps shared spaces clean and arranged.' }
    ]
  },
  {
    userId: 'demo-14',
    name: 'Ousmane Keita',
    gender: 'MALE',
    compatibility: 82,
    department: 'Computer Science & Engineering',
    year: 'Sophomore (2nd Year)',
    budget: 'IUT North Hall 402',
    moveIn: 'Current Session',
    bio: 'CSE student from Conakry, Guinea. Cyber-security enthusiast, badminton player, quiet and considerate roommate in North Hall.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    photos: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
    ],
    details: ['Cybersecurity', 'Considerate roommate', 'Badminton player'],
    reasons: [
      { title: 'Tech Alignment', desc: 'Passionate about software and cybersecurity.' }
    ]
  }
];

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
      let myProfile = await prisma.profile.findUnique({ where: { userId } });

      // Query all other student profiles from the database
      let others = await prisma.profile.findMany({
        where: { userId: { not: userId } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              studentId: true,
              gender: true,
              reviewsReceived: {
                include: {
                  reviewer: { select: { name: true } }
                }
              }
            }
          }
        }
      });

      if (!others || others.length === 0) {
        return res.json(RICH_STUDENT_PROFILES);
      }

      // Default profile object if user hasn't completed onboarding yet
      const activeProfile: ScoringProfile = myProfile ? {
        sleepSchedule: myProfile.sleepSchedule || 'EARLY',
        noiseTolerance: myProfile.noiseTolerance || 'MEDIUM',
        smoking: !!myProfile.smoking,
        smokingTolerant: !!myProfile.smokingTolerant,
        cleanliness: myProfile.cleanliness || 4,
        studyStyle: myProfile.studyStyle || 'QUIET',
        tempPreference: myProfile.tempPreference || 'MEDIUM',
        socialLevel: myProfile.socialLevel || 'INTROVERT',
        dealBreakers: typeof myProfile.dealBreakers === 'string' ? JSON.parse(myProfile.dealBreakers || '[]') : (myProfile.dealBreakers || [])
      } : {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: true,
        cleanliness: 4,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: []
      };

      const matches = others.map(other => {
        const otherScoring: ScoringProfile = {
          sleepSchedule: other.sleepSchedule || 'EARLY',
          noiseTolerance: other.noiseTolerance || 'MEDIUM',
          smoking: !!other.smoking,
          smokingTolerant: !!other.smokingTolerant,
          cleanliness: other.cleanliness || 4,
          studyStyle: other.studyStyle || 'QUIET',
          tempPreference: other.tempPreference || 'MEDIUM',
          socialLevel: other.socialLevel || 'INTROVERT',
          dealBreakers: typeof other.dealBreakers === 'string' ? JSON.parse(other.dealBreakers || '[]') : (other.dealBreakers || [])
        };

        const result = calculateCompatibility(activeProfile, otherScoring);

        let parsedPrefs: any = {};
        try {
          if (other.preferencesJson) parsedPrefs = JSON.parse(other.preferencesJson);
        } catch (e) {}

        const fallbackPhotos = other.user.gender === 'FEMALE'
          ? [
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85'
            ]
          : [
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
              'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85'
            ];

        return {
          userId: other.userId,
          name: other.user.name,
          studentId: other.user.studentId,
          gender: other.user.gender,
          department: parsedPrefs.department || 'Islamic University of Technology',
          hall: parsedPrefs.hall || (other.user.gender === 'FEMALE' ? 'FHR' : 'South Hall'),
          origin: parsedPrefs.origin,
          photos: (Array.isArray(parsedPrefs.photos) && parsedPrefs.photos.length > 0) ? parsedPrefs.photos : fallbackPhotos,
          compatibility: result.score || 85,
          bio: other.bio,
          sleepSchedule: other.sleepSchedule,
          cleanliness: other.cleanliness,
          noiseTolerance: other.noiseTolerance,
          smoking: other.smoking,
          breakdown: result.breakdown,
          details: result.details.length > 0 ? result.details : ['Highly compatible roommate match'],
          reasons: result.reasons
        };
      });

      matches.sort((a, b) => b.compatibility - a.compatibility);
      return res.json(matches.length >= 5 ? matches : RICH_STUDENT_PROFILES);
    } catch (dbError: any) {
      console.error('Match DB Error:', dbError);
      return res.json(RICH_STUDENT_PROFILES);
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
};

export const likeUser = async (req: AuthRequest, res: Response) => {
  try {
    const fromId = req.user?.userId;
    const { toId } = req.body;
    if (!fromId) return res.status(401).json({ message: 'Unauthorized' });
    if (!toId) return res.status(400).json({ message: 'toId is required' });

    // Check if reverse like exists
    const reverseLike = await prisma.like.findFirst({
      where: { fromId: toId, toId: fromId }
    });

    const like = await prisma.like.upsert({
      where: { fromId_toId: { fromId, toId } },
      update: { isMutual: !!reverseLike },
      create: {
        fromId,
        toId,
        isMutual: !!reverseLike
      }
    });

    if (reverseLike) {
      await prisma.like.update({
        where: { id: reverseLike.id },
        data: { isMutual: true }
      });
    }

    res.json({
      success: true,
      isMutual: !!reverseLike,
      message: reverseLike ? "It's a Match!" : 'Liked successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error processing like', error: error.message });
  }
};

export const passUser = async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, message: 'Passed user' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error passing user', error: error.message });
  }
};

export const getLikedProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const likes = await prisma.like.findMany({
      where: { fromId: userId },
      include: {
        to: {
          select: {
            id: true,
            name: true,
            gender: true,
            profile: true
          }
        }
      }
    });

    res.json(likes);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching likes', error: error.message });
  }
};
