import { HistoryScreen } from '@delivery-app/app/features/history/screen';
import { BottomNav } from '@delivery-app/app/components/bottom-nav';
import { View } from 'react-native';

export default function History() {
    return (
        <View className="flex-1">
            <HistoryScreen />
            <BottomNav />
        </View>
    );
}
