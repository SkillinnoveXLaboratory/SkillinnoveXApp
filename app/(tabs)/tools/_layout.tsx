import Stack from 'expo-router/stack';
import { colors } from '@/constants/theme';

export default function ToolsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tools' }} />
      <Stack.Screen name="resume" options={{ title: 'Resume Builder' }} />
      <Stack.Screen name="portfolio" options={{ title: 'Portfolio Builder' }} />
      <Stack.Screen name="cover-letter" options={{ title: 'Cover Letter Builder' }} />
      <Stack.Screen name="ats" options={{ title: 'ATS Checker' }} />
      <Stack.Screen name="humanizer" options={{ title: 'AI Humanizer' }} />
      <Stack.Screen name="preview" options={{ title: 'Generated Preview' }} />
    </Stack>
  );
}
