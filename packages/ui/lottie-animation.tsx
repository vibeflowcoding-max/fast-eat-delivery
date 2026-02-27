import React from "react"
import { View, type ViewProps } from "react-native"
import LottieView from "lottie-react-native"

export interface LottieAnimationProps extends ViewProps {
    url?: string;
    animationData?: any;
    loop?: boolean;
    autoplay?: boolean;
}

export function LottieAnimation({
    url,
    animationData,
    loop = true,
    autoplay = true,
    className,
    style,
    ...props
}: LottieAnimationProps) {
    // lottie-react-native accepts a source object or a URL via source={{ uri: url }}
    // However, local JSON objects must be passed to `source` directly.
    return (
        <View className={className} style={style} {...props}>
            <LottieView
                source={animationData || { uri: url }}
                autoPlay={autoplay}
                loop={loop}
                style={{ width: "100%", height: "100%" }}
            />
        </View>
    )
}
