import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/AuthContext';
import { Theme } from '../src/theme';

function RootNavigator() {
  const { token, user, hasProfile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const first = segments[0] as string | undefined;
    const inLogin = first === 'login';
    const inOnboarding = first === 'onboarding';
    const inAdmin = first === 'admin';
    const inTabs = first === '(tabs)';

    if (!token) {
      if (!inLogin) router.replace('/login');
      return;
    }

    // Role-based routing
    if (user?.role === 'ADMIN') {
      // If admin lands on login, onboarding, or root index, send to admin console
      if (inLogin || inOnboarding || first === undefined) {
        router.replace('/admin' as any);
      }
      return;
    }

    // Regular student routing
    if (inAdmin) {
      router.replace('/(tabs)');
      return;
    }

    if (!hasProfile) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (inLogin || inOnboarding || first === undefined) {
      router.replace('/(tabs)');
    }
  }, [token, user, hasProfile, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
