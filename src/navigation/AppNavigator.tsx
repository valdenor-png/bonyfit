import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../tokens';
import { TabParamList, FeedStackParamList, ProfileStackParamList } from './types';

import FeedScreen from '../screens/FeedScreen';
import ProfileViewScreen from '../screens/ProfileViewScreen';
import ChatScreen from '../screens/ChatScreen';
import RankingScreen from '../screens/RankingScreen';
import TreinoScreen from '../screens/TreinoScreen';
import PersonalScreen from '../screens/PersonalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import Skull from '../components/Skull';

const Tab = createBottomTabNavigator<TabParamList>();
const FeedStack = createStackNavigator<FeedStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

function FeedNavigator() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.bg } }}>
      <FeedStack.Screen name="FeedMain" component={FeedScreen} />
      <FeedStack.Screen name="ProfileView" component={ProfileViewScreen} />
      <FeedStack.Screen name="Chat" component={ChatScreen} />
    </FeedStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.bg } }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Feed: '📱',
    Ranking: '🏆',
    Treino: '💪',
    Personal: '👤',
    Perfil: '⚙',
  };

  if (name === 'Treino') {
    return (
      <View style={[tabStyles.centerBtn, focused && tabStyles.centerBtnActive]}>
        <Skull size={22} color={focused ? '#FFFFFF' : colors.textMuted} />
      </View>
    );
  }

  return (
    <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
      {icons[name] || '•'}
    </Text>
  );
}

const tabStyles = StyleSheet.create({
  icon: { fontSize: 20, opacity: 0.5 },
  iconActive: { opacity: 1 },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  centerBtnActive: {
    backgroundColor: colors.orange,
  },
});

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.elevated,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fonts.bodyMedium,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedNavigator} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen
        name="Treino"
        component={TreinoScreen}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen name="Personal" component={PersonalScreen} />
      <Tab.Screen name="Perfil" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
