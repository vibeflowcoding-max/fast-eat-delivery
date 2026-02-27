import { View, Text, Pressable } from '@delivery-app/ui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppRouting } from '../../navigation'

export function HomeScreen() {
    const { push } = useAppRouting()

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-2xl font-bold mb-8 text-brand-text">Fast Eat Delivery</Text>

                <Pressable
                    onPress={() => push('/dashboard/feed')}
                    className="bg-brand-primary px-6 py-3 rounded-full active:opacity-80"
                >
                    <Text className="text-white font-semibold text-lg">Ir al Dashboard (Feed)</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}
