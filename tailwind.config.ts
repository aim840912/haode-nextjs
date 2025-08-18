import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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