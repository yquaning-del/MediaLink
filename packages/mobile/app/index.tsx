import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1B4F72' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  const roleRoute: Record<string, string> = {
    APPLICANT: '/(applicant)/dashboard',
    EMPLOYER: '/(employer)/dashboard',
    ADMIN: '/(auth)/login',
    SUPER_ADMIN: '/(auth)/login',
    FINANCE: '/(auth)/login',
  };

  return <Redirect href={(roleRoute[user.role] ?? '/(auth)/login') as any} />;
}
