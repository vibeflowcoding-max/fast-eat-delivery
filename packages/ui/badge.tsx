import * as React from "react"
import { View, Text, type ViewProps, type TextProps } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./lib/utils"

const badgeVariants = cva(
    "flex-row items-center rounded-full border px-2.5 py-0.5",
    {
        variants: {
            variant: {
                default: "border-transparent bg-brand-primary active:opacity-80",
                secondary: "border-transparent bg-secondary active:opacity-80",
                destructive: "border-transparent bg-destructive active:opacity-80",
                outline: "border-gray-200",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const badgeTextVariants = cva(
    "text-xs font-semibold",
    {
        variants: {
            variant: {
                default: "text-white",
                secondary: "text-secondary-foreground",
                destructive: "text-destructive-foreground",
                outline: "text-brand-text",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export type BadgeProps = ViewProps &
    VariantProps<typeof badgeVariants> & {
        className?: string;
        textClassName?: string;
        children: React.ReactNode;
    };

function Badge({ className, textClassName, variant, children, ...props }: BadgeProps) {
    return (
        <View className={cn(badgeVariants({ variant }), className)} {...props}>
            {typeof children === "string" ? (
                <Text className={cn(badgeTextVariants({ variant }), textClassName)}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </View>
    )
}

export { Badge, badgeVariants, badgeTextVariants }
