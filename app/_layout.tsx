import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { PWAProvider } from '../src/context/PWAContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { PermissionService } from '../src/services/PermissionService';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('SW registered:', reg);
        }).catch(err => {
          console.log('SW registration failed:', err);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW, { once: true });
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments as string[])[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      (router as any).replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to tabs if already authenticated and trying to access auth screens
      (router as any).replace('/(tabs)');

      // Request permissions
      if (user) {
        PermissionService.registerForPushNotificationsAsync(user.id);
        PermissionService.requestLocationPermissions(user.id);
      }
    }
  }, [session, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="active-order" options={{ headerShown: true, title: 'Orden Activa' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <PWAProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PWAProvider>
  );
}
