module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ab3-black': '#0a0a0a',
        'ab3-dark': '#111111',
        'ab3-gray-900': '#1a1a1a',
        'ab3-gray-800': '#2a2a2a',
        'ab3-gray-700': '#3a3a3a',
        'ab3-gray-600': '#4a4a4a',
        'ab3-gray-500': '#6a6a6a',
        'ab3-gray-400': '#8a8a8a',
        'ab3-gray-300': '#b0b0b0',
        'ab3-olive': '#4a5d23',
        'ab3-olive-light': '#5a7330',
        'ab3-olive-dark': '#3a4a1a',
        'ab3-gold': '#c9a227',
        'ab3-gold-light': '#e0b93d',
        'ab3-gold-dark': '#a68520',
        'ab3-blue': '#2563eb',
        'ab3-cyan': '#06b6d4',
        'ab3-red': '#dc2626',
        'ab3-green': '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(17, 17, 17, 0.9) 100%)',
        'gradient-gold': 'linear-gradient(135deg, #c9a227 0%, #e0b93d 100%)',
        'gradient-olive': 'linear-gradient(135deg, #4a5d23 0%, #5a7330 100%)',
        'gradient-hero': 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
        'glass': 'rgba(255, 255, 255, 0.05)',
        'glass-hover': 'rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-down': 'fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-left': 'fadeInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-right': 'fadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'border-glow': 'borderGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 162, 39, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 162, 39, 0.2)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(201, 162, 39, 0.2)' },
          '50%': { borderColor: 'rgba(201, 162, 39, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow': '0 0 30px rgba(201, 162, 39, 0.15)',
        'gold': '0 4px 20px rgba(201, 162, 39, 0.25)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.4)',
        'card-lg': '0 10px 25px rgba(0, 0, 0, 0.5)',
        'card-xl': '0 20px 50px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
};
