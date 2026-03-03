import type { Config } from 'tailwindcss'

export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                bg: '#f5f4f0',
                bg2: '#eeecea',
                surface: '#ffffff',
                surface2: '#faf9f7',
                border: '#e2ddd8',
                border2: '#d4cec8',
                ink: '#1c1917',
                ink2: '#44403c',
                ink3: '#78716c',
                ink4: '#a8a29e',
                brand: {
                    DEFAULT: '#c2410c',
                    light: '#fff7ed',
                },
                amber: {
                    DEFAULT: '#d97706',
                    light: '#fef3c7',
                    mid: '#fde68a',
                },
                green: {
                    DEFAULT: '#059669',
                    light: '#d1fae5',
                },
                red: {
                    DEFAULT: '#dc2626',
                    light: '#fee2e2',
                },
                blue: {
                    DEFAULT: '#2563eb',
                    light: '#dbeafe',
                },
                orange: {
                    DEFAULT: '#ea580c',
                    light: '#ffedd5',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                serif: ['Fraunces', 'serif'],
            },
            boxShadow: {
                sm: '0 1px 3px rgba(28,25,23,0.07), 0 1px 2px rgba(28,25,23,0.04)',
                md: '0 4px 12px rgba(28,25,23,0.08), 0 1px 3px rgba(28,25,23,0.04)',
                lg: '0 12px 32px rgba(28,25,23,0.10), 0 4px 8px rgba(28,25,23,0.05)',
            },
            borderRadius: {
                DEFAULT: '10px',
                sm: '6px',
            },
        },
    },
    plugins: [],
} satisfies Config
