import { FeedScreen } from '@delivery-app/app/features/feed/screen'
import { BottomNav } from '@delivery-app/app/components/bottom-nav'
import { View } from 'react-native'

export default function Feed() {
    return (
        <View className="flex-1">
            <FeedScreen />
            <BottomNav />
        </View>
    )
}
