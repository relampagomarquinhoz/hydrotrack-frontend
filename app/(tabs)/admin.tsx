import { router } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

export default function AdminScreen() {
  useEffect(() => {
    Linking.openURL('https://hydrotrack-frontend.vercel.app/painel-admin.html');
    router.back();
  }, []);

  return null;
}