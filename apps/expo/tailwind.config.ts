import type { Config } from "tailwindcss";
import sharedConfig from "../../packages/ui/tailwind.config";

const config = {
    presets: [sharedConfig, require("nativewind/preset")],
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/features/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/components/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/providers/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/navigation/**/*.{js,jsx,ts,tsx}",
        "../../packages/app/*.{js,jsx,ts,tsx}",
        "../../packages/ui/*.{js,jsx,ts,tsx}",
        "../../packages/ui/components/**/*.{js,jsx,ts,tsx}",
    ],
} satisfies Config;

export default config;
