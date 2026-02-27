import '../global.css'; // Required for NativeWind v4
import { Stack } from 'expo-router';
import { Provider } from '@delivery-app/app/provider';
import { NotificationProvider } from '@delivery-app/app/providers/NotificationProvider';

export default function RootLayout() {
    return (
        <Provider>
            <NotificationProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                </Stack>
            </NotificationProvider>
        </Provider>
    );
}
