import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowRight, Moon, Zap, Wind, Trash2, BookOpen, Users, Thermometer, User, CheckCircle2 } from 'lucide-react-native';
import { Theme } from '../src/theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    sleepSchedule: 'EARLY',
    noiseTolerance: 'MEDIUM',
    smoking: false,
    smokingTolerant: false,
    cleanliness: 3,
    studyStyle: 'QUIET',
    tempPreference: 'MEDIUM',
    socialLevel: 'INTROVERT',
    bio: ''
  });

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else router.replace('/(tabs)');
  };

  const renderOption = (key: string, value: any, label: string, icon: any) => {
    const isSelected = (profile as any)[key] === value;
    return (
      <TouchableOpacity
        key={`${key}-${value.toString()}`}
        style={[styles.roleCard, isSelected && styles.selectedCard]}
        onPress={() => setProfile({ ...profile, [key]: value })}
      >
        <View style={[styles.iconWrapper, isSelected && styles.selectedIconWrapper]}>
          {React.cloneElement(icon, { color: isSelected ? Theme.colors.primary : '#556b72' })}
        </View>
        <View style={styles.roleTextContent}>
          <Text style={styles.roleTitle}>{label}</Text>
        </View>
        <View style={styles.selector}>
          {isSelected ? (
            <CheckCircle2 color={Theme.colors.primary} size={24} fill={Theme.colors.primary + '20'} />
          ) : (
            <View style={styles.unselectedCircle} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 && setStep(step - 1)}>
          <Text style={styles.skipText}>{step > 1 ? 'Back' : ''}</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
           <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            {step === 1 && "Sleep & Noise"}
            {step === 2 && "Habits"}
            {step === 3 && "Lifestyle"}
            {step === 4 && "About You"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {step === 1 && "Tell us how you rest and focus."}
            {step === 2 && "Cleanliness and smoking preferences."}
            {step === 3 && "Your social and study environment."}
            {step === 4 && "Final touch to your profile."}
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {step === 1 && (
            <>
              <Text style={styles.sectionLabel}>Sleep Schedule</Text>
              {renderOption('sleepSchedule', 'EARLY', 'Early Bird', <Moon size={24} />)}
              {renderOption('sleepSchedule', 'LATE', 'Night Owl', <Zap size={24} />)}
              
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Noise Tolerance</Text>
              {renderOption('noiseTolerance', 'LOW', 'Quiet (Low)', <Wind size={24} />)}
              {renderOption('noiseTolerance', 'MEDIUM', 'Moderate', <Users size={24} />)}
              {renderOption('noiseTolerance', 'HIGH', 'High Energy', <Zap size={24} />)}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionLabel}>Cleanliness (1-5)</Text>
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

              <Text style={[styles.sectionLabel, { marginTop: 30 }]}>Smoking Preference</Text>
              {renderOption('smoking', true, 'I Smoke', <Wind size={24} />)}
              {renderOption('smoking', false, 'Non-Smoker', <CheckCircle2 size={24} />)}
              
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Tolerant of Smoking?</Text>
              {renderOption('smokingTolerant', true, 'Yes, I\'m Tolerant', <CheckCircle2 size={24} />)}
              {renderOption('smokingTolerant', false, 'No, Smoke-Free only', <Trash2 size={24} />)}
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.sectionLabel}>Study Style</Text>
              {renderOption('studyStyle', 'QUIET', 'Quiet Library Style', <BookOpen size={24} />)}
              {renderOption('studyStyle', 'MUSIC', 'With Music/Background', <Zap size={24} />)}
              
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Social Level</Text>
              {renderOption('socialLevel', 'INTROVERT', 'Introvert (Private)', <User size={24} />)}
              {renderOption('socialLevel', 'EXTROVERT', 'Extrovert (Social)', <Users size={24} />)}
            </>
          )}

          {step === 4 && (
            <View style={styles.bioContainer}>
               <Text style={styles.sectionLabel}>Short Bio</Text>
               <View style={styles.roleCard}>
                 <View style={styles.bioWrapper}>
                    <Text style={styles.bioPlaceholder}>Write a few words about yourself...</Text>
                 </View>
               </View>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={nextStep}
        >
          <Text style={styles.continueText}>{step === 4 ? 'Complete Profile' : 'Next Step'}</Text>
          <ArrowRight color="#fff" size={20} style={{ marginLeft: 10 }} />
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.lg, height: 60 },
  progressContainer: { flex: 1, height: 6, backgroundColor: '#E0E7E0', borderRadius: 3, marginHorizontal: 20 },
  progressBar: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  skipText: { color: Theme.colors.primary, fontWeight: 'bold', fontSize: 16, width: 44 },
  scrollContent: { paddingBottom: 20 },
  heroSection: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 40 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#0a1a1f', textAlign: 'center', marginBottom: 10 },
  heroSubtitle: { fontSize: 16, color: '#556b72', textAlign: 'center', lineHeight: 22 },
  rolesContainer: { paddingHorizontal: Theme.spacing.lg, gap: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  roleCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 8 },
  selectedCard: { borderColor: Theme.colors.primary, backgroundColor: '#F0F9F1' },
  iconWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F9F1', alignItems: 'center', justifyContent: 'center' },
  selectedIconWrapper: { backgroundColor: Theme.colors.primary + '20' },
  roleTextContent: { flex: 1, marginLeft: 16 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: '#0a1a1f' },
  selector: { width: 24, height: 24 },
  unselectedCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D9D1' },
  numRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  numCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  selectedNumCircle: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  numText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  selectedNumText: { color: '#fff' },
  bioContainer: { minHeight: 200 },
  bioWrapper: { flex: 1, paddingVertical: 10 },
  bioPlaceholder: { color: '#999', fontSize: 16 },
  continueButton: { backgroundColor: Theme.colors.primary, marginHorizontal: Theme.spacing.lg, marginTop: 30, height: 60, borderRadius: Theme.roundness.full, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 },
  continueText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
