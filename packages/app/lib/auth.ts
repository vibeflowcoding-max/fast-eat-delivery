import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from './supabase'

// Required for web to work correctly with WebBrowser
if (Platform.OS === 'web') {
    WebBrowser.maybeCompleteAuthSession()
}

export const performOAuth = async (provider: 'google' | 'apple' | 'github') => {
    const redirectUrl = makeRedirectUri({
        path: '/auth/callback',
    })

    // On Web, use standard Supabase redirect
    if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin + '/auth/callback',
            },
        })
        if (error) throw error
        return { data }
    }

    // On Native, use expo-web-browser
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
        },
    })

    if (error) throw error
    if (!data?.url) throw new Error('No url returned from Supabase OAuth')

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

    if (res.type === 'success') {
        const url = new URL(res.url)
        const urlParams = new URLSearchParams(url.search)
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')

        if (accessToken && refreshToken) {
            await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            })
        }
    }

    return { type: res.type }
}
