"use client";

import * as React from "react";
import { Pressable, Text, type PressableProps, type ViewStyle } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const buttonVariants = cva(
    "flex-row items-center justify-center rounded-[16px] disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-brand-accent shadow-sm active:opacity-80",
                primary: "bg-brand-primary shadow-md active:opacity-80",
                destructive: "bg-destructive active:opacity-80",
                outline: "border border-brand-accent bg-transparent active:bg-brand-accent",
                secondary: "bg-secondary active:opacity-80",
                ghost: "active:bg-brand-accent",
                link: "",
            },
            size: {
                default: "h-12 px-6 py-3",
                sm: "h-9 rounded-[12px] px-4",
                lg: "h-14 rounded-[16px] px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const buttonTextVariants = cva(
    "text-sm font-medium text-center",
    {
        variants: {
            variant: {
                default: "text-gray-600",
                primary: "text-white",
                destructive: "text-destructive-foreground",
                outline: "text-brand-text active:text-brand-text",
                secondary: "text-secondary-foreground",
                ghost: "text-brand-text",
                link: "text-brand-text underline",
            },
            size: {
                default: "",
                sm: "",
                lg: "",
                icon: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends PressableProps,
    VariantProps<typeof buttonVariants> {
    className?: string;
    textClassName?: string;
    children: React.ReactNode;
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
    ({ className, textClassName, variant, size, children, ...props }, ref) => {
        return (
            <Pressable
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            >
                {typeof children === "string" ? (
                    <Text className={cn(buttonTextVariants({ variant, size, className: textClassName }))}>
                        {children}
                    </Text>
                ) : (
                    children
                )}
            </Pressable>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonTextVariants };
