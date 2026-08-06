import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/AuthContext';

function RootNavigator() {
  const { token, hasProfile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginPage = segments[0] === 'login' as any;
    const inOnboarding = segments[0] === 'onboarding';
    const isIndex = (segments.length as number) === 0 || segments[0] === undefined;

    if (!token && inAuthGroup) {
      // Not logged in but trying to access protected tab screens — redirect to login
      router.replace('/login');
    } else if (token) {
      if (!hasProfile) {
        // Logged in but has no profile — must do onboarding
        if (!inOnboarding) {
          router.replace('/onboarding');
        }
      } else {
        // Logged in and has profile
        if (inLoginPage || isIndex || inOnboarding) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [token, hasProfile, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
