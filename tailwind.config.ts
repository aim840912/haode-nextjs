import type { Config } from 'tailwindcss'

export default {
  // 改用 class-based dark mode，配合 ThemeContext
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // 擴展語義化顏色（使用 CSS 變數）
        'primary-green': 'var(--primary-green)',
        'primary-green-hover': 'var(--primary-green-hover)',
        'primary-green-light': 'var(--primary-green-light)',
        'primary-green-bg': 'var(--primary-green-bg)',
        'card-bg': 'var(--card-bg)',
        'card-bg-secondary': 'var(--card-bg-secondary)',
        'card-border': 'var(--card-border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'input-border-focus': 'var(--input-border-focus)',
        'hover-bg': 'var(--hover-bg)',
        divider: 'var(--divider)',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-tc)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-noto-serif-tc)', 'Georgia', 'serif'],
        display: ['var(--font-noto-sans-tc)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['var(--font-noto-sans-tc)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-reverse': 'spin-reverse 1s linear infinite',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
} satisfies Config
