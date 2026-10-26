import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeCampusVideo } from '../src/components/SafeCampusVideo';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Hash, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/AuthContext';
import { Theme, shadow, type } from '../src/theme';
import { useLayout } from '../src/responsive';
import { Button, Field, OptionPills } from '../src/components/ui';

const GENDERS = [
  { value: 'MALE', label: 'Male (South / North Hall)' },
  { value: 'FEMALE', label: 'Female (Female Hall)' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { width, height } = useLayout();
  const wide = width >= 900;
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const isSignup = mode === 'SIGNUP';

  const fillQuickDemo = (cred: { idOrEmail: string; pass: string }) => {
    setEmail(cred.idOrEmail);
    setPassword(cred.pass);
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('Missing details', 'Please enter your IUT Student ID / Email and password.');
      return;
    }
    if (isSignup) {
      if (name.trim().length < 2) return Alert.alert('Missing details', 'Please enter your full name.');
      if (studentId.trim().length < 4) return Alert.alert('Missing Student ID', 'Please enter your unique 9-digit IUT Student ID (e.g. 200041101).');
      if (!gender) return Alert.alert('Missing Hall Allocation', 'Please choose your Hall / Gender for proper room allocation.');
      if (password.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    }

    setLoading(true);
    const result = isSignup
      ? await register({ name: name.trim(), email: cleanEmail, password, gender, studentId: studentId.trim() })
      : await login(cleanEmail, password);
    setLoading(false);

    if (result.ok) {
      if (result.user?.role === 'ADMIN') {
        router.replace('/admin' as any);
      } else {
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert(isSignup ? 'Could not sign up' : 'Login failed', result.message || 'Please check your credentials.');
    }
  };

  const hero = (
    <View style={[styles.hero, wide ? styles.heroWide : { height: Math.min(Math.max(height * 0.38, 280), 380) }]}>
      {/* Background Campus Video */}
      <SafeCampusVideo style={StyleSheet.absoluteFill} />

      {/* Emerald IUT Gradient Overlay */}
      <LinearGradient
        colors={['rgba(2, 44, 34, 0.65)', 'rgba(0, 106, 78, 0.92)']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={wide ? ['top', 'bottom'] : ['top']} style={styles.heroContent}>
        {/* IUT Official Emblem Branding */}
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../assets/iut_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.logoText}>IUT RoomSync</Text>
            <Text style={styles.logoSubText}>ISLAMIC UNIVERSITY OF TECHNOLOGY</Text>
          </View>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: 12 }}>
          <Text style={[styles.heroTitle, wide && { fontSize: 38, lineHeight: 46 }]}>
            Find your perfect roommate. Hall life synchronized.
          </Text>
          <Text style={styles.heroSubtitle}>
            Official Hall & Roommate Allocation Portal for IUT Students • South Hall, North Hall & Female Hall of Residence.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );

  const form = (
    <View style={[styles.formCard, wide ? styles.formCardWide : styles.formCardNarrow]}>
      <View style={styles.segment}>
        {(['LOGIN', 'SIGNUP'] as const).map((m) => (
          <Pressable key={m} style={[styles.segBtn, mode === m && styles.segBtnActive]} onPress={() => setMode(m)}>
            <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m === 'LOGIN' ? 'Log in' : 'Sign up'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[type.title, { marginTop: 22 }]}>
        {isSignup ? 'Student Registration' : 'Student & Staff Portal'}
      </Text>
      <Text style={[type.secondary, { marginTop: 4, marginBottom: 20 }]}>
        {isSignup
          ? 'Create your IUT roommate profile with your verified Student ID.'
          : 'Log in with your unique IUT Student ID or official @iut-dhaka.edu email.'}
      </Text>

      {/* QUICK PRE-FILL CREDENTIALS BAR */}
      <View style={styles.quickBar}>
        <Text style={styles.quickBarLabel}>Quick Demo:</Text>
        <Pressable
          onPress={() => fillQuickDemo({ idOrEmail: 'limassoubello@iut-dhaka.edu', pass: '123456' })}
          style={styles.quickChip}
        >
          <Text style={styles.quickChipText}>limassoubello@iut-dhaka.edu</Text>
        </Pressable>
        <Pressable
          onPress={() => fillQuickDemo({ idOrEmail: '200041101', pass: '123456' })}
          style={styles.quickChip}
        >
          <Text style={styles.quickChipText}>ID: 200041101</Text>
        </Pressable>
        <Pressable
          onPress={() => fillQuickDemo({ idOrEmail: 'admin@iut-dhaka.edu', pass: 'admin123' })}
          style={[styles.quickChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
        >
          <Shield size={11} color="#D97706" />
          <Text style={[styles.quickChipText, { color: '#B45309' }]}>Admin</Text>
        </Pressable>
      </View>

      {isSignup && (
        <>
          <Field
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Limas Soubello"
            autoCapitalize="words"
            editable={!loading}
            icon={<User size={19} color={Theme.colors.textMuted} />}
          />
          <Field
            label="IUT Student ID (Unique)"
            value={studentId}
            onChangeText={setStudentId}
            placeholder="e.g. 200041101"
            keyboardType="number-pad"
            autoCapitalize="none"
            editable={!loading}
            icon={<Hash size={19} color={Theme.colors.textMuted} />}
          />
        </>
      )}

      <Field
        label={isSignup ? 'IUT Email' : 'IUT Student ID or Email'}
        value={email}
        onChangeText={setEmail}
        placeholder={isSignup ? 'username@iut-dhaka.edu' : 'e.g. 200041101 or limassoubello@iut-dhaka.edu'}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
        icon={<Mail size={19} color={Theme.colors.textMuted} />}
      />

      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        editable={!loading}
        onSubmitEditing={handleSubmit}
        icon={<Lock size={19} color={Theme.colors.textMuted} />}
        right={
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOff size={19} color={Theme.colors.textMuted} /> : <Eye size={19} color={Theme.colors.textMuted} />}
          </Pressable>
        }
      />

      {isSignup && (
        <View style={{ marginTop: 4 }}>
          <Text style={[type.label, { marginBottom: 8 }]}>Campus Hall Allocation</Text>
          <OptionPills value={gender} onChange={setGender} options={GENDERS} />
          <Text style={[type.caption, { marginTop: -4, marginBottom: 18 }]}>
            Determines allocation to North/South Hall (Male) or Female Hall of Residence (Female).
          </Text>
        </View>
      )}

      <Button
        title={isSignup ? 'Create IUT Account' : 'Log In to IUT Portal'}
        icon={<ArrowRight size={19} color="#fff" />}
        onPress={handleSubmit}
        loading={loading}
        style={{ marginTop: 10 }}
      />

      <Pressable onPress={() => setMode(isSignup ? 'LOGIN' : 'SIGNUP')} style={styles.switchRow} hitSlop={8}>
        <Text style={type.secondary}>
          {isSignup ? 'Already have an IUT account? ' : 'New IUT Student? '}
          <Text style={styles.switchLink}>{isSignup ? 'Log in' : 'Create an account'}</Text>
        </Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1.1, overflow: 'hidden' }}>{hero}</View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.wideScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {form}
          </ScrollView>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          {hero}
          <View style={styles.narrowWrap}>{form}</View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  hero: { justifyContent: 'flex-end', overflow: 'hidden', position: 'relative' },
  heroWide: { flex: 1, width: '100%', height: '100%' },
  heroContent: { flex: 1, justifyContent: 'space-between', padding: 22, paddingBottom: 50 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    ...shadow.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  logoSubText: { color: '#A7F3D0', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  heroTitle: { color: '#fff', fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6, maxWidth: 520 },
  heroSubtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 460 },
  narrowWrap: { flex: 1, backgroundColor: Theme.colors.background, marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  wideScroll: { flexGrow: 1, justifyContent: 'center', padding: 40 },
  formCard: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  formCardNarrow: { padding: 24, paddingBottom: 48 },
  formCardWide: {},
  segment: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 16, padding: 4 },
  segBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segBtnActive: { backgroundColor: '#fff', ...shadow.sm },
  segText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary },
  segTextActive: { color: Theme.colors.primary },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  quickBarLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textSecondary },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  quickChipText: { fontSize: 11, fontWeight: '600', color: Theme.colors.primary },
  switchRow: { alignItems: 'center', marginTop: 20 },
  switchLink: { color: Theme.colors.primary, fontWeight: '800' },
});
