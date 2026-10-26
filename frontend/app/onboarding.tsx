import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowRight, Moon, Sun, Volume2, Sparkles, BookOpen, User, Users, CheckCircle2, CigaretteOff, Cigarette } from 'lucide-react-native';
import { Theme } from '../src/theme';
import { apiRequest } from '../src/api';
import { useAuth } from '../src/AuthContext';

const BroomIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size - 4, color }}>🧹</Text>
  </View>
);

export default function OnboardingScreen() {
  const router = useRouter();
  const { setHasProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    sleepSchedule: 'EARLY',
    noiseTolerance: 'MEDIUM',
    smoking: false,
    smokingTolerant: false,
    cleanliness: 4,
    studyStyle: 'QUIET',
    tempPreference: 'MEDIUM',
    socialLevel: 'INTROVERT',
    bio: ''
  });

  const nextStep = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const { response, data } = await apiRequest('/api/profile', {
          method: 'POST',
          body: profile,
        });

        if (response.ok) {
          Alert.alert('Profile Complete! 🎉', 'Welcome to RoomSync! We found some great roommate matches for you.');
          setHasProfile(true);
          router.replace('/(tabs)');
        } else {
          Alert.alert('Notice', data?.message || 'Profile saved with defaults');
          setHasProfile(true);
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Error saving profile:', err);
        setHasProfile(true);
        router.replace('/(tabs)');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderOption = (key: string, value: any, label: string, sublabel: string, icon: any) => {
    const isSelected = (profile as any)[key] === value;
    return (
      <TouchableOpacity
        key={`${key}-${value.toString()}`}
        style={[styles.roleCard, isSelected && styles.selectedCard]}
        onPress={() => setProfile({ ...profile, [key]: value })}
      >
        <View style={[styles.iconWrapper, isSelected && styles.selectedIconWrapper]}>
          {React.cloneElement(icon, { color: isSelected ? Theme.colors.primary : '#6B7280' })}
        </View>
        <View style={styles.roleTextContent}>
          <Text style={[styles.roleTitle, isSelected && styles.selectedRoleTitle]}>{label}</Text>
          {sublabel ? <Text style={styles.roleSub}>{sublabel}</Text> : null}
        </View>
        <View style={styles.selector}>
          {isSelected ? (
            <CheckCircle2 color={Theme.colors.primary} size={22} />
          ) : (
            <View style={styles.unselectedCircle} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Header with Step Indicator */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 && setStep(step - 1)}>
          <Text style={styles.navText}>{step > 1 ? '← Back' : ''}</Text>
        </TouchableOpacity>
        <View style={styles.progressSection}>
          <Text style={styles.stepCount}>Step {step} of 4</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.sparkleBadge}>
            <Sparkles size={14} color={Theme.colors.primary} />
            <Text style={styles.sparkleText}>COMPATIBILITY SURVEY</Text>
          </View>
          <Text style={styles.heroTitle}>
            {step === 1 && "Sleep & Sound 🌙"}
            {step === 2 && "Living Habits 🧹"}
            {step === 3 && "Study & Social 📚"}
            {step === 4 && "About You ✨"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {step === 1 && "Help us pair you with roommates who share your daily rhythm."}
            {step === 2 && "Set expectations for cleanliness and smoke-free spaces."}
            {step === 3 && "Let us know how you like to study and unwind."}
            {step === 4 && "Add a short bio to introduce yourself to matches."}
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {step === 1 && (
            <>
              <Text style={styles.sectionLabel}>SLEEP SCHEDULE</Text>
              {renderOption('sleepSchedule', 'EARLY', 'Early Bird 🌅', 'Wake up early, asleep before 11 PM', <Sun size={22} />)}
              {renderOption('sleepSchedule', 'LATE', 'Night Owl 🦉', 'Late night study & creative hours', <Moon size={22} />)}
              
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>NOISE TOLERANCE</Text>
              {renderOption('noiseTolerance', 'LOW', 'Quiet Zone 🤫', 'Prefers calm and silent environments', <Volume2 size={22} />)}
              {renderOption('noiseTolerance', 'MEDIUM', 'Moderate 🎵', 'Okay with background music and podcasts', <Volume2 size={22} />)}
              {renderOption('noiseTolerance', 'HIGH', 'Lively ⚡', 'Enjoys energetic and active dorm vibes', <Volume2 size={22} />)}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionLabel}>CLEANLINESS LEVEL (1-5)</Text>
              <Text style={styles.subLabelHelp}>How tidy do you keep shared spaces?</Text>
              <View style={styles.numRow}>
                {[1, 2, 3, 4, 5].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.numCircle, profile.cleanliness === num && styles.selectedNumCircle]}
                    onPress={() => setProfile({ ...profile, cleanliness: num })}
                  >
                    <Text style={[styles.numText, profile.cleanliness === num && styles.selectedNumText]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SMOKING HABITS</Text>
              {renderOption('smoking', false, 'Smoke-Free 🚭', 'Non-smoker', <CigaretteOff size={22} />)}
              {renderOption('smoking', true, 'I Smoke 🚬', 'Occasional or regular smoker', <Cigarette size={22} />)}
              
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TOLERANT OF SMOKERS?</Text>
              {renderOption('smokingTolerant', true, 'Yes, Tolerant 👌', 'Okay sharing space with smokers', <CheckCircle2 size={22} />)}
              {renderOption('smokingTolerant', false, 'Smoke-Free Only 🌿', 'Strictly smoke-free roommates', <CigaretteOff size={22} />)}
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionLabel}>STUDY STYLE</Text>
              {renderOption('studyStyle', 'QUIET', 'Silent Focus 📖', 'Library-level silence for studying', <BookOpen size={22} />)}
              {renderOption('studyStyle', 'MUSIC', 'Background Tunes 🎧', 'Studies with lo-fi, podcasts, or music', <Sparkles size={22} />)}
              
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>SOCIAL LEVEL</Text>
              {renderOption('socialLevel', 'INTROVERT', 'Introvert 🛋️', 'Values personal space & quiet downtime', <User size={22} />)}
              {renderOption('socialLevel', 'EXTROVERT', 'Extrovert 🎉', 'Loves social gatherings & hosting friends', <Users size={22} />)}
            </>
          )}

          {step === 4 && (
            <View style={styles.bioContainer}>
              <Text style={styles.sectionLabel}>SHORT BIO</Text>
              <Text style={styles.subLabelHelp}>Tell prospective roommates about your major, hobbies, and dorm vibes.</Text>
              <View style={styles.bioInputCard}>
                <TextInput
                  style={styles.bioTextInput}
                  multiline
                  placeholder="e.g. Computer Science sophomore who loves coffee, weekend hikes, and tidy common spaces..."
                  placeholderTextColor="#9CA3AF"
                  value={profile.bio}
                  onChangeText={(text) => setProfile({ ...profile, bio: text })}
                />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.continueButton, loading && { opacity: 0.7 }]}
          onPress={nextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueText}>{step === 4 ? 'Find My Matches 🚀' : 'Continue'}</Text>
              <ArrowRight color="#fff" size={20} style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 64, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  navText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 15, width: 60 },
  progressSection: { alignItems: 'center', flex: 1 },
  stepCount: { fontSize: 11, fontWeight: '800', color: '#6B7280', marginBottom: 4, letterSpacing: 0.5 },
  progressContainer: { width: 120, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  skipText: { color: '#8E8E93', fontWeight: '600', fontSize: 14, width: 60, textAlign: 'right' },
  scrollContent: { paddingBottom: 20 },
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 28 },
  sparkleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, gap: 6, marginBottom: 12 },
  sparkleText: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 0.8 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  rolesContainer: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', marginBottom: 8, letterSpacing: 0.8 },
  subLabelHelp: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  roleCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 10, ...Theme.shadows.subtle },
  selectedCard: { borderColor: Theme.colors.primary, backgroundColor: '#EEF2FF' },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  selectedIconWrapper: { backgroundColor: '#fff' },
  roleTextContent: { flex: 1, marginLeft: 14 },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  selectedRoleTitle: { color: Theme.colors.primary },
  roleSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  selector: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  unselectedCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5DB' },
  numRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  numCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', ...Theme.shadows.subtle },
  selectedNumCircle: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  numText: { fontSize: 18, fontWeight: '800', color: '#4B5563' },
  selectedNumText: { color: '#fff' },
  bioContainer: { minHeight: 180 },
  bioInputCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', padding: 14, minHeight: 120, ...Theme.shadows.subtle },
  bioTextInput: { fontSize: 15, color: '#111827', lineHeight: 22, textAlignVertical: 'top', minHeight: 100 },
  continueButton: { backgroundColor: Theme.colors.primary, marginHorizontal: 20, marginTop: 28, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', ...Theme.shadows.floating },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
