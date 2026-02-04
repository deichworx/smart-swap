export const colors = {
  // Background
  bg: {
    primary: '#0D0D0D',
    secondary: '#141414',
    tertiary: '#1A1A1A',
    card: '#1E1E1E',
  },

  // Accent - Solana colors
  accent: {
    purple: '#9945FF',
    purpleLight: '#B77DFF',
    green: '#14F195',
    greenDark: '#0EA66E',
    gradient: ['#9945FF', '#14F195'] as const,
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    tertiary: '#888888', // WCAG AA 4.5:1 on #0D0D0D
    inverse: '#0D0D0D',
  },

  // Status - WCAG AA compliant colors (4.5:1 contrast ratio on dark bg)
  status: {
    success: '#14F195',
    successBg: 'rgba(20, 241, 149, 0.1)',
    error: '#FF6B6B', // Adjusted from #FF4D4D for WCAG AA compliance
    errorBg: 'rgba(255, 107, 107, 0.1)',
    warning: '#FFD166', // Adjusted from #FFB84D for WCAG AA compliance
    warningBg: 'rgba(255, 209, 102, 0.1)',
  },

  // Borders
  border: {
    primary: '#2A2A2A',
    secondary: '#333333',
    focus: '#9945FF',
  },

  // Overlays - for semi-transparent backgrounds
  overlay: {
    light: 'rgba(0,0,0,0.15)',
    modal: 'rgba(0,0,0,0.8)',
    purpleSubtle: 'rgba(153, 69, 255, 0.1)',
    purpleLight: 'rgba(153, 69, 255, 0.15)',
    purpleMedium: 'rgba(153, 69, 255, 0.3)',
    greenSubtle: 'rgba(20, 241, 149, 0.05)',
    greenLight: 'rgba(20, 241, 149, 0.2)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 40,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
