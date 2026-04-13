import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EmployerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1B4F72',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopColor: '#e2e8f0' },
        headerStyle: { backgroundColor: '#1B4F72' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          headerTitle: 'MediaLink Employer',
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
          headerTitle: 'Job Listings',
        }}
      />
      <Tabs.Screen
        name="candidates"
        options={{
          title: 'Candidates',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          headerTitle: 'Matched Candidates',
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Pipeline',
          tabBarIcon: ({ color, size }) => <Ionicons name="funnel-outline" size={size} color={color} />,
          headerTitle: 'Hiring Pipeline',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />,
          headerTitle: 'Company Account',
        }}
      />
    </Tabs>
  );
}
