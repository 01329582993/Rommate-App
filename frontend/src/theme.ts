import { Platform, TextStyle, ViewStyle } from 'react-native';

// IUT (Islamic University of Technology) Brand Design Tokens
export const Theme = {
  colors: {
    primary: '#006A4E',        // Official IUT Emerald Green
    primaryDark: '#004D38',    // Deep IUT Forest Green
    primarySoft: '#ECFDF5',    // Mint Emerald Soft Tint
    emerald: '#059669',        // Bright Islamic Green
    gold: '#D97706',           // IUT Emblem Gold Accent
    goldSoft: '#FEF3C7',       // Gold Soft Tint
    background: '#F8FAFC',     // Clean Campus Slate
    surface: '#FFFFFF',        // Pure White Card Surface
    text: '#0F172A',           // High-contrast Dark Charcoal
    textSecondary: '#475569',  // Slate Secondary
    textMuted: '#94A3B8',      // Muted Label Gray
    border: '#E2E8F0',         // Soft Clean Border
    success: '#059669',        // Green Verified
    successSoft: '#D1FAE5',    // Green Pill
    warning: '#D97706',        // Amber Warning
    error: '#DC2626',          // Rose Error
    errorSoft: '#FEE2E2',      // Error Pill
    accent: '#006A4E',         // IUT Green Accent
    star: '#F59E0B',           // Gold Star
  },
  roundness: { full: 999, xl: 28, large: 22, medium: 16, small: 10 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  shadows: {
    subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    floating: { shadowColor: '#006A4E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 6 },
    strong: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  },
};

export const gradients = {
  brand: ['#006A4E', '#059669'] as const,          // IUT Emerald Green Gradient
  brandSoft: ['#ECFDF5', '#F0FDF4'] as const,      // Mint Soft Gradient
  dark: ['#022C22', '#004D38'] as const,           // IUT Heritage Dark Green Gradient
  gold: ['#D97706', '#F59E0B'] as const,           // IUT Gold Crest Gradient
};

const make = (opacity: number, radius: number, y: number, elevation: number): ViewStyle =>
  Platform.OS === 'android'
    ? { elevation }
    : { shadowColor: '#022C22', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: y } };

export const shadow = {
  sm: make(0.06, 6, 2, 1),
  md: make(0.10, 14, 6, 3),
  lg: make(0.16, 24, 12, 8),
};

export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, color: Theme.colors.text } as TextStyle,
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: Theme.colors.text } as TextStyle,
  heading: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2, color: Theme.colors.text } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, color: Theme.colors.text } as TextStyle,
  secondary: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary } as TextStyle,
  caption: { fontSize: 12, fontWeight: '600', color: Theme.colors.textMuted } as TextStyle,
  label: { fontSize: 13, fontWeight: '700', color: Theme.colors.textSecondary, letterSpacing: 0.2 } as TextStyle,
};

const AVATAR_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#006A4E', '#059669'],
  ['#047857', '#10B981'],
  ['#0D9488', '#14B8A6'],
  ['#D97706', '#F59E0B'],
  ['#0284C7', '#38BDF8'],
  ['#4F46E5', '#6366F1'],
];

export function avatarColors(seed: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function matchTone(score: number): {
  badge: readonly [string, string];
  pillBg: string;
  pillText: string;
  fg: string;
  label: string;
} {
  if (score >= 85) {
    return {
      badge: ['#006A4E', '#059669'],
      pillBg: '#ECFDF5',
      pillText: '#065F46',
      fg: '#006A4E',
      label: 'Great Match',
    };
  }
  if (score >= 70) {
    return {
      badge: ['#047857', '#10B981'],
      pillBg: '#F0FDF4',
      pillText: '#047857',
      fg: '#047857',
      label: 'Strong Match',
    };
  }
  if (score >= 50) {
    return {
      badge: ['#D97706', '#F59E0B'],
      pillBg: '#FEF3C7',
      pillText: '#B45309',
      fg: '#D97706',
      label: 'Moderate Match',
    };
  }
  return {
    badge: ['#64748B', '#94A3B8'],
    pillBg: '#F1F5F9',
    pillText: '#475569',
    fg: '#64748B',
    label: 'Low Match',
  };
}
