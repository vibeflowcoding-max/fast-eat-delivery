import { ActiveOrderScreen } from '@delivery-app/app/features/active-order/screen';
import { BottomNav } from '@delivery-app/app/components/bottom-nav';
import { View } from 'react-native';

export default function ActiveOrder() {
    return (
        <View className="flex-1">
            <ActiveOrderScreen />
            <BottomNav />
        </View>
    );
}
