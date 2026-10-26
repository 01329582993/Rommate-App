import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Flame,
  RotateCcw,
  X,
  Star,
  Heart,
  Zap,
  Info,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  GraduationCap,
  DollarSign,
  Calendar,
  Moon,
  Sun,
  ShieldCheck,
  MessageSquare,
  Users,
  ChevronDown,
  Volume2,
  CigaretteOff,
  Dog,
  CheckCircle2,
  ThumbsUp,
  Award,
  PenTool,
  Check,
} from 'lucide-react-native';
import { apiRequest, getStoredUser } from '../../src/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export interface RoommateReview {
  id: string;
  authorName: string;
  authorAvatar: string;
  relationship: string;
  rating: number;
  date: string;
  comment: string;
  endorsements: string[];
  helpfulCount: number;
  isHelpfulActive?: boolean;
}

export interface RoommateCandidate {
  id: string;
  name: string;
  studentId?: string;
  age: number;
  university: string;
  department: string;
  year: string;
  distance: string;
  matchScore: number;
  budget: string;
  moveIn: string;
  photos: string[];
  bio: string;
  sleepSchedule: 'EARLY' | 'LATE';
  cleanliness: number;
  noiseTolerance: string;
  smoking: boolean;
  pets: boolean;
  tags: string[];
  compatibilityReasons: { title: string; desc: string }[];
  housingType: string;
  reviews: RoommateReview[];
}

const CANDIDATES_DATA: RoommateCandidate[] = [
  {
    id: 'cand-1',
    name: 'Tanzimul Haque',
    studentId: '200041102',
    age: 22,
    university: 'Islamic University of Technology (IUT)',
    department: 'Computer Science & Engineering',
    year: 'Senior (4th Year)',
    distance: 'South Hall • Room 204',
    matchScore: 98,
    budget: 'IUT South Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'CSE 20th batch from Dhaka. Competitive programmer, active in IUT Computer Society. Respects quiet study hours and keeps desk space clean. Looking for a studious roommate in South Hall.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low / Quiet during study hours',
    smoking: false,
    pets: false,
    tags: ['💻 Code & Coffee', '🧹 Spotless Tidy', '☕ Tea Lover', '📚 Quiet Study', '🕌 Prayer Focus'],
    compatibilityReasons: [
      { title: 'Non-Smoker Dorm', desc: 'Both strictly prefer a clean-air, smoke-free space.' },
      { title: 'Cleanliness Standards', desc: 'Both rate cleanliness 5/5 and keep work desks neat.' },
      { title: 'Coding Schedules', desc: 'Respects weekday night study sessions and quiet after 11 PM.' },
    ],
    housingType: 'South Hall 4-Bed Dormitory',
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Limas Soubello',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        relationship: 'Former Hall Roommate (SH 204)',
        rating: 5,
        date: '1 month ago',
        comment: 'Tanzimul is an exceptional roommate! Super organized, always considerate during late night hackathons, and shares study snacks.',
        endorsements: ['🧹 Spotless Desk', '🤫 Super Quiet', '🤝 Great Communicator'],
        helpfulCount: 16,
      },
      {
        id: 'rev-2',
        authorName: 'Mamadou Diallo',
        authorAvatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=120&auto=format&fit=crop&q=80',
        relationship: 'Robotics Club Teammate',
        rating: 5,
        date: '2 months ago',
        comment: 'Great peer to live and work with. Very respectful of prayer hours and sleep schedules.',
        endorsements: ['📚 Study Focus', '🤝 Dependable'],
        helpfulCount: 11,
      },
    ],
  },
  {
    id: 'cand-2',
    name: 'Mamadou Diallo',
    studentId: '200021103',
    age: 22,
    university: 'Islamic University of Technology (IUT)',
    department: 'Electrical & Electronic Engineering',
    year: 'Senior (4th Year)',
    distance: 'North Hall • Room 105',
    matchScore: 96,
    budget: 'IUT North Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'EEE international senior from Dakar, Senegal. Robotics enthusiast, early riser for Fajr prayer, very organized and friendly North Hall resident. Quiet, polite, and respectful of personal space.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Moderate / Headphones preferred',
    smoking: false,
    pets: false,
    tags: ['☀️ Early Riser', '⚡ EEE Robotics', '☕ Dakar Coffee', '🪴 Plant Parent', '🎧 Headphones'],
    compatibilityReasons: [
      { title: 'Morning Routine', desc: 'Both wake up early for lectures and morning routine.' },
      { title: 'Quiet Consideration', desc: 'Uses noise-cancelling headphones for study focus.' },
    ],
    housingType: 'North Hall 4-Bed Dormitory',
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Ibrahim Ousmane',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        relationship: 'Hall Neighbor',
        rating: 5,
        date: '3 weeks ago',
        comment: 'Mamadou keeps the room in immaculate condition. Always polite, quiet in the mornings, and helpful with electronics projects.',
        endorsements: ['🧹 Always Clean', '☀️ Respectful Early Riser'],
        helpfulCount: 12,
      },
    ],
  },
  {
    id: 'cand-3',
    name: 'Nusrat Jahan',
    studentId: '200042104',
    age: 21,
    university: 'Islamic University of Technology (IUT)',
    department: 'Software Engineering',
    year: 'Senior (4th Year)',
    distance: 'FHR • 2nd Floor (Room 201)',
    matchScore: 95,
    budget: 'IUT Female Hall (FHR)',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'SWE senior residing in FHR (Female Hall). High cleanliness standards, quiet nighttime study habits, tea lover, and active in Women in Tech. Looking for a respectful roommate for the semester.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low / Quiet during study hours',
    smoking: false,
    pets: false,
    tags: ['💻 Software Eng', '🧹 Spotless Room', '🍵 Chai Lover', '📚 Exam Focus', '✨ Organized'],
    compatibilityReasons: [
      { title: 'Tidy Space', desc: 'Strict adherence to keeping shared living quarters spotless.' },
      { title: 'Academic Dedication', desc: 'Quiet environment focused on software engineering.' },
    ],
    housingType: 'FHR Hall 4-Bed Room',
    reviews: [
      {
        id: 'rev-4',
        authorName: 'Fatoumata Bamba',
        authorAvatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=120&auto=format&fit=crop&q=80',
        relationship: 'FHR Roommate',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Nusrat is the most considerate roommate! Never makes noise when others are studying or sleeping, and our room is always clean.',
        endorsements: ['🧹 Spotless Living', '🤫 Super Quiet'],
        helpfulCount: 9,
      },
    ],
  },
  {
    id: 'cand-4',
    name: 'Ibrahim Ousmane',
    studentId: '210011105',
    age: 21,
    university: 'Islamic University of Technology (IUT)',
    department: 'Mechanical Engineering',
    year: 'Junior (3rd Year)',
    distance: 'South Hall • Room 312',
    matchScore: 93,
    budget: 'IUT South Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'MCE junior from Niamey, Niger. Passionate about automotive design, football on campus playground, and keeping common hall space neat and orderly. Friendly and dependable roommate.',
    sleepSchedule: 'EARLY',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    pets: false,
    tags: ['⚽ Campus Football', '🔧 Mechanical Eng', '🤝 Easy Going', '🌅 Early Bird'],
    compatibilityReasons: [
      { title: 'Balanced Schedule', desc: 'Balances engineering studies with campus sports.' },
      { title: 'Friendly Dynamic', desc: 'Easy-going, communicative, and cooperative.' },
    ],
    housingType: 'South Hall 4-Bed Dormitory',
    reviews: [],
  },
  {
    id: 'cand-5',
    name: 'Fatoumata Bamba',
    studentId: '210041106',
    age: 21,
    university: 'Islamic University of Technology (IUT)',
    department: 'Computer Science & Engineering',
    year: 'Junior (3rd Year)',
    distance: 'FHR • 2nd Floor (Room 201)',
    matchScore: 92,
    budget: 'IUT Female Hall (FHR)',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: "IUT CSE junior from Abidjan, Côte d'Ivoire. Loving data structures, AI research, and weekend baking in FHR. Respects roommate privacy and study time. Seeking an organized roommate.",
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low / Quiet during study hours',
    smoking: false,
    pets: false,
    tags: ['🤖 AI Research', '🧁 Weekend Baker', '🧹 Neat & Tidy', '🤫 Quiet Evenings'],
    compatibilityReasons: [
      { title: 'Study Priority', desc: 'Both dedicate evenings to quiet academic focus.' },
      { title: 'Respect for Privacy', desc: 'Always asks before inviting guests into the room.' },
    ],
    housingType: 'FHR Hall 4-Bed Room',
    reviews: [],
  },
  {
    id: 'cand-6',
    name: 'Farhan Shadman',
    studentId: '210051107',
    age: 21,
    university: 'Islamic University of Technology (IUT)',
    department: 'Civil & Environmental Engineering',
    year: 'Junior (3rd Year)',
    distance: 'North Hall • Room 402',
    matchScore: 90,
    budget: 'IUT North Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'Civil Engineering 21st batch from Sylhet. Clean habits, gym regular at IUT gymnasium, podcast listener with headphones, and reliable roommate. Always shares hall utilities fairly.',
    sleepSchedule: 'LATE',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    pets: false,
    tags: ['🏋️ Gym Regular', '📐 Civil Eng', '🎧 Podcasts', '🧹 Tidy Room'],
    compatibilityReasons: [
      { title: 'Noise Consideration', desc: 'Always listens with headphones to keep room quiet.' },
    ],
    housingType: 'North Hall 4-Bed Dormitory',
    reviews: [],
  },
  {
    id: 'cand-7',
    name: 'Aminata Traoré',
    studentId: '210042108',
    age: 21,
    university: 'Islamic University of Technology (IUT)',
    department: 'Software Engineering',
    year: 'Junior (3rd Year)',
    distance: 'FHR • 3rd Floor (Room 305)',
    matchScore: 89,
    budget: 'IUT Female Hall (FHR)',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'Software Engineering student from Bamako, Mali. Quiet study routines, neat room habits, loves French & English literature and UI design. Calm and peaceful roommate.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low / Quiet during study hours',
    smoking: false,
    pets: false,
    tags: ['🎨 UI Design', '📚 Literature', '🤫 Quiet Focus', '✨ Spotless'],
    compatibilityReasons: [
      { title: 'Quiet Rest', desc: 'Consistent quiet hours during study and sleep time.' },
    ],
    housingType: 'FHR Hall 4-Bed Room',
    reviews: [],
  },
  {
    id: 'cand-8',
    name: 'Kofi Mensah',
    studentId: '220021109',
    age: 20,
    university: 'Islamic University of Technology (IUT)',
    department: 'Electrical & Electronic Engineering',
    year: 'Sophomore (2nd Year)',
    distance: 'South Hall • Room 312',
    matchScore: 88,
    budget: 'IUT South Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'EEE sophomore from Accra, Ghana. Hardware club member, music lover with headphones, polite and dependable roommate in South Hall. Non-smoker, clean and respectful.',
    sleepSchedule: 'LATE',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    pets: false,
    tags: ['⚡ Circuits & IoT', '🎶 Afrobeats w/ Headphones', '🤝 Friendly Roomie'],
    compatibilityReasons: [
      { title: 'Mutual Space Respect', desc: 'Always mindful of roommate boundaries.' },
    ],
    housingType: 'South Hall 4-Bed Dormitory',
    reviews: [],
  },
  {
    id: 'cand-9',
    name: 'Ayesha Siddiqua',
    studentId: '220041110',
    age: 20,
    university: 'Islamic University of Technology (IUT)',
    department: 'Computer Science & Engineering',
    year: 'Sophomore (2nd Year)',
    distance: 'FHR • 3rd Floor (Room 305)',
    matchScore: 87,
    budget: 'IUT Female Hall (FHR)',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'CSE 22nd batch in FHR. Calm, organized, early sleeper. Loves reading tech blogs, practicing algorithm problems, and maintaining a spotless study table.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low / Quiet during study hours',
    smoking: false,
    pets: false,
    tags: ['💻 Algorithms', '📖 Reading', '🧹 Spotless Table', '☀️ Early Sleeper'],
    compatibilityReasons: [
      { title: 'Sleep Alignment', desc: 'Shares early bedtime and early morning routines.' },
    ],
    housingType: 'FHR Hall 4-Bed Room',
    reviews: [],
  },
  {
    id: 'cand-10',
    name: 'Samiul Islam',
    studentId: '220011111',
    age: 20,
    university: 'Islamic University of Technology (IUT)',
    department: 'Mechanical Engineering',
    year: 'Sophomore (2nd Year)',
    distance: 'North Hall • Room 105',
    matchScore: 86,
    budget: 'IUT North Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'MCE sophomore from Khulna. North Hall resident. Quiet study habits, early sleep routine, and respects personal boundaries. Organized and calm.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    pets: false,
    tags: ['⚙️ CAD Design', '🤫 Calm Demeanor', '🧹 Clean Dorm'],
    compatibilityReasons: [
      { title: 'Quiet Study', desc: 'Prioritizes study environment in the dorm room.' },
    ],
    housingType: 'North Hall 4-Bed Dormitory',
    reviews: [],
  },
  {
    id: 'cand-11',
    name: 'Zainab Abdullahi',
    studentId: '220042112',
    age: 20,
    university: 'Islamic University of Technology (IUT)',
    department: 'Software Engineering',
    year: 'Sophomore (2nd Year)',
    distance: 'FHR • 2nd Floor (Room 201)',
    matchScore: 85,
    budget: 'IUT Female Hall (FHR)',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'SWE sophomore from Kano, Nigeria. Friendly and respectful, diligent student, loves hot tea and keeps shared spaces clean and serene in FHR.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low / Quiet during study hours',
    smoking: false,
    pets: false,
    tags: ['💻 SWE Student', '🍵 Ginger Tea', '✨ Serene Space', '🤝 Friendly'],
    compatibilityReasons: [
      { title: 'Harmonious Living', desc: 'Values a quiet, tidy, and peaceful room atmosphere.' },
    ],
    housingType: 'FHR Hall 4-Bed Room',
    reviews: [],
  },
  {
    id: 'cand-12',
    name: 'Bakary Camara',
    studentId: '220051113',
    age: 20,
    university: 'Islamic University of Technology (IUT)',
    department: 'Civil & Environmental Engineering',
    year: 'Sophomore (2nd Year)',
    distance: 'South Hall • Room 204',
    matchScore: 84,
    budget: 'IUT South Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'Civil Engineering student from Banjul, The Gambia. Passionate about bridge design, campus sports, non-smoker, and very tidy roommate.',
    sleepSchedule: 'LATE',
    cleanliness: 4,
    noiseTolerance: 'Medium',
    smoking: false,
    pets: false,
    tags: ['🌉 Civil Eng', '⚽ Campus Sports', '🚭 Smoke Free', '🧹 Tidy Room'],
    compatibilityReasons: [
      { title: 'Smoke-Free Habit', desc: 'Both maintain a strictly smoke-free dorm.' },
    ],
    housingType: 'South Hall 4-Bed Dormitory',
    reviews: [],
  },
  {
    id: 'cand-13',
    name: 'Tasnia Tabassum',
    studentId: '220031114',
    age: 20,
    university: 'Islamic University of Technology (IUT)',
    department: 'Business & Technology Management',
    year: 'Sophomore (2nd Year)',
    distance: 'FHR • 3rd Floor (Room 305)',
    matchScore: 83,
    budget: 'IUT Female Hall (FHR)',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'BTM 22nd batch in FHR. Business case competition enthusiast, super organized, quiet night reader, and easy to communicate with.',
    sleepSchedule: 'EARLY',
    cleanliness: 5,
    noiseTolerance: 'Low',
    smoking: false,
    pets: false,
    tags: ['📊 Business & Tech', '📚 Night Reader', '✨ Super Organized'],
    compatibilityReasons: [
      { title: 'Cleanliness Pride', desc: 'Believes in maintaining spotless shared facilities.' },
    ],
    housingType: 'FHR Hall 4-Bed Room',
    reviews: [],
  },
  {
    id: 'cand-14',
    name: 'Ousmane Keita',
    studentId: '220041115',
    age: 20,
    university: 'Islamic University of Technology (IUT)',
    department: 'Computer Science & Engineering',
    year: 'Sophomore (2nd Year)',
    distance: 'North Hall • Room 402',
    matchScore: 82,
    budget: 'IUT North Hall',
    moveIn: 'Current Session 2026',
    photos: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85',
    ],
    bio: 'CSE student from Conakry, Guinea. Cyber-security enthusiast, badminton player, quiet and considerate roommate in North Hall.',
    sleepSchedule: 'LATE',
    cleanliness: 5,
    noiseTolerance: 'Low / Quiet during study hours',
    smoking: false,
    pets: false,
    tags: ['🛡️ Cyber Security', '🏸 Badminton', '🤫 Considerate', '🕌 Prayers'],
    compatibilityReasons: [
      { title: 'Tech Alignment', desc: 'Passionate about software and cybersecurity.' },
    ],
    housingType: 'North Hall 4-Bed Dormitory',
    reviews: [],
  },
];

export default function TinderDiscoverScreen() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<RoommateCandidate[]>(CANDIDATES_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activeCandidateDetail, setActiveCandidateDetail] = useState<RoommateCandidate | null>(null);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedCandidate, setMatchedCandidate] = useState<RoommateCandidate | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCleanliness, setSelectedCleanliness] = useState<number>(0);
  const [selectedSchedule, setSelectedSchedule] = useState<'ALL' | 'EARLY' | 'LATE'>('ALL');
  const [myUserName, setMyUserName] = useState('You');

  // Review submission modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newRelationship, setNewRelationship] = useState('Former Roommate');
  const [newReviewText, setNewReviewText] = useState('');
  const [selectedEndorsements, setSelectedEndorsements] = useState<string[]>(['🧹 Super Clean', '🤫 Respects Quiet Hours']);

  // Animated values for Tinder Card Swiping
  const position = useRef(new Animated.ValueXY()).current;
  const history = useRef<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const user = await getStoredUser();
        if (user?.name) setMyUserName(user.name.split(' ')[0]);

        // Fetch matches dynamically from backend
        const apiMatches = await apiRequest('/api/matches').catch(() => null);
        if (Array.isArray(apiMatches) && apiMatches.length > 3) {
          console.log(`[Discover] Loaded ${apiMatches.length} dynamic matches from database`);
        }
      } catch (e) {}
    })();
  }, []);

  // Card Rotation on Drag
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-24deg', '0deg', '24deg'],
    extrapolate: 'clamp',
  });

  const rotateAndTranslate = {
    transform: [
      { rotate },
      ...position.getTranslateTransform(),
    ],
  };

  // Stamp Opacities
  const likeOpacity = position.x.interpolate({
    inputRange: [15, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const superLikeOpacity = position.y.interpolate({
    inputRange: [-SCREEN_HEIGHT / 4, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Next Card Scale & Opacity
  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.85, 1],
    extrapolate: 'clamp',
  });

  // ─── SWIPE ENGINE ────────────────────────────────────────────────────────────
  const onSwipeComplete = (direction: 'left' | 'right' | 'up') => {
    setCurrentIndex(prev => {
      const idx = prev;
      const swipedItem = candidates[idx];
      history.current.push(idx);

      if ((direction === 'right' || direction === 'up') && swipedItem) {
        // Persist like to database
        apiRequest('/api/matches/like', {
          method: 'POST',
          body: { toId: swipedItem.id },
        }).catch(() => {});

        if (swipedItem.matchScore >= 90 || direction === 'up') {
          setMatchedCandidate(swipedItem);
          setMatchModalVisible(true);
        }
      } else if (direction === 'left' && swipedItem) {
        // Persist pass to database
        apiRequest('/api/matches/pass', {
          method: 'POST',
          body: { toId: swipedItem.id },
        }).catch(() => {});
      }

      return prev + 1;
    });

    position.setValue({ x: 0, y: 0 });
    setPhotoIndex(0);
  };

  const forceSwipe = (direction: 'left' | 'right' | 'up') => {
    let toX = 0;
    let toY = 0;
    if (direction === 'right') toX = SCREEN_WIDTH + 120;
    else if (direction === 'left') toX = -SCREEN_WIDTH - 120;
    else if (direction === 'up') toY = -SCREEN_HEIGHT - 120;

    Animated.timing(position, {
      toValue: { x: toX, y: toY },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          position.setValue({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > SWIPE_THRESHOLD) {
            forceSwipe('right');
          } else if (gestureState.dx < -SWIPE_THRESHOLD) {
            forceSwipe('left');
          } else if (gestureState.dy < -SWIPE_THRESHOLD * 1.2) {
            forceSwipe('up');
          } else {
            resetPosition();
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, candidates]
  );

  const handleRewind = () => {
    if (history.current.length > 0) {
      const lastIndex = history.current.pop()!;
      setCurrentIndex(lastIndex);
      setPhotoIndex(0);
      position.setValue({ x: 0, y: 0 });
    } else {
      if (Platform.OS === 'web') {
        window.alert('No previous roommate cards to rewind!');
      } else {
        Alert.alert('Rewind', 'No previous cards to undo!');
      }
    }
  };

  const handlePass = () => forceSwipe('left');
  const handleLike = () => forceSwipe('right');
  const handleSuperLike = () => forceSwipe('up');

  const handlePhotoTap = (e: any, candidatePhotos: string[]) => {
    const touchX = e.nativeEvent.locationX;
    const cardWidth = SCREEN_WIDTH - 24;
    if (touchX < cardWidth * 0.4) {
      setPhotoIndex(prev => Math.max(0, prev - 1));
    } else {
      setPhotoIndex(prev => Math.min(candidatePhotos.length - 1, prev + 1));
    }
  };

  const handleResetDeck = () => {
    setCurrentIndex(0);
    setPhotoIndex(0);
    history.current = [];
    position.setValue({ x: 0, y: 0 });
  };

  // Toggle helpful thumbs on a review
  const handleToggleHelpful = (candidateId: string, reviewId: string) => {
    setCandidates(prev =>
      prev.map(cand => {
        if (cand.id !== candidateId) return cand;
        const updatedReviews = cand.reviews.map(rev => {
          if (rev.id !== reviewId) return rev;
          const isActive = rev.isHelpfulActive;
          return {
            ...rev,
            helpfulCount: isActive ? rev.helpfulCount - 1 : rev.helpfulCount + 1,
            isHelpfulActive: !isActive,
          };
        });
        const updatedCand = { ...cand, reviews: updatedReviews };
        if (activeCandidateDetail?.id === candidateId) {
          setActiveCandidateDetail(updatedCand);
        }
        return updatedCand;
      })
    );

    // Sync helpful vote with database
    try {
      apiRequest(`/api/reviews/helpful/${reviewId}`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
  };

  // Submit new review
  const handleSubmitReview = async () => {
    if (!newReviewText.trim()) {
      Alert.alert('Review Required ✍️', 'Please write a few words about your roommate experience.');
      return;
    }

    if (!activeCandidateDetail) return;

    const newRev: RoommateReview = {
      id: 'rev-' + Date.now(),
      authorName: myUserName || 'Student Peer',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      relationship: newRelationship,
      rating: newRating,
      date: 'Just now',
      comment: newReviewText.trim(),
      endorsements: selectedEndorsements,
      helpfulCount: 1,
      isHelpfulActive: true,
    };

    setCandidates(prev =>
      prev.map(cand => {
        if (cand.id !== activeCandidateDetail.id) return cand;
        const updatedReviews = [newRev, ...cand.reviews];
        const updatedCand = { ...cand, reviews: updatedReviews };
        setActiveCandidateDetail(updatedCand);
        return updatedCand;
      })
    );

    // Save to Prisma SQLite database
    try {
      apiRequest(`/api/reviews/${activeCandidateDetail.id}`, {
        method: 'POST',
        body: {
          rating: newRating,
          relationship: newRelationship,
          comment: newReviewText.trim(),
          endorsements: selectedEndorsements,
        },
      }).catch(err => console.warn('Review database sync fallback:', err));
    } catch (e) {}

    setNewReviewText('');
    setReviewModalVisible(false);

    if (Platform.OS === 'web') {
      window.alert(`Review published for ${activeCandidateDetail.name}! ⭐ Thank you for building campus trust.`);
    } else {
      Alert.alert(
        'Review Published! 🎉',
        `Thank you for contributing to campus trust. Your vibe check for ${activeCandidateDetail.name} is now live!`
      );
    }
  };

  const toggleEndorsementTag = (tag: string) => {
    setSelectedEndorsements(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const currentCandidate = candidates[currentIndex];

  const RELATION_OPTIONS = [
    'Former Roommate',
    'Dorm Floormate / Neighbor',
    'Study Partner',
    'Campus Classmate',
  ];

  const ENDORSEMENT_OPTIONS = [
    '🧹 Super Clean',
    '🤫 Respects Quiet Hours',
    '💵 Pays Rent on Time',
    '🍲 Great Cook',
    '✨ Friendly & Kind',
    '🐶 Pet Friendly',
    '🤝 Great Communicator',
    '📚 Serious Student',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* TOP TINDER HEADER — profile avatar left, brand center, filter right */}
      <View style={styles.topHeader}>
        {/* PROFILE AVATAR — top left like Tinder */}
        <TouchableOpacity
          style={styles.profileAvatarBtn}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            }}
            style={styles.profileAvatarImg}
          />
          <View style={styles.profileOnlineDot} />
        </TouchableOpacity>

        {/* CENTER: IUT Logo + Brand */}
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/iut_logo.png')}
            style={styles.iutHeaderLogo}
          />
          <Text style={styles.brandTitle}>IUT RoomSync</Text>
        </View>

        {/* RIGHT: Filter */}
        <TouchableOpacity
          style={styles.filterHeaderBtn}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* MAIN SWIPE DECK AREA */}
      <View style={styles.deckContainer}>
        {currentIndex >= candidates.length ? (
          /* EMPTY DECK STATE */
          <View style={styles.emptyState}>
            <View style={styles.radarCircleOuter}>
              <View style={styles.radarCircleMid}>
                <View style={styles.radarCircleInner}>
                  <Flame size={44} color="#FF4458" />
                </View>
              </View>
            </View>
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptySubtitle}>
              You've browsed all {candidates.length} roommate candidates in your area.
            </Text>
            <TouchableOpacity style={styles.resetDeckBtn} onPress={handleResetDeck} activeOpacity={0.85}>
              <RotateCcw size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.resetDeckBtnText}>Browse All {candidates.length} Roommates Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* CARD STACK */
          candidates
            .map((item, index) => {
              if (index < currentIndex) return null;

              const isTopCard = index === currentIndex;
              const cardPhotos = item.photos;
              const currentPhotoUrl = cardPhotos[isTopCard ? photoIndex : 0] || cardPhotos[0];

              if (isTopCard) {
                return (
                  <Animated.View
                    key={item.id}
                    style={[styles.card, rotateAndTranslate]}
                    {...panResponder.panHandlers}
                  >
                    {/* PHOTO & TAP HITBOX */}
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={(e) => handlePhotoTap(e, cardPhotos)}
                      style={styles.cardImageTouch}
                    >
                      <Image source={{ uri: currentPhotoUrl }} style={styles.cardImage} resizeMode="cover" />

                      {/* TINDER STORY PROGRESS BARS */}
                      <View style={styles.storyBarsContainer}>
                        {cardPhotos.map((_, pIdx) => (
                          <View
                            key={pIdx}
                            style={[
                              styles.storyBar,
                              {
                                backgroundColor:
                                  pIdx === photoIndex
                                    ? '#FFFFFF'
                                    : 'rgba(255, 255, 255, 0.4)',
                              },
                            ]}
                          />
                        ))}
                      </View>

                      {/* MATCH SCORE PILL */}
                      <View style={styles.matchScoreBadge}>
                        <Sparkles size={14} color="#fff" />
                        <Text style={styles.matchScoreText}>{item.matchScore}% Match</Text>
                      </View>

                      {/* STAMP: MATCH (Right Drag) */}
                      <Animated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
                        <Text style={styles.likeStampText}>MATCH</Text>
                      </Animated.View>

                      {/* STAMP: PASS (Left Drag) */}
                      <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
                        <Text style={styles.nopeStampText}>PASS</Text>
                      </Animated.View>

                      {/* BOTTOM GRADIENT INFO OVERLAY */}
                      <View style={styles.cardOverlayGradient}>
                        <View style={styles.cardInfoRow}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.nameAgeRow}>
                              <Text style={styles.cardName}>{item.name}</Text>
                              <Text style={styles.cardAge}>{item.age}</Text>
                              {item.studentId ? (
                                <View style={styles.iutIdPill}>
                                  <Text style={styles.iutIdPillText}>ID: {item.studentId}</Text>
                                </View>
                              ) : null}
                              <ShieldCheck size={20} color="#006A4E" style={{ marginLeft: 6 }} />
                            </View>

                            <View style={styles.infoMetaRow}>
                              <GraduationCap size={15} color="#CBD5E1" />
                              <Text style={styles.metaText} numberOfLines={1}>
                                {item.department} • {item.year}
                              </Text>
                            </View>

                            <View style={styles.infoMetaRow}>
                              <MapPin size={15} color="#CBD5E1" />
                              <Text style={styles.metaText}>{item.distance}</Text>
                              <Text style={styles.metaDot}>•</Text>
                              <DollarSign size={15} color="#10B981" />
                              <Text style={[styles.metaText, { color: '#6EE7B7', fontWeight: '700' }]}>
                                {item.budget}
                              </Text>
                            </View>
                          </View>

                          {/* INFO BUTTON (Opens Detailed Sheet) */}
                          <TouchableOpacity
                            style={styles.infoButton}
                            onPress={() => setActiveCandidateDetail(item)}
                            activeOpacity={0.8}
                          >
                            <Info size={22} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>

                        {/* LIFESTYLE TAGS & REVIEW SUMMARY PILL */}
                        <View style={styles.tagsContainer}>
                          <View style={[styles.tagPill, { backgroundColor: 'rgba(245, 158, 11, 0.3)' }]}>
                            <Star size={11} color="#FDE047" fill="#FDE047" style={{ marginRight: 4 }} />
                            <Text style={[styles.tagText, { color: '#FEF08A' }]}>
                              5.0★ ({item.reviews?.length || 1} Reviews)
                            </Text>
                          </View>
                          {item.tags.slice(0, 2).map((tag, tIdx) => (
                            <View key={tIdx} style={styles.tagPill}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              } else if (index === currentIndex + 1) {
                /* NEXT CARD BEHIND */
                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.card,
                      styles.cardBehind,
                      {
                        transform: [{ scale: nextCardScale }],
                        opacity: nextCardOpacity,
                      },
                    ]}
                  >
                    <Image source={{ uri: currentPhotoUrl }} style={styles.cardImage} resizeMode="cover" />
                    <View style={styles.cardOverlayGradient}>
                      <View style={styles.nameAgeRow}>
                        <Text style={styles.cardName}>{item.name}</Text>
                        <Text style={styles.cardAge}>{item.age}</Text>
                      </View>
                      <Text style={styles.metaText}>{item.department}</Text>
                    </View>
                  </Animated.View>
                );
              }
              return null;
            })
            .reverse()
        )}
      </View>

      {/* SIMPLIFIED ROOMMATE ACTIONS */}
      {currentIndex < candidates.length && (
        <View style={styles.bottomActionsBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnNope]}
            onPress={handlePass}
            activeOpacity={0.8}
            accessibilityLabel="Pass roommate"
          >
            <X size={28} color="#EF4444" strokeWidth={2.8} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.btnInfoAction]}
            onPress={() => currentCandidate && setActiveCandidateDetail(currentCandidate)}
            activeOpacity={0.8}
            accessibilityLabel="View roommate details"
          >
            <Info size={26} color="#006A4E" strokeWidth={2.4} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.btnLike]}
            onPress={handleLike}
            activeOpacity={0.8}
            accessibilityLabel="Connect with roommate"
          >
            <Check size={32} color="#059669" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================================= */}
      {/* DETAILED TINDER PROFILE MODAL SHEET WITH PEER REVIEWS */}
      {/* ========================================================================= */}
      <Modal
        visible={!!activeCandidateDetail}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActiveCandidateDetail(null)}
      >
        {activeCandidateDetail && (
          <View style={styles.detailContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 160 }}
            >
              {/* PHOTO SLIDER HEADER */}
              <View style={styles.detailPhotoHeader}>
                <Image
                  source={{ uri: activeCandidateDetail.photos[0] }}
                  style={styles.detailMainPhoto}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setActiveCandidateDetail(null)}
                  activeOpacity={0.8}
                >
                  <ChevronDown size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.detailSyncFloatingPill}>
                  <Sparkles size={16} color="#fff" />
                  <Text style={styles.detailSyncFloatingText}>
                    {activeCandidateDetail.matchScore}% Compatibility
                  </Text>
                </View>
              </View>

              {/* PROFILE BODY */}
              <View style={styles.detailBody}>
                <View style={styles.nameAgeRow}>
                  <Text style={styles.detailName}>{activeCandidateDetail.name}</Text>
                  <Text style={styles.detailAge}>{activeCandidateDetail.age}</Text>
                  {activeCandidateDetail.studentId ? (
                    <View style={styles.iutIdPill}>
                      <Text style={styles.iutIdPillText}>ID: {activeCandidateDetail.studentId}</Text>
                    </View>
                  ) : null}
                  <ShieldCheck size={24} color="#006A4E" style={{ marginLeft: 8 }} />
                </View>

                <Text style={styles.detailDept}>
                  🎓 {activeCandidateDetail.department} ({activeCandidateDetail.year})
                </Text>
                <Text style={styles.detailUniversity}>🏛️ {activeCandidateDetail.university}</Text>
                <Text style={styles.detailDistance}>📍 {activeCandidateDetail.distance}</Text>

                <View style={styles.detailDivider} />

                {/* ABOUT ME BIO */}
                <Text style={styles.sectionHeader}>About Me & Rooming Style</Text>
                <Text style={styles.detailBioText}>{activeCandidateDetail.bio}</Text>

                {/* HOUSING & BUDGET BOX */}
                <View style={styles.highlightBox}>
                  <View style={styles.highlightRow}>
                    <DollarSign size={20} color="#10B981" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.highlightLabel}>Monthly Budget</Text>
                      <Text style={styles.highlightVal}>{activeCandidateDetail.budget}</Text>
                    </View>
                  </View>
                  <View style={[styles.highlightRow, { marginTop: 12 }]}>
                    <Calendar size={20} color="#6366F1" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.highlightLabel}>Target Move-in</Text>
                      <Text style={styles.highlightVal}>{activeCandidateDetail.moveIn}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                {/* WHY YOU MATCH REASONS */}
                <Text style={styles.sectionHeader}>Why You Two Match ✨</Text>
                {activeCandidateDetail.compatibilityReasons.map((reason, rIdx) => (
                  <View key={rIdx} style={styles.reasonCard}>
                    <CheckCircle2 size={20} color="#10B981" style={{ marginTop: 2 }} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.reasonTitle}>{reason.title}</Text>
                      <Text style={styles.reasonDesc}>{reason.desc}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.detailDivider} />

                {/* LIFESTYLE & HABITS MATRIX */}
                <Text style={styles.sectionHeader}>Living Habits Matrix</Text>
                <View style={styles.habitsGrid}>
                  <View style={styles.habitCard}>
                    <Text style={styles.habitIcon}>🧹</Text>
                    <Text style={styles.habitLabel}>Cleanliness</Text>
                    <Text style={styles.habitVal}>{activeCandidateDetail.cleanliness} / 5 Rating</Text>
                  </View>
                  <View style={styles.habitCard}>
                    <Text style={styles.habitIcon}>
                      {activeCandidateDetail.sleepSchedule === 'EARLY' ? '☀️' : '🌙'}
                    </Text>
                    <Text style={styles.habitLabel}>Sleep Schedule</Text>
                    <Text style={styles.habitVal}>
                      {activeCandidateDetail.sleepSchedule === 'EARLY' ? 'Early Riser' : 'Night Owl'}
                    </Text>
                  </View>
                  <View style={styles.habitCard}>
                    <Text style={styles.habitIcon}>🎧</Text>
                    <Text style={styles.habitLabel}>Noise Tolerance</Text>
                    <Text style={styles.habitVal}>{activeCandidateDetail.noiseTolerance}</Text>
                  </View>
                  <View style={styles.habitCard}>
                    <Text style={styles.habitIcon}>🚭</Text>
                    <Text style={styles.habitLabel}>Smoking</Text>
                    <Text style={styles.habitVal}>
                      {activeCandidateDetail.smoking ? 'Smoking OK' : 'Non-Smoker'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                {/* ================================================================= */}
                {/* 🌟 PEER REVIEWS & VIBE CHECKS SECTION */}
                {/* ================================================================= */}
                <View style={styles.reviewsHeaderWrap}>
                  <Text style={styles.sectionHeader}>Roommate Reviews & Vibe Checks 🌟</Text>
                  <Text style={styles.reviewsSubhead}>
                    Verified feedback from previous roommates & dorm floormates
                  </Text>
                </View>

                {/* RATING SUMMARY CARD */}
                <View style={styles.ratingSummaryCard}>
                  <View style={styles.ratingScoreBox}>
                    <Text style={styles.ratingBigNumber}>5.0</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} color="#F59E0B" fill="#F59E0B" style={{ marginHorizontal: 1 }} />
                      ))}
                    </View>
                    <Text style={styles.ratingCountText}>
                      {activeCandidateDetail.reviews?.length || 0} reviews
                    </Text>
                  </View>
                  <View style={styles.ratingStatsDivider} />
                  <View style={styles.ratingBadgesColumn}>
                    <View style={styles.badgeItem}>
                      <Award size={14} color="#10B981" />
                      <Text style={styles.badgeItemText}>100% On-Time Chores & Rent</Text>
                    </View>
                    <View style={styles.badgeItem}>
                      <ShieldCheck size={14} color="#3B82F6" />
                      <Text style={styles.badgeItemText}>Verified Campus Roommate</Text>
                    </View>
                    <View style={styles.badgeItem}>
                      <Moon size={14} color="#8B5CF6" />
                      <Text style={styles.badgeItemText}>Quiet Sleep Environment</Text>
                    </View>
                  </View>
                </View>

                {/* REVIEWS LIST */}
                {activeCandidateDetail.reviews && activeCandidateDetail.reviews.length > 0 ? (
                  activeCandidateDetail.reviews.map(rev => (
                    <View key={rev.id} style={styles.reviewCard}>
                      <View style={styles.reviewAuthorRow}>
                        <Image source={{ uri: rev.authorAvatar }} style={styles.reviewAvatar} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={styles.reviewAuthorNameRow}>
                            <Text style={styles.reviewAuthorName}>{rev.authorName}</Text>
                            <ShieldCheck size={14} color="#3B82F6" style={{ marginLeft: 4 }} />
                          </View>
                          <Text style={styles.reviewRelationship}>{rev.relationship}</Text>
                        </View>
                        <View style={styles.reviewRatingRight}>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={12}
                                color={s <= rev.rating ? '#F59E0B' : '#E2E8F0'}
                                fill={s <= rev.rating ? '#F59E0B' : '#E2E8F0'}
                              />
                            ))}
                          </View>
                          <Text style={styles.reviewDate}>{rev.date}</Text>
                        </View>
                      </View>

                      <Text style={styles.reviewComment}>"{rev.comment}"</Text>

                      {/* ENDORSEMENT BADGES */}
                      {rev.endorsements && rev.endorsements.length > 0 && (
                        <View style={styles.endorsementsRow}>
                          {rev.endorsements.map((tag, tIdx) => (
                            <View key={tIdx} style={styles.endorsementPill}>
                              <Text style={styles.endorsementText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* HELPFUL THUMB BUTTON */}
                      <TouchableOpacity
                        style={[styles.helpfulBtn, rev.isHelpfulActive && styles.helpfulBtnActive]}
                        onPress={() => handleToggleHelpful(activeCandidateDetail.id, rev.id)}
                        activeOpacity={0.7}
                      >
                        <ThumbsUp
                          size={13}
                          color={rev.isHelpfulActive ? '#FF4458' : '#64748B'}
                          fill={rev.isHelpfulActive ? '#FF4458' : 'none'}
                        />
                        <Text
                          style={[styles.helpfulBtnText, rev.isHelpfulActive && styles.helpfulBtnTextActive]}
                        >
                          Helpful ({rev.helpfulCount})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.noReviewsBox}>
                    <Text style={styles.noReviewsText}>No reviews yet. Be the first to leave a vibe check!</Text>
                  </View>
                )}

                {/* ── WRITE A REVIEW BUTTON (PROMINENTLY PLACED AFTER THE REVIEWS) ── */}
                <TouchableOpacity
                  style={styles.prominentWriteReviewBtn}
                  onPress={() => setReviewModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <PenTool size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.prominentWriteReviewText}>
                    Write a Review & Vibe Check for {activeCandidateDetail.name.split(' ')[0]} ✍️
                  </Text>
                </TouchableOpacity>

                {/* ADDITIONAL PHOTOS */}
                {activeCandidateDetail.photos.length > 1 && (
                  <View style={{ marginTop: 24 }}>
                    <Text style={styles.sectionHeader}>More Photos</Text>
                    {activeCandidateDetail.photos.slice(1).map((photoUrl, pIdx) => (
                      <Image
                        key={pIdx}
                        source={{ uri: photoUrl }}
                        style={styles.extraPhoto}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* FLOATING ACTION BUTTONS INSIDE DETAIL SHEET */}
            <View style={styles.detailFloatingActions}>
              <TouchableOpacity
                style={[styles.detailActionBtn, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                onPress={() => {
                  setActiveCandidateDetail(null);
                  handlePass();
                }}
                activeOpacity={0.8}
              >
                <X size={26} color="#EF4444" strokeWidth={2.8} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.detailActionBtn, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}
                onPress={() => {
                  setActiveCandidateDetail(null);
                  handleSuperLike();
                }}
                activeOpacity={0.8}
              >
                <Star size={24} color="#3B82F6" fill="#3B82F6" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.detailActionBtn, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}
                onPress={() => {
                  setActiveCandidateDetail(null);
                  handleLike();
                }}
                activeOpacity={0.8}
              >
                <Heart size={26} color="#10B981" fill="#10B981" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* ✍️ WRITE A ROOMMATE REVIEW / VIBE CHECK MODAL */}
      {/* ========================================================================= */}
      <Modal visible={reviewModalVisible} transparent animationType="slide" onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.reviewModalBackdrop}>
          <View style={styles.reviewModalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.reviewModalTopRow}>
              <Text style={styles.reviewModalTitle}>Leave a Roommate Review ✍️</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewModalSubtitle}>
              Share honest feedback about living or studying with {activeCandidateDetail?.name.split(' ')[0]} to help fellow students!
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* STAR RATING SELECTOR */}
              <Text style={styles.modalInputLabel}>Overall Roommate Rating</Text>
              <View style={styles.starRatingSelectRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setNewRating(s)}
                    style={styles.starTouchBtn}
                    activeOpacity={0.7}
                  >
                    <Star
                      size={32}
                      color={s <= newRating ? '#F59E0B' : '#E2E8F0'}
                      fill={s <= newRating ? '#F59E0B' : '#E2E8F0'}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.starRatingLabel}>{newRating} / 5 Stars</Text>
              </View>

              {/* RELATIONSHIP CHIPS */}
              <Text style={styles.modalInputLabel}>Your Relation to {activeCandidateDetail?.name.split(' ')[0]}</Text>
              <View style={styles.relationOptionsRow}>
                {RELATION_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.relationChip,
                      newRelationship === opt && styles.relationChipActive,
                    ]}
                    onPress={() => setNewRelationship(opt)}
                  >
                    <Text
                      style={[
                        styles.relationChipText,
                        newRelationship === opt && styles.relationChipTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ENDORSEMENT BADGES */}
              <Text style={styles.modalInputLabel}>Endorse Living Habits (Select all that apply)</Text>
              <View style={styles.endorseOptionsRow}>
                {ENDORSEMENT_OPTIONS.map(tag => {
                  const isSelected = selectedEndorsements.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.endorseChip, isSelected && styles.endorseChipActive]}
                      onPress={() => toggleEndorsementTag(tag)}
                    >
                      {isSelected && <Check size={12} color="#FF4458" style={{ marginRight: 4 }} />}
                      <Text style={[styles.endorseChipText, isSelected && styles.endorseChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* REVIEW TEXTAREA */}
              <Text style={styles.modalInputLabel}>Review & Comments</Text>
              <TextInput
                style={styles.reviewTextInput}
                placeholder={`What was it like rooming or sharing spaces with ${activeCandidateDetail?.name.split(' ')[0]}? (Cleanliness, noise, communication...)`}
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={newReviewText}
                onChangeText={setNewReviewText}
              />

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                style={styles.submitReviewBtn}
                onPress={handleSubmitReview}
                activeOpacity={0.85}
              >
                <Text style={styles.submitReviewBtnText}>Publish Roommate Review 🚀</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* "IT'S A ROOMMATE MATCH!" CELEBRATION MODAL */}
      {/* ========================================================================= */}
      <Modal visible={matchModalVisible} transparent animationType="fade">
        <View style={styles.matchModalBackdrop}>
          <View style={styles.matchModalContent}>
            <Text style={styles.matchModalScriptTitle}>It's a Match!</Text>
            <Text style={styles.matchModalSubtitle}>
              You and {matchedCandidate?.name.split(' ')[0]} both want to team up for campus housing!
            </Text>

            <View style={styles.matchAvatarsRow}>
              <View style={styles.matchAvatarWrapper}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
                  }}
                  style={styles.matchAvatarImg}
                />
              </View>
              <View style={styles.matchHeartBadge}>
                <Flame size={28} color="#fff" fill="#fff" />
              </View>
              <View style={[styles.matchAvatarWrapper, { marginLeft: -24 }]}>
                <Image
                  source={{ uri: matchedCandidate?.photos[0] || '' }}
                  style={styles.matchAvatarImg}
                />
              </View>
            </View>

            <Text style={styles.matchScoreHighlight}>
              🔥 {matchedCandidate?.matchScore}% Roommate Compatibility
            </Text>

            <TouchableOpacity
              style={styles.matchChatBtn}
              onPress={() => {
                setMatchModalVisible(false);
                if (matchedCandidate) {
                  router.push({
                    pathname: '/chat/[id]',
                    params: {
                      id: matchedCandidate.id,
                      name: matchedCandidate.name,
                      isGroup: 'false',
                    },
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <MessageSquare size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.matchChatBtnText}>Send Message to {matchedCandidate?.name.split(' ')[0]}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.matchKeepSwipingBtn}
              onPress={() => setMatchModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.matchKeepSwipingText}>Keep Browsing Roommates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* FILTER & PREFERENCES MODAL */}
      {/* ========================================================================= */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View style={styles.filterModalBackdrop}>
          <View style={styles.filterModalSheet}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Discovery Preferences</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Sleep Schedule</Text>
              <View style={styles.filterOptionsRow}>
                {(['ALL', 'EARLY', 'LATE'] as const).map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterChip,
                      selectedSchedule === option && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedSchedule(option)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSchedule === option && styles.filterChipTextActive,
                      ]}
                    >
                      {option === 'ALL' ? 'Any Schedule' : option === 'EARLY' ? '☀️ Early Bird' : '🌙 Night Owl'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Minimum Cleanliness Rating</Text>
              <View style={styles.filterOptionsRow}>
                {[0, 3, 4, 5].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.filterChip,
                      selectedCleanliness === rating && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCleanliness(rating)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCleanliness === rating && styles.filterChipTextActive,
                      ]}
                    >
                      {rating === 0 ? 'Any' : `${rating} Stars+ ⭐`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Max Monthly Rent Budget</Text>
              <View style={styles.filterBudgetBox}>
                <Text style={styles.filterBudgetText}>Up to $1,500 / month</Text>
              </View>

              <TouchableOpacity
                style={styles.applyFilterBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.applyFilterBtnText}>Apply Preferences</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileAvatarBtn: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  profileAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#006A4E',
  },
  profileOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iutHeaderLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  iutIdPill: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  iutIdPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006A4E',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#006A4E',
    letterSpacing: -0.5,
    marginLeft: 6,
  },
  filterHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* DECK */
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  cardBehind: {
    top: 0,
  },
  cardImageTouch: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  /* STORY BARS */
  storyBarsContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    zIndex: 10,
  },
  storyBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 3,
  },

  /* MATCH PILL */
  matchScoreBadge: {
    position: 'absolute',
    top: 24,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  matchScoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },

  /* STAMPS */
  stampContainer: {
    position: 'absolute',
    borderWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 20,
  },
  likeStamp: {
    top: 50,
    left: 20,
    borderColor: '#10B981',
    transform: [{ rotate: '-18deg' }],
  },
  likeStampText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
  },
  nopeStamp: {
    top: 50,
    right: 20,
    borderColor: '#EF4444',
    transform: [{ rotate: '18deg' }],
  },
  nopeStampText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 1,
  },
  superLikeStamp: {
    top: '40%',
    alignSelf: 'center',
    borderColor: '#3B82F6',
    transform: [{ rotate: '0deg' }],
  },
  superLikeStampText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 1,
  },

  /* GRADIENT OVERLAY */
  cardOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardAge: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E2E8F0',
    marginLeft: 8,
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginLeft: 6,
    fontWeight: '500',
  },
  metaDot: {
    color: '#64748B',
    marginHorizontal: 6,
  },
  infoButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* BOTTOM 5-ACTION BAR */
  bottomActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  btnRewind: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
  },
  btnNope: {
    width: 62,
    height: 62,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  btnSuperLike: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  btnLike: {
    width: 62,
    height: 62,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  btnInfoAction: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  btnBoost: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  radarCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(254, 226, 226, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  radarCircleMid: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(254, 202, 202, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircleInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resetDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4458',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetDeckBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* DETAILED PROFILE MODAL */
  detailContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailPhotoHeader: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.46,
    position: 'relative',
  },
  detailMainPhoto: {
    width: '100%',
    height: '100%',
  },
  detailCloseBtn: {
    position: 'absolute',
    top: 45,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSyncFloatingPill: {
    position: 'absolute',
    bottom: 16,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailSyncFloatingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  detailBody: {
    padding: 20,
  },
  detailName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailAge: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  detailDept: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 6,
  },
  detailUniversity: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  detailDistance: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  detailBioText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  highlightBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  highlightVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 17,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  habitCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  habitIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  habitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  habitVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },

  /* REVIEWS SECTION */
  reviewsHeaderWrap: {
    marginBottom: 12,
  },
  reviewsSubhead: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ratingSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  ratingScoreBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  ratingBigNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#92400E',
    lineHeight: 36,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  ratingCountText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  ratingStatsDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#FDE68A',
    marginHorizontal: 14,
  },
  ratingBadgesColumn: {
    flex: 1,
    gap: 4,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    marginLeft: 6,
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  reviewAuthorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAuthorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewRelationship: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  reviewRatingRight: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  endorsementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  endorsementPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endorsementText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpfulBtnActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  helpfulBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 5,
  },
  helpfulBtnTextActive: {
    color: '#FF4458',
    fontWeight: '700',
  },
  noReviewsBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  noReviewsText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },

  /* PROMINENT WRITE REVIEW BUTTON AFTER REVIEWS */
  prominentWriteReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4458',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    marginTop: 6,
    marginBottom: 16,
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  prominentWriteReviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  extraPhoto: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    marginTop: 10,
  },
  detailFloatingActions: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  detailActionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },

  /* WRITE REVIEW MODAL */
  reviewModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  reviewModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  reviewModalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewModalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
  },
  reviewModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 8,
  },
  starRatingSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  starTouchBtn: {
    padding: 4,
  },
  starRatingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
    marginLeft: 12,
  },
  relationOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relationChipActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FF4458',
  },
  relationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  relationChipTextActive: {
    color: '#FF4458',
    fontWeight: '800',
  },
  endorseOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  endorseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endorseChipActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FF4458',
  },
  endorseChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  endorseChipTextActive: {
    color: '#FF4458',
    fontWeight: '700',
  },
  reviewTextInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    minHeight: 85,
    textAlignVertical: 'top',
    color: '#0F172A',
  },
  submitReviewBtn: {
    backgroundColor: '#FF4458',
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* MATCH CELEBRATION MODAL */
  matchModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  matchModalContent: {
    width: '100%',
    alignItems: 'center',
  },
  matchModalScriptTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF4458',
    letterSpacing: -1,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  matchModalSubtitle: {
    fontSize: 15,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  matchAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  matchAvatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  matchAvatarImg: {
    width: '100%',
    height: '100%',
  },
  matchHeartBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF4458',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  matchScoreHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FDE047',
    marginBottom: 28,
  },
  matchChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#FF4458',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  matchChatBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  matchKeepSwipingBtn: {
    marginTop: 14,
    paddingVertical: 12,
  },
  matchKeepSwipingText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },

  /* FILTER MODAL */
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 10,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  filterBudgetBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBudgetText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  applyFilterBtn: {
    backgroundColor: '#FF4458',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
