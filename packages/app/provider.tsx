'use client';

import * as React from 'react'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Pressable, TextInput, Image, ScrollView } from 'react-native'
import { cssInterop } from "react-native-css-interop";

// Initialize CSS Interop for all common components
cssInterop(View, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(Pressable, { className: "style" });
cssInterop(TextInput, { className: "style" });
cssInterop(Image, { className: "style" });
cssInterop(ScrollView, { className: "style" });
cssInterop(SafeAreaView, { className: "style" });

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SafeAreaProvider style={{ flex: 1 }}>
            {children}
        </SafeAreaProvider>
    )
}
