import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // 確保動態高度類名始終被包含
    'h-32', 'h-40', 'h-48', 'h-56', 'h-64', 'h-72', 'h-80', 'h-96'
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-tc)", "var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-noto-serif-tc)", "Georgia", "serif"],
        display: ["var(--font-noto-sans-tc)", "var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-noto-sans-tc)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
} satisfies Config;