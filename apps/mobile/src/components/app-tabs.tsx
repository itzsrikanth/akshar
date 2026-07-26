import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const homeIcon = require('@/assets/images/tabIcons/home.png');
  const exploreIcon = require('@/assets/images/tabIcons/explore.png');

  return (
    <NativeTabs backgroundColor={colors.background} indicatorColor={colors.tint} labelStyle={{ selected: { color: colors.tint } }}>
      <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon src={homeIcon} renderingMode="template" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="library"><NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon src={homeIcon} renderingMode="template" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="search"><NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon src={exploreIcon} renderingMode="template" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="reader"><NativeTabs.Trigger.Label>Reader</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon src={homeIcon} renderingMode="template" /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore"><NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon src={exploreIcon} renderingMode="template" /></NativeTabs.Trigger>
    </NativeTabs>
  );
}
