import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const PermissionService = {
    async registerForPushNotificationsAsync(userId: string) {
        let token;
        if (Device.isDevice && Platform.OS !== 'web') {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            })).data;

            // Save token to Supabase profiles or a dedicated table
            await supabase
                .from('profiles')
                .update({ push_token: token })
                .eq('id', userId);

        } else {
            console.log('Push Notifications are only supported on physical mobile devices');
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B35',
            });
        }

        return token;
    },

    async requestLocationPermissions(userId: string) {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            // Start tracking location
            // Using Accuracy.Balanced and checking if location services are enabled
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                console.log('Location services are disabled');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            if (location) {
                await this.updateDriverLocation(userId, location.coords.latitude, location.coords.longitude);
            }

            // Optional: Background location if needed, but for now foreground is enough
            await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 60000, // 1 minute
                    distanceInterval: 10, // 10 meters
                },
                (location) => {
                    this.updateDriverLocation(userId, location.coords.latitude, location.coords.longitude);
                }
            );
        } catch (e) {
            console.log('Error requesting location or services unavailable:', e);
        }
    },

    async updateDriverLocation(userId: string, lat: number, lng: number) {
        try {
            await supabase
                .from('profiles')
                .update({
                    last_latitude: lat,
                    last_longitude: lng,
                    last_location_update: new Date().toISOString()
                })
                .eq('id', userId);
        } catch (e) {
            console.error('Error updating driver location:', e);
        }
    }
};
