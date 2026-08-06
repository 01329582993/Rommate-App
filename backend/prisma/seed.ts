import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic room & student data...');

  // 1. Create Rooms
  const room1 = await prisma.room.upsert({
    where: { roomNumber: '101' },
    update: {},
    create: { roomNumber: '101', capacity: 4 }
  });

  const room2 = await prisma.room.upsert({
    where: { roomNumber: '102' },
    update: {},
    create: { roomNumber: '102', capacity: 4 }
  });

  const room3 = await prisma.room.upsert({
    where: { roomNumber: '201' },
    update: {},
    create: { roomNumber: '201', capacity: 4 }
  });

  const passwordHash = await bcrypt.hash('123456', 10);

  // 2. Create Students & Profiles
  const studentsData = [
    {
      name: 'Ava Carter',
      email: 'ava.carter@university.edu',
      studentId: 'STU1001',
      gender: 'FEMALE',
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
        bio: 'Computer Science sophomore. I love quiet reading, early mornings, and a tidy room!'
      }
    },
    {
      name: 'Noah Brooks',
      email: 'noah.brooks@university.edu',
      studentId: 'STU1002',
      gender: 'MALE',
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: true,
        cleanliness: 4,
        studyStyle: 'MUSIC',
        tempPreference: 'COLD',
        socialLevel: 'EXTROVERT',
        dealBreakers: JSON.stringify([]),
        bio: 'Engineering junior. Passionate about robotics, music, and late-night coding sessions.'
      }
    },
    {
      name: 'Mina Patel',
      email: 'mina.patel@university.edu',
      studentId: 'STU1003',
      gender: 'FEMALE',
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'LOW',
        smoking: false,
        smokingTolerant: false,
        cleanliness: 4,
        studyStyle: 'QUIET',
        tempPreference: 'MEDIUM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify(['SMOKING']),
        bio: 'Biology major aiming for med school. Highly organized and respectful of study time.'
      }
    },
    {
      name: 'Liam Chen',
      email: 'liam.chen@university.edu',
      studentId: 'STU1004',
      gender: 'MALE',
      profile: {
        sleepSchedule: 'EARLY',
        noiseTolerance: 'MEDIUM',
        smoking: false,
        smokingTolerant: true,
        cleanliness: 4,
        studyStyle: 'QUIET',
        tempPreference: 'WARM',
        socialLevel: 'INTROVERT',
        dealBreakers: JSON.stringify([]),
        bio: 'Business & Finance senior. Friendly, focused, and looking for calm roommates.'
      }
    },
    {
      name: 'Sofia Rodriguez',
      email: 'sofia.rodriguez@university.edu',
      studentId: 'STU1005',
      gender: 'FEMALE',
      profile: {
        sleepSchedule: 'LATE',
        noiseTolerance: 'HIGH',
        smoking: false,
        smokingTolerant: true,
        cleanliness: 3,
        studyStyle: 'GROUP',
        tempPreference: 'MEDIUM',
        socialLevel: 'EXTROVERT',
        dealBreakers: JSON.stringify([]),
        bio: 'Arts & Design student. Love hosting movie nights and group projects!'
      }
    }
  ];

  for (const s of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        studentId: s.studentId,
        password: passwordHash,
        gender: s.gender,
        role: 'STUDENT',
      }
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        ...s.profile
      }
    });
  }

  // 3. Create Demo Group
  const ava = await prisma.user.findUnique({ where: { email: 'ava.carter@university.edu' } });
  const mina = await prisma.user.findUnique({ where: { email: 'mina.patel@university.edu' } });

  if (ava && mina) {
    const demoGroup = await prisma.group.create({
      data: {
        name: 'Scholar Sanctuary',
        roomId: room1.id,
        isLocked: false,
        members: {
          connect: [{ id: ava.id }, { id: mina.id }]
        }
      }
    });

    // Create demo messages
    await prisma.message.createMany({
      data: [
        {
          content: 'Hey Mina! Super excited to be in the same group!',
          senderId: ava.id,
          groupId: demoGroup.id
        },
        {
          content: 'Me too Ava! Room 101 looks amazing.',
          senderId: mina.id,
          groupId: demoGroup.id
        }
      ]
    });
  }

  // 4. Create Admin User
  await prisma.user.upsert({
    where: { email: 'admin@roomsync.edu' },
    update: {},
    create: {
      name: 'University Admin',
      email: 'admin@roomsync.edu',
      password: passwordHash,
      role: 'ADMIN'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
