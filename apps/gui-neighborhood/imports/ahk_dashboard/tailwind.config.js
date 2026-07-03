/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ahk: {
          // Primary Navy - Deep, sophisticated background
          navy: {
            50: '#e6eaed',
            100: '#ccd4da',
            200: '#99a9b5',
            300: '#667f90',
            400: '#33546b',
            500: '#0A192F',  // Primary navy from letterhead
            600: '#112240',  // Secondary navy for depth
            700: '#060f1c',
            800: '#040a13',
            900: '#020509',
          },
          // Signature Gold - Luxury accent
          gold: {
            50: '#faf8f0',
            100: '#F4E5B1',  // Light gold from letterhead
            200: '#ebe3c3',
            300: '#e1d5a5',
            400: '#d7c787',
            500: '#D4AF37',  // Signature accent gold
            600: '#aa8c2c',
            700: '#7f6921',
            800: '#554616',
            900: '#2a230b',
          },
          // Premium Slate - Sophisticated text
          slate: {
            50: '#f1f2f4',
            100: '#e3e5e8',
            200: '#CCD6F6',  // Light slate from letterhead
            300: '#abb1ba',
            400: '#8f97a3',
            500: '#8892B0',  // Base slate
            600: '#6d758d',
            700: '#52586a',
            800: '#373b46',
            900: '#1b1d23',
          },
          // Electric Blue - Modern tech accent
          blue: {
            50: '#e6f9ff',
            100: '#b3efff',
            200: '#80e5ff',
            300: '#4ddbff',
            400: '#1ad1ff',
            500: '#00D9FF',  // Electric blue from letterhead
            600: '#00aed9',
            700: '#0082a3',
            800: '#00566d',
            900: '#002a36',
          },
          // Neon Green - Success & growth
          green: {
            50: '#e8fbf0',
            100: '#c1f5d8',
            200: '#99efc0',
            300: '#72e9a8',
            400: '#4be390',
            500: '#4ADE80',  // Neon green from letterhead
            600: '#3bb266',
            700: '#2c864d',
            800: '#1d5933',
            900: '#0e2d1a',
          },
          // Vibrant Purple - Premium feature highlight
          purple: {
            50: '#f5f3ff',
            100: '#ede9fe',
            200: '#ddd6fe',
            300: '#c4b5fd',
            400: '#a78bfa',  // Vibrant purple from letterhead
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95',
          }
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],  // Letterhead body font
        display: ['Montserrat', 'Poppins', 'sans-serif'],  // Letterhead heading font
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xxs': '0.625rem',
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
      },
      animation: {
        // Letterhead-inspired animations
        'orb-float': 'orbFloat 18s infinite ease-in-out',
        'shape-float': 'shapeFloat 35s infinite ease-in-out',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'logo-pulse': 'logoPulse 3s ease-in-out infinite',
        'badge-glow': 'badgeGlow 2s ease-in-out infinite',
        'fade-in-down': 'fadeInDown 1s ease-out',
        'fade-in-up': 'fadeInUp 1.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
      },
      keyframes: {
        orbFloat: {
          '0%, 100%': { 
            transform: 'scale(1) translateY(0) rotate(0deg)', 
            opacity: '0.08' 
          },
          '50%': { 
            transform: 'scale(1.2) translateY(-30px) rotate(180deg)', 
            opacity: '0.15' 
          },
        },
        shapeFloat: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-50px) translateX(40px) rotate(120deg)' },
          '66%': { transform: 'translateY(40px) translateX(-40px) rotate(240deg)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        logoPulse: {
          '0%, 100%': { 
            transform: 'scale(1)', 
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.4)' 
          },
          '50%': { 
            transform: 'scale(1.05)', 
            boxShadow: '0 12px 35px rgba(212, 175, 55, 0.6)' 
          },
        },
        badgeGlow: {
          '0%, 100%': { boxShadow: '0 4px 15px rgba(74, 222, 128, 0.4)' },
          '50%': { boxShadow: '0 6px 25px rgba(74, 222, 128, 0.7)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-navy': 'linear-gradient(135deg, #0A192F 0%, #112240 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37, #F4E5B1)',
        'gradient-electric': 'linear-gradient(135deg, #D4AF37, #00D9FF, #D4AF37)',
        'gradient-premium': 'linear-gradient(135deg, #D4AF37, #00D9FF, #4ADE80)',
        'glass-navy': 'linear-gradient(135deg, rgba(10, 25, 47, 0.8), rgba(17, 34, 64, 0.8))',
        'glass-gold': 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(244, 229, 177, 0.1))',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        'gold-sm': '0 2px 8px rgba(212, 175, 55, 0.2)',
        'gold-md': '0 4px 16px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 8px 32px rgba(212, 175, 55, 0.4)',
        'gold-xl': '0 12px 48px rgba(212, 175, 55, 0.5)',
        'blue-sm': '0 2px 8px rgba(0, 217, 255, 0.2)',
        'blue-md': '0 4px 16px rgba(0, 217, 255, 0.3)',
        'blue-lg': '0 8px 32px rgba(0, 217, 255, 0.4)',
        'green-sm': '0 2px 8px rgba(74, 222, 128, 0.2)',
        'green-md': '0 4px 16px rgba(74, 222, 128, 0.3)',
        'premium': '0 20px 60px rgba(10, 25, 47, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [],
}
