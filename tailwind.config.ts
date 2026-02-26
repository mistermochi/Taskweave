
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/views/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
      },
      fontSize: {
        'xxs': '10px',
      },
      minWidth: {
        '48': '12rem',
      },
      boxShadow: {
        'player': '0 8px 32px rgba(0,0,0,0.4)',
        'hero': '0 0 30px hsla(var(--primary), 0.05)',
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        'surface-1': 'hsla(var(--surface-1-hsl), 0.7)',
        'surface-2': 'hsla(var(--surface-2-hsl), 0.6)',
        'surface-highlight': 'hsl(var(--surface-highlight))',
        
        primary: 'hsl(var(--primary))',
        'primary-dim': 'hsl(var(--primary-dim))',
        'primary-glow': 'hsla(var(--primary), 0.15)',
        
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))', 
        'accent-purple': 'hsl(var(--accent-purple))',
      },
      width: {
        'sidebar': '260px',
        'sidebar-mobile': '280px',
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(var(--tw-gradient-stops))',
      },
      transitionTimingFunction: {
        'elastic-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'productive-in-out': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 10s ease-in-out infinite',
        'subtle-progress': 'subtleProgress 1.5s infinite ease-in-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(0.5)', opacity: '0.4' }, // Exhaled state
          '40%': { transform: 'scale(1)', opacity: '1' },         // Inhaled state
          '60%': { transform: 'scale(1)', opacity: '0.9' },       // Hold state
        },
        subtleProgress: {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '50%', marginLeft: '25%' },
          '100%': { width: '0%', marginLeft: '100%' }
        }
      }
    }
  },
  plugins: [
    require('tailwindcss-animate')
  ],
}
export default config;
