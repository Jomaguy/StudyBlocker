import type { NavigatorScreenParams } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Upload: undefined;
  Interview: undefined;
  ConfirmProfile: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  AppSelection: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  QuizOverlay: {
    blockedAppPackage: string;
    blockedAppName: string;
  };
};
