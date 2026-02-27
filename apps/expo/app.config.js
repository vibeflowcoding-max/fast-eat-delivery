/** @type {import('expo/config').ExpoConfig} */
module.exports = {
    name: 'Delivery App',
    slug: 'delivery-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'deliveryapp',
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#FF6B35',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.deliveryapp.app',
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#FF6B35',
        },
        package: 'com.deliveryapp.app',
    },
    web: {
        favicon: './assets/favicon.png',
        bundler: 'metro',
    },
    plugins: [
        'expo-router',
        'expo-secure-store'
    ],
    experiments: {
        typedRoutes: true,
    },
    extra: {
        eas: {
            projectId: "18875687-ccd0-49cd-abf3-5ccb15fa762d"
        }
    }
};
