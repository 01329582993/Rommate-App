import { Tabs, useRouter } from 'expo-router';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Compass, Users, MessageCircle, User, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';

function TabIcon({ Icon, color, focused }: { Icon: any; color: any; focused: boolean }) {
  return (
    <View style={{ width: 54, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? Theme.colors.primarySoft : 'transparent' }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Theme.colors.primary,
          tabBarInactiveTintColor: Theme.colors.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarLabelPosition: 'below-icon',
          tabBarStyle: {
            height: 66 + bottom,
            paddingBottom: bottom + 2,
            paddingTop: 8,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: Theme.colors.border,
            elevation: 0,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 4 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color, focused }) => <TabIcon Icon={Compass} color={color} focused={focused} /> }} />
        <Tabs.Screen name="groups" options={{ title: 'Group', tabBarIcon: ({ color, focused }) => <TabIcon Icon={Users} color={color} focused={focused} /> }} />
        <Tabs.Screen name="chat" options={{ title: 'Chats', tabBarIcon: ({ color, focused }) => <TabIcon Icon={MessageCircle} color={color} focused={focused} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} /> }} />
      </Tabs>

      {user?.role === 'ADMIN' && (
        <Pressable
          onPress={() => router.push('/admin' as any)}
          style={[styles.adminBanner, { top: insets.top > 0 ? insets.top + 6 : 12 }]}
        >
          <Shield size={13} color="#fff" />
          <Text style={styles.adminBannerText}>Admin Preview • Return to Command</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  adminBanner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },
  adminBannerText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
  },
});
