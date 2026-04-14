// Global type declarations for React Native / Expo environment.
// process.env is polyfilled by React Native but not in @types/react-native.
// This file is referenced from tsconfig.json "include" so it applies globally.

declare const process: {
  env: Record<string, string | undefined> & {
    EXPO_PUBLIC_API_URL?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  };
};
