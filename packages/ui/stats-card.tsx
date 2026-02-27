import React from 'react';
import { View, Text } from 'react-native';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const statsCardVariants = cva(
    "rounded-[16px] p-6",
    {
        variants: {
            variant: {
                default: "bg-white border border-brand-accent",
                primary: "bg-brand-primary",
                success: "bg-green-50 border border-green-200",
                warning: "bg-orange-50 border border-orange-200",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface StatsCardProps extends VariantProps<typeof statsCardVariants> {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    variant,
    className,
}: StatsCardProps) {
    const isPrimary = variant === "primary";

    return (
        <View className={cn(statsCardVariants({ variant }), className)}>
            <View className="flex-row items-start justify-between">
                <View className="flex-1">
                    <Text className={cn("text-sm font-medium opacity-80 mb-1", isPrimary ? "text-white" : "")}>
                        {title}
                    </Text>
                    <Text className={cn("text-3xl font-bold font-heading", isPrimary ? "text-white" : "")}>
                        {value}
                    </Text>
                    {subtitle && (
                        <Text className={cn("text-sm opacity-60 mt-1", isPrimary ? "text-white" : "")}>
                            {subtitle}
                        </Text>
                    )}
                    {trend && (
                        <View className="flex-row items-center gap-1 mt-2">
                            <Text
                                className={cn(
                                    "text-xs font-medium",
                                    trend.isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </Text>
                            <Text className={cn("text-xs opacity-60", isPrimary ? "text-white" : "")}>
                                vs mes anterior
                            </Text>
                        </View>
                    )}
                </View>
                {icon && (
                    <View className="ml-4 p-3 rounded-[12px] bg-brand-accent">
                        {icon}
                    </View>
                )}
            </View>
        </View>
    );
}
