import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="health-detail" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="backoffice" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="intervention-detail" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
    </AuthProvider>
  );
}
