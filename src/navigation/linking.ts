import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['studyblocker://'],
  config: {
    screens: {
      QuizOverlay: {
        path: 'quiz',
        parse: {
          blockedAppPackage: (pkg: string) => pkg,
          blockedAppName: (name: string) => decodeURIComponent(name),
        },
      },
      Main: {
        screens: {
          Dashboard: 'home',
        },
      },
    },
  },
};
