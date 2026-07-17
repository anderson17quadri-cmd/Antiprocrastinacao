import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { subscribeToCouple } from '@/services/sync';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTheme } from '@/theme';

export const TAB_BAR_HEIGHT = 76;

interface TabMeta {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabMeta[] = [
  { name: 'index', label: 'Início', icon: 'home-outline', iconActive: 'home' },
  { name: 'calendar', label: 'Calendário', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'reports', label: 'Relatórios', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { name: 'couple', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
];

function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderTab = (tab: TabMeta) => {
    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
    const focused = state.index === routeIndex;

    return (
      <Pressable
        key={tab.name}
        onPress={() => navigation.navigate(tab.name)}
        style={styles.tab}
        hitSlop={6}
      >
        <Ionicons
          name={focused ? tab.iconActive : tab.icon}
          size={22}
          color={focused ? colors.primary : colors.textMuted}
        />
        <AppText
          variant="caption"
          style={{ fontSize: 10, color: focused ? colors.primary : colors.textMuted }}
        >
          {tab.label}
        </AppText>
      </Pressable>
    );
  };

  const openNewTask = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    router.push('/task/new');
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBar,
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}

      <Pressable onPress={openNewTask} style={styles.fabWrapper}>
        <LinearGradient
          colors={[...colors.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
    </View>
  );
}

export default function TabsLayout() {
  const coupleId = useAuthStore((s) => s.couple?.id);

  // Sincronização em tempo real do casal (ativa quando o Firebase
  // estiver configurado via EXPO_PUBLIC_FIREBASE_*).
  useEffect(() => {
    if (!coupleId) return;
    let unsubscribe: (() => void) | undefined;
    void subscribeToCouple(coupleId, (remote) => {
      useTaskStore.getState().applyRemoteTasks(remote);
    }).then((fn) => {
      unsubscribe = fn;
    });
    return () => unsubscribe?.();
  }, [coupleId]);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="couple" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -34,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
});
