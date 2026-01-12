/**
 * Centralized Theme System for RUX
 * Used across all pages: dashboard, landing, login, signup, settings, billing
 */

export const theme = {
  // Gradients
  gradients: {
    primary: 'from-cyan-400 via-blue-500 to-purple-600',
    primaryLight: 'from-cyan-500/20 to-blue-500/20',
    secondary: 'from-purple-500 via-pink-600 to-purple-700',
    success: 'from-green-400 to-green-600',
    warning: 'from-yellow-500 via-orange-500 to-yellow-600',
    error: 'from-red-500 to-red-600',
    background: 'from-slate-900 via-purple-900 to-slate-900',
  },

  // Colors
  colors: {
    primary: '#0891b2', // cyan-600
    secondary: '#9333ea', // purple-600
    success: '#16a34a', // green-600
    warning: '#f59e0b', // amber-500
    error: '#dc2626', // red-600
    background: '#0f172a', // slate-900
    surface: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  // Card styles
  card: {
    base: 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl hover:border-white/20 transition-all duration-500',
    hover: 'hover:shadow-cyan-500/10',
    dark: 'bg-white/8 border border-white/15',
  },

  // Button styles
  buttons: {
    primary: 'px-8 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-2xl text-white font-bold hover:shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105',
    secondary: 'px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-600 to-purple-700 rounded-xl text-white font-semibold hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105',
    success: 'px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105',
    warning: 'px-8 py-3 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 rounded-2xl text-white font-bold hover:shadow-2xl hover:shadow-yellow-500/50 transition-all hover:scale-105',
    outline: 'px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 text-gray-300 hover:text-white',
    danger: 'px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 text-red-300 hover:text-red-200',
  },

  // Navigation
  nav: {
    base: 'backdrop-blur-xl bg-black/20 border-b border-white/10 px-6 py-4 sticky top-0 z-50 shadow-lg',
  },

  // Text styles
  text: {
    h1: 'text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent',
    h2: 'text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent',
    h3: 'text-3xl font-bold text-cyan-300',
    body: 'text-gray-300',
    muted: 'text-gray-400',
  },

  // Plan types
  plans: {
    free: {
      name: 'Free',
      color: 'from-gray-400 to-gray-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
    },
    pro: {
      name: 'PRO',
      color: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    ultimate: {
      name: 'Ultimate',
      color: 'from-purple-400 to-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
  },
};

// Utility functions
export const getGradientClass = (key: keyof typeof theme.gradients) => {
  return `bg-gradient-to-r ${theme.gradients[key]}`;
};

export const getPlanColors = (role: 'free' | 'pro' | 'ultimate') => {
  return theme.plans[role];
};

export const syntaxHighlightStyle = {
  backgroundColor: '#1e293b',
  color: '#e2e8f0',
  padding: '1rem',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  lineHeight: '1.5',
  overflow: 'auto',
};
