import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/lib/store';
import { api, getAccessToken } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await getAccessToken();
        if (token) {
          const { data } = await api.post('/auth/refresh');
          const { user, accessToken, refreshToken } = data.data;
          await setAuth(user, accessToken, refreshToken);
        } else {
          setLoading(false);
        }
      } catch {
        await clearAuth();
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    restoreSession();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(applicant)" />
        <Stack.Screen name="(employer)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
