import { ProfileScreen } from '@delivery-app/app/features/profile/screen';
import { BottomNav } from '@delivery-app/app/components/bottom-nav';
import { View } from 'react-native';

export default function Profile() {
    return (
        <View className="flex-1">
            <ProfileScreen />
            <BottomNav />
        </View>
    );
}
