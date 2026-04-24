import { Stack, Redirect } from 'expo-router';

export default function RootLayout() {
  const isLoggedIn = false; // troque por sua lógica de autenticação futuramente

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" redirect />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}