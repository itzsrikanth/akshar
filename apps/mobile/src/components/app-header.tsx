import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';

import { Touchable } from '@/components/touchable';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const logo = require('@/assets/images/icon.png');

export function AppHeader({
  showSettings = true,
  onSettingsPress,
}: {
  showSettings?: boolean;
  onSettingsPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={s.container}>
      <View style={s.row}>
        <Image source={logo} style={s.logo} />
        {showSettings && (
          <Touchable onPress={onSettingsPress} hitSlop={8} style={[s.settingsButton, { backgroundColor: theme.tintMuted }]}>
            <MaterialCommunityIcons name="cog-outline" size={20} color={theme.tint} />
          </Touchable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { width: 36, height: 36, borderRadius: Radius.medium },
  // A muted icon alone on a plain background read as barely-there — the tinted
  // pill gives the settings entry point real visual weight without competing
  // with primary content (still tintMuted, not the full-strength tint).
  settingsButton: { width: 32, height: 32, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
});
