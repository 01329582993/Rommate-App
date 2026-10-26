import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding IUT (Islamic University of Technology) Campus Housing & Roommates...');

  // Clean old reviews, likes, groups, profiles, and student users to avoid studentId unique constraint issues
  await prisma.review.deleteMany({}).catch(() => null);
  await prisma.like.deleteMany({}).catch(() => null);
  await prisma.message.deleteMany({}).catch(() => null);
  await prisma.group.deleteMany({}).catch(() => null);
  await prisma.profile.deleteMany({}).catch(() => null);
  await prisma.user.deleteMany({ where: { role: 'STUDENT' } }).catch(() => null);

  // 1. Create IUT Halls of Residence Rooms
  const roomSH204 = await prisma.room.upsert({
    where: { roomNumber: 'South Hall 204' },
    update: {},
    create: { roomNumber: 'South Hall 204', capacity: 4 }
  });

  const roomSH312 = await prisma.room.upsert({
    where: { roomNumber: 'South Hall 312' },
    update: {},
    create: { roomNumber: 'South Hall 312', capacity: 4 }
  });

  const roomNH105 = await prisma.room.upsert({
    where: { roomNumber: 'North Hall 105' },
    update: {},
    create: { roomNumber: 'North Hall 105', capacity: 4 }
  });

  const roomNH402 = await prisma.room.upsert({
    where: { roomNumber: 'North Hall 402' },
    update: {},
    create: { roomNumber: 'North Hall 402', capacity: 4 }
  });

  const roomFHR201 = await prisma.room.upsert({
    where: { roomNumber: 'FHR 201' },
    update: {},
    create: { roomNumber: 'FHR 201', capacity: 4 }
  });

  const roomFHR305 = await prisma.room.upsert({
    where: { roomNumber: 'FHR 305' },
    update: {},
    create: { roomNumber: 'FHR 305', capacity: 4 }
  });

  const defaultPassword = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // ── IUT PROVOST / HOUSING ADMIN ACCOUNTS ──
  await prisma.user.upsert({
    where: { email: 'admin@iut-dhaka.edu' },
    update: { role: 'ADMIN', password: adminPassword },
    create: {
      email: 'admin@iut-dhaka.edu',
      name: 'IUT Provost Office',
      studentId: 'ADMIN-IUT',
      password: adminPassword,
      role: 'ADMIN',
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@roomsync.edu' },
    update: { role: 'ADMIN', password: adminPassword },
    create: {
      email: 'admin@roomsync.edu',
      name: 'IUT Housing Admin',
      studentId: 'ADMIN-001',
      password: adminPassword,
      role: 'ADMIN',
    }
  });

  // ── IUT STUDENTS DATA (African & Bangladeshi Students at IUT) ──
  const studentsData = [
    {
      name: 'Limas Soubello',
      email: 'limassoubello@iut-dhaka.edu',
      studentId: '200041101',
      gender: 'MALE',
      department: 'Computer Science & Engineering',
      hall: 'South Hall 204',
      origin: 'Chad',
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'COLD',
        socialLevel: 'AMBIVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'IUT CSE senior from Chad. Passionate about software engineering, competitive programming, and late-night coding sessions. Very tidy, respectful of prayer & quiet study hours in South Hall.'
      }
    },
    {
      name: 'Tanzimul Haque',
      email: 'tanzimul.haque@iut-dhaka.edu',
      studentId: '200041102',
      gender: 'MALE',
      department: 'Computer Science & Engineering',
      hall: 'South Hall 204',
      origin: 'Bangladesh (Dhaka)',
      photos: [
        'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'COLD',
        socialLevel: 'AMBIVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'CSE 20th batch from Dhaka. Competitive programmer, active in IUT Computer Society. Respects quiet study hours and keeps desk space clean.'
      }
    },
    {
      name: 'Mamadou Diallo',
      email: 'mamadou.diallo@iut-dhaka.edu',
      studentId: '200021103',
      gender: 'MALE',
      department: 'Electrical & Electronic Engineering',
      hall: 'North Hall 105',
      origin: 'Senegal',
      photos: [
        'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'EEE international senior from Dakar, Senegal. Robotics enthusiast, early riser for Fajr prayer, very organized and friendly North Hall resident.'
      }
    },
    {
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan@iut-dhaka.edu',
      studentId: '200042104',
      gender: 'FEMALE',
      department: 'Software Engineering',
      hall: 'FHR 201',
      origin: 'Bangladesh (Chittagong)',
      photos: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'SWE senior in FHR (Female Hall). High cleanliness standards, quiet nighttime study habits, tea lover, and active in Women in Tech.'
      }
    },
    {
      name: 'Ibrahim Ousmane',
      email: 'ibrahim.ousmane@iut-dhaka.edu',
      studentId: '210011105',
      gender: 'MALE',
      department: 'Mechanical Engineering',
      hall: 'South Hall 312',
      origin: 'Niger',
      photos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: true,
        cleanliness: 4,
        studyStyle: 'GROUP',
        tempPreference: 'MEDIUM',
        socialLevel: 'EXTROVERT',
        dealBreakers: JSON.stringify([]),
        bio: 'MCE junior from Niamey, Niger. Passionate about automotive design, football on campus, and keeping common hall space neat and orderly.'
      }
    },
    {
      name: 'Fatoumata Bamba',
      email: 'fatoumata.bamba@iut-dhaka.edu',
      studentId: '210041106',
      gender: 'FEMALE',
      department: 'Computer Science & Engineering',
      hall: 'FHR 201',
      origin: 'Ivory Coast',
      photos: [
        'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: "IUT CSE junior from Abidjan, Côte d'Ivoire. Loving data structures, AI research, and weekend baking in FHR. Respects roommate privacy and study time."
      }
    },
    {
      name: 'Farhan Shadman',
      email: 'farhan.shadman@iut-dhaka.edu',
      studentId: '210051107',
      gender: 'MALE',
      department: 'Civil & Environmental Engineering',
      hall: 'North Hall 402',
      origin: 'Bangladesh (Sylhet)',
      photos: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 4,
        studyStyle: 'MUSIC',
        tempPreference: 'COLD',
        socialLevel: 'AMBIVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'Civil Engineering 21st batch from Sylhet. Clean habits, gym regular at IUT gymnasium, podcast listener with headphones, and reliable roommate.'
      }
    },
    {
      name: 'Aminata Traoré',
      email: 'aminata.traore@iut-dhaka.edu',
      studentId: '210042108',
      gender: 'FEMALE',
      department: 'Software Engineering',
      hall: 'FHR 305',
      origin: 'Mali',
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'Software Engineering student from Bamako, Mali. Quiet study routines, neat room habits, loves French & English literature and UI design.'
      }
    },
    {
      name: 'Kofi Mensah',
      email: 'kofi.mensah@iut-dhaka.edu',
      studentId: '220021109',
      gender: 'MALE',
      department: 'Electrical & Electronic Engineering',
      hall: 'South Hall 312',
      origin: 'Ghana',
      photos: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 4,
        studyStyle: 'QUIET',
        tempPreference: 'COLD',
        socialLevel: 'AMBIVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'EEE sophomore from Accra, Ghana. Hardware club member, music lover with headphones, polite and dependable roommate in South Hall.'
      }
    },
    {
      name: 'Ayesha Siddiqua',
      email: 'ayesha.siddiqua@iut-dhaka.edu',
      studentId: '220041110',
      gender: 'FEMALE',
      department: 'Computer Science & Engineering',
      hall: 'FHR 305',
      origin: 'Bangladesh (Rajshahi)',
      photos: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'CSE 22nd batch in FHR. Calm, organized, early sleeper. Loves reading tech blogs, practicing algorithm problems, and maintaining a spotless study table.'
      }
    },
    {
      name: 'Samiul Islam',
      email: 'samiul.islam@iut-dhaka.edu',
      studentId: '220011111',
      gender: 'MALE',
      department: 'Mechanical Engineering',
      hall: 'North Hall 105',
      origin: 'Bangladesh (Khulna)',
      photos: [
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'MCE sophomore from Khulna. North Hall resident. Quiet study habits, early sleep routine, and respects personal boundaries.'
      }
    },
    {
      name: 'Zainab Abdullahi',
      email: 'zainab.abdullahi@iut-dhaka.edu',
      studentId: '220042112',
      gender: 'FEMALE',
      department: 'Software Engineering',
      hall: 'FHR 201',
      origin: 'Nigeria',
      photos: [
        'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'AMBIVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'SWE sophomore from Kano, Nigeria. Friendly and respectful, diligent student, loves hot tea and keeps shared spaces clean and serene in FHR.'
      }
    },
    {
      name: 'Bakary Camara',
      email: 'bakary.camara@iut-dhaka.edu',
      studentId: '220051113',
      gender: 'MALE',
      department: 'Civil & Environmental Engineering',
      hall: 'South Hall 204',
      origin: 'The Gambia',
      photos: [
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 4,
        studyStyle: 'MUSIC',
        tempPreference: 'COLD',
        socialLevel: 'EXTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'Civil Engineering student from Banjul, The Gambia. Passionate about bridge design, campus sports, non-smoker, and very tidy roommate.'
      }
    },
    {
      name: 'Tasnia Tabassum',
      email: 'tasnia.tabassum@iut-dhaka.edu',
      studentId: '220031114',
      gender: 'FEMALE',
      department: 'Business & Technology Management',
      hall: 'FHR 305',
      origin: 'Bangladesh (Dhaka)',
      photos: [
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'BTM 22nd batch in FHR. Business case competition enthusiast, super organized, quiet night reader, and easy to communicate with.'
      }
    },
    {
      name: 'Ousmane Keita',
      email: 'ousmane.keita@iut-dhaka.edu',
      studentId: '220041115',
      gender: 'MALE',
      department: 'Computer Science & Engineering',
      hall: 'North Hall 402',
      origin: 'Guinea',
      photos: [
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1000&auto=format&fit=crop&q=85',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
      ],
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 5,
        studyStyle: 'QUIET',
        tempPreference: 'COLD',
        socialLevel: 'AMBIVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'CSE student from Conakry, Guinea. Cyber-security enthusiast, badminton player, quiet and considerate roommate in North Hall.'
      }
    }
  ];

  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        studentId: s.studentId,
        gender: s.gender,
        password: defaultPassword,
      },
      create: {
        email: s.email,
        name: s.name,
        studentId: s.studentId,
        gender: s.gender,
        password: defaultPassword,
        role: 'STUDENT',
      }
    });

    const prefJson = JSON.stringify({
      photos: s.photos,
      department: s.department,
      hall: s.hall,
      origin: s.origin
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        sleepSchedule: s.profile.sleepSchedule,
        noiseTolerance: s.profile.noiseTolerance,
        smoking: s.profile.smoking,
        smokingTolerant: s.profile.smokingTolerant,
        cleanliness: s.profile.cleanliness,
        studyStyle: s.profile.studyStyle,
        tempPreference: s.profile.tempPreference,
        socialLevel: s.profile.socialLevel,
        dealBreakers: s.profile.dealBreakers,
        bio: s.profile.bio,
        preferencesJson: prefJson,
      },
      create: {
        userId: user.id,
        sleepSchedule: s.profile.sleepSchedule,
        noiseTolerance: s.profile.noiseTolerance,
        smoking: s.profile.smoking,
        smokingTolerant: s.profile.smokingTolerant,
        cleanliness: s.profile.cleanliness,
        studyStyle: s.profile.studyStyle,
        tempPreference: s.profile.tempPreference,
        socialLevel: s.profile.socialLevel,
        dealBreakers: s.profile.dealBreakers,
        bio: s.profile.bio,
        preferencesJson: prefJson,
      }
    });
  }

  // 3. Demo IUT Room Group: Limas Soubello & Tanzimul Haque in South Hall 204
  const limas = await prisma.user.findUnique({ where: { email: 'limassoubello@iut-dhaka.edu' } });
  const tanzimul = await prisma.user.findUnique({ where: { email: 'tanzimul.haque@iut-dhaka.edu' } });

  if (limas && tanzimul) {
    let iutGroup = await prisma.group.findFirst({ where: { roomId: roomSH204.id } });
    if (!iutGroup) {
      iutGroup = await prisma.group.create({
        data: {
          name: 'IUT Coders Quad',
          roomId: roomSH204.id,
          isLocked: true,
          members: {
            connect: [{ id: limas.id }, { id: tanzimul.id }]
          }
        }
      });
    }
  }

  // Demo Peer Reviews
  if (limas && tanzimul) {
    await prisma.review.upsert({
      where: {
        reviewerId_revieweeId: { reviewerId: tanzimul.id, revieweeId: limas.id }
      },
      update: {},
      create: {
        reviewerId: tanzimul.id,
        revieweeId: limas.id,
        rating: 5,
        comment: 'Limas is an outstanding roommate! Incredibly tidy, respects quiet hours during coding & study, and great company in South Hall.',
        isRoommate: true,
      }
    }).catch(() => null);
  }

  console.log('✅ IUT Seeding completed successfully!');
  console.log('Credentials:');
  console.log('  ➜ Student: limassoubello@iut-dhaka.edu (or ID: 200041101) / 123456');
  console.log('  ➜ Admin:   admin@iut-dhaka.edu (or admin@roomsync.edu) / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
