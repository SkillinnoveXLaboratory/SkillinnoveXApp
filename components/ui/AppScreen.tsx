import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { AppHeader } from '@/components/ui/AppHeader';

interface AppScreenProps extends PropsWithChildren {
  scroll?: boolean;
  header?: ReactNode;
}

export function AppScreen({ children, scroll = true, header }: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>
            {header}
            {children}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.inner}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110, backgroundColor: colors.background },
});
