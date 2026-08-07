import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import type { ComponentProps } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Icon choices per docs/iconography.md — outline by default, filled only for
// the active tab where MaterialCommunityIcons has a natural filled variant.
function tabIcon(outline: MCIName, filled?: MCIName) {
  return (
    <NativeTabs.Trigger.Icon
      src={{
        default: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name={outline} />,
        selected: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name={filled ?? outline} />,
      }}
    />
  );
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      // Active tab: icon tinted `tint`, sitting on a desaturated `tintMuted`
      // pill (indicatorColor). Inactive: icon/label in `textSecondary` — not
      // left unset, which is what made them render invisible before.
      iconColor={{ default: colors.textSecondary, selected: colors.tint }}
      indicatorColor={colors.tintMuted}
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.tint } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        {tabIcon('home-outline', 'home')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        {tabIcon('bookshelf')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        {tabIcon('magnify')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reader">
        <NativeTabs.Trigger.Label>Reader</NativeTabs.Trigger.Label>
        {tabIcon('book-open-page-variant')}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        {tabIcon('compass-outline', 'compass')}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
