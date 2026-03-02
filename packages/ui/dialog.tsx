"use client";

import * as React from "react"
import { Modal, View, Text, Pressable, type ModalProps, type ViewProps, type TextProps } from "react-native"
import { cn } from "./lib/utils"

function Dialog({ children, open, onOpenChange, ...props }: any) {
    return (
        <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={() => onOpenChange?.(false)}
            {...props}
        >
            <View className="flex-1 justify-center items-center bg-black/80 px-4">
                <View className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
                    <Pressable
                        onPress={() => onOpenChange?.(false)}
                        className="absolute right-4 top-4 z-10 rounded-sm opacity-70 active:opacity-100"
                    >
                        <Text className="text-xl text-black">×</Text>
                    </Pressable>
                    {children}
                </View>
            </View>
        </Modal>
    )
}

const DialogTrigger = ({ children, onPress }: any) => {
    return <Pressable onPress={onPress}>{children}</Pressable>
}

const DialogContent = ({ className, children, ...props }: ViewProps) => (
    <View className={cn("mt-2", className)} {...props}>
        {children}
    </View>
)

const DialogHeader = ({ className, ...props }: ViewProps) => (
    <View className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: ViewProps) => (
    <View className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const DialogTitle = ({ className, ...props }: TextProps) => (
    <Text className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900", className)} {...props} />
)

const DialogDescription = ({ className, ...props }: TextProps) => (
    <Text className={cn("text-sm text-gray-500 mt-1", className)} {...props} />
)

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
