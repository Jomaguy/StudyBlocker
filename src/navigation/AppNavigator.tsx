import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useStudyStore } from '@/store/studyStore';
import { linking } from './linking';
import type { RootStackParamList, OnboardingStackParamList, MainTabParamList } from '@/types/navigation';

// Screens
import WelcomeScreen from '@/screens/onboarding/WelcomeScreen';
import UploadScreen from '@/screens/onboarding/UploadScreen';
import InterviewScreen from '@/screens/onboarding/InterviewScreen';
import ConfirmProfileScreen from '@/screens/onboarding/ConfirmProfileScreen';
import DashboardScreen from '@/screens/main/DashboardScreen';
import AppSelectionScreen from '@/screens/main/AppSelectionScreen';
import SettingsScreen from '@/screens/main/SettingsScreen';
import QuizOverlayScreen from '@/screens/quiz/QuizOverlayScreen';

const Root = createNativeStackNavigator<RootStackParamList>();
const Onboarding = createNativeStackNavigator<OnboardingStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function OnboardingNavigator() {
  return (
    <Onboarding.Navigator screenOptions={{ headerShown: false }}>
      <Onboarding.Screen name="Welcome" component={WelcomeScreen} />
      <Onboarding.Screen name="Upload" component={UploadScreen} />
      <Onboarding.Screen name="Interview" component={InterviewScreen} />
      <Onboarding.Screen name="ConfirmProfile" component={ConfirmProfileScreen} />
    </Onboarding.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f0f0f', borderTopColor: '#222' },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Dashboard: focused ? 'home' : 'home-outline',
            AppSelection: focused ? 'shield' : 'shield-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="AppSelection" component={AppSelectionScreen} options={{ title: 'Block Apps' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const profile = useStudyStore((s) => s.profile);
  const ready = profile?.onboardingComplete ?? false;

  return (
    <NavigationContainer linking={linking}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!ready ? (
          <Root.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Root.Screen name="Main" component={MainTabNavigator} />
        )}
        <Root.Screen
          name="QuizOverlay"
          component={QuizOverlayScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
      </Root.Navigator>
    </NavigationContainer>
  );
}
