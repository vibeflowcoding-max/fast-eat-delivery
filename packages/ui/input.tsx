"use client";

import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "./lib/utils";

export interface InputProps extends TextInputProps {
    className?: string;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <TextInput
                className={cn(
                    "flex h-12 w-full rounded-[16px] border border-[#F3F4F6] bg-[#F9FAFB] px-4 py-3 text-sm text-[#101828] font-body",
                    className
                )}
                placeholderTextColor="#9ca3af" // placeholder:text-gray-400
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
