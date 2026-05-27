import { Tabs } from 'expo-router';
import { Home, History, User, ShieldCheck } from 'lucide-react-native';
import { Linking } from 'react-native';
import { useAuth } from '@/constants/AuthContext';

export default function TabLayout() {
  const { isAdmin } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#90CAF9',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#1565C0',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="modal"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
            tabBarActiveTintColor: '#C62828',
            tabBarInactiveTintColor: '#EF9A9A',
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              Linking.openURL('https://hydrotrack-frontend.vercel.app/painel-admin.html');
            },
          }}
        />
      )}
    </Tabs>
  );
}