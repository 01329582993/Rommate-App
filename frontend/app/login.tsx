import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, TextInput, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mail, Lock, Eye, ArrowRight, Building, CheckSquare, Square, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Theme } from '../src/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(false);
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync('userToken', data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    // Simulate Google Login
    setTimeout(async () => {
      setLoading(false);
      Alert.alert('Success', 'Logged in with Google');
      router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} bounceless>
        
        <ImageBackground 
          source={require('../assets/login_hero_bg.png')} 
          style={styles.heroSection}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <SafeAreaView style={styles.heroContent}>
            <View style={styles.badge}>
              <Building size={16} color="#fff" />
              <Text style={styles.badgeText}>Premium Living Space</Text>
            </View>
            <Text style={styles.heroTitle}>Find your perfect roommate, sync your life.</Text>
            <Text style={styles.heroSubtitle}>
              The structured community platform designed for university students and young professionals seeking stable living environments.
            </Text>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.formSection}>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'LOGIN' && styles.activeTab]}
              onPress={() => setActiveTab('LOGIN')}
            >
              <Text style={[styles.tabText, activeTab === 'LOGIN' && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'SIGNUP' && styles.activeTab]}
              onPress={() => setActiveTab('SIGNUP')}
            >
              <Text style={[styles.tabText, activeTab === 'SIGNUP' && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formHeader}>
            <Text style={styles.welcomeTitle}>{activeTab === 'LOGIN' ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.welcomeSubtitle}>
              {activeTab === 'LOGIN' ? 'Please enter your student credentials to continue.' : 'Join the RoomSync community today.'}
            </Text>
          </View>

          <Text style={styles.inputLabel}>University Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="name@university.edu"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.passwordHeader}>
            <Text style={styles.inputLabel}>Password</Text>
            {activeTab === 'LOGIN' && (
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.inputWrapper}>
            <Lock size={20} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Eye size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {activeTab === 'LOGIN' && (
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setKeepSigned(!keepSigned)}
            >
              {keepSigned ? <CheckSquare size={20} color={Theme.colors.primary} /> : <Square size={20} color="#DDD" />}
              <Text style={styles.checkboxLabel}>Keep me signed in for 30 days</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>{activeTab === 'LOGIN' ? 'Login to Account' : 'Register Now'}</Text>
                <ArrowRight size={20} color="#fff" style={{ marginLeft: 10 }} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>Or continue with</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Globe size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>Login with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setActiveTab(activeTab === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}>
              <Text style={styles.footerText}>
                {activeTab === 'LOGIN' ? 'New to the community?' : 'Already have an account?'} <Text style={styles.footerLink}>{activeTab === 'LOGIN' ? 'Create a Student Profile' : 'Login instead'}</Text>
              </Text>
            </TouchableOpacity>
            <View style={styles.footerBottomLinks}>
               <Text style={styles.bottomLink}>Privacy Policy</Text>
               <View style={styles.dot} />
               <Text style={styles.bottomLink}>Terms of Service</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  heroSection: { height: height * 0.45, width: width, justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(79, 70, 229, 0.3)' },
  heroContent: { paddingHorizontal: 40, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 15, lineHeight: 40 },
  heroSubtitle: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  formSection: { flex: 1, backgroundColor: '#F8FAFC', marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 30 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#EDF2F7', borderRadius: 15, padding: 4, marginBottom: 30 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  tabText: { color: '#718096', fontWeight: '700' },
  activeTabText: { color: '#2D3748' },
  
  formHeader: { marginBottom: 30 },
  welcomeTitle: { fontSize: 26, fontWeight: '800', color: '#1A202C', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 15, color: '#718096', lineHeight: 22 },
  
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#4A5568', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 15, paddingHorizontal: 15, height: 60, marginBottom: 20 },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1A202C' },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  checkboxLabel: { marginLeft: 10, fontSize: 14, color: '#4A5568', fontWeight: '600' },
  
  loginButton: { backgroundColor: '#4F46E5', flexDirection: 'row', height: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  separatorText: { marginHorizontal: 15, color: '#718096', fontSize: 14, fontWeight: '600' },
  
  socialRow: { width: '100%' },
  googleButton: { width: '100%', flexDirection: 'row', height: 60, backgroundColor: '#fff', borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  googleButtonText: { color: '#2D3748', fontWeight: '700', fontSize: 16, marginLeft: 10 },
  
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#718096', fontWeight: '600' },
  footerLink: { color: '#4F46E5', fontWeight: '800' },
  footerBottomLinks: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  bottomLink: { fontSize: 12, color: '#A0AEC0', fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E0', marginHorizontal: 10 },
});
