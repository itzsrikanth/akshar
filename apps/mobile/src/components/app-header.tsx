import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader({
  title = 'Akshar',
  subtitle,
  status = 'Ready',
  showSettings = true,
  onSettingsPress,
}: {
  title?: string;
  subtitle?: string;
  status?: string;
  showSettings?: boolean;
  onSettingsPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={s.container}>
      <View style={s.row}>
        <ThemedText type="title">{title}</ThemedText>
        <View style={s.right}>
          <ThemedText type="small" themeColor="textSecondary">{status}</ThemedText>
          {showSettings && (
            <Pressable onPress={onSettingsPress} hitSlop={8}>
              <MaterialCommunityIcons name="cog-outline" size={24} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
      {subtitle && (
        <ThemedText type="small" themeColor="textSecondary" style={s.subtitle}>
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subtitle: { marginTop: 4 },
});
