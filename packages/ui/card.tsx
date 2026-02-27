import * as React from "react"
import { View, Text, type ViewProps, type TextProps } from "react-native"

import { cn } from "./lib/utils"

const Card = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
    ({ className, ...props }, ref) => (
        <View
            ref={ref}
            className={cn(
                "rounded-lg border border-gray-200 bg-white shadow-sm",
                className
            )}
            {...props}
        />
    )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
    ({ className, ...props }, ref) => (
        <View
            ref={ref}
            className={cn("flex flex-col space-y-1.5 p-6", className)}
            {...props}
        />
    )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
    ({ className, ...props }, ref) => (
        <Text
            ref={ref}
            className={cn(
                "text-2xl font-semibold tracking-tight text-gray-900",
                className
            )}
            {...props}
        />
    )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
    ({ className, ...props }, ref) => (
        <Text
            ref={ref}
            className={cn("text-sm text-gray-500", className)}
            {...props}
        />
    )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
    ({ className, ...props }, ref) => (
        <View ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
    ({ className, ...props }, ref) => (
        <View
            ref={ref}
            className={cn("flex-row items-center p-6 pt-0", className)}
            {...props}
        />
    )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
