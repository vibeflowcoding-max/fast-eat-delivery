import type { Config } from "tailwindcss";

const config = {
    darkMode: "class",
    presets: [require("nativewind/preset")],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "../../packages/ui/*.{js,jsx,ts,tsx}",
        "../../packages/ui/components/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/features/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/components/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/providers/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/navigation/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: "#6A7282",
                    accent: "#F3F4F6",
                    background: "#FDFCF0",
                    text: "#101828",
                },
            },
        },
    },
    plugins: [],
} satisfies Config;

export default config;
