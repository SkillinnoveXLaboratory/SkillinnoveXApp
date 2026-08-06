import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Tabs from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: '#8A98AA',
        tabBarStyle: {
          height: 64 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset + 10,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          ...shadow,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen
        name="tools"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.replace('/tools');
          },
        }}
        options={{ title: 'Tools', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen name="downloads" options={{ title: 'Downloads', tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
