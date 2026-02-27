'use client';

import { useLottie } from 'lottie-react';
import { useEffect, useState } from 'react';

interface LottieAnimationProps {
    url?: string;
    animationData?: any;
    loop?: boolean;
    autoplay?: boolean;
    className?: string;
    width?: number | string;
    height?: number | string;
}

export function LottieAnimation({
    url,
    animationData: initialData,
    loop = true,
    autoplay = true,
    className,
    width = '100%',
    height = '100%',
}: LottieAnimationProps) {
    const [data, setData] = useState<any>(initialData);

    useEffect(() => {
        if (url) {
            fetch(url)
                .then((res) => res.json())
                .then((json) => setData(json))
                .catch((err) => console.error('Error loading Lottie animation:', err));
        }
    }, [url]);

    const options = {
        animationData: data,
        loop,
        autoplay,
    };

    const { View } = useLottie(options, { width, height });

    if (!data) {
        return (
            <div
                className={className}
                style={{ width, height, display: 'flex', alignItems: 'center', justifySelf: 'center' }}
            >
                <div className="animate-pulse bg-gray-100 rounded-full w-24 h-24 mx-auto" />
            </div>
        );
    }

    return <div className={className}>{View}</div>;
}
