'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/lib/hooks';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, customTheme } = useAppSelector((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme mode
    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystemTheme = () => {
        root.classList.toggle('dark', mediaQuery.matches);
      };
      
      applySystemTheme();
      mediaQuery.addEventListener('change', applySystemTheme);
      
      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    } else {
      root.classList.toggle('dark', mode === 'dark');
    }
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply custom theme colors
    root.style.setProperty('--primary', customTheme.colors.primary);
    root.style.setProperty('--secondary', customTheme.colors.secondary);
    root.style.setProperty('--accent', customTheme.colors.accent);
    root.style.setProperty('--background', customTheme.colors.background);
    root.style.setProperty('--surface', customTheme.colors.surface);
    root.style.setProperty('--text', customTheme.colors.text);
    root.style.setProperty('--border', customTheme.colors.border);
    root.style.setProperty('--success', customTheme.colors.success);
    root.style.setProperty('--warning', customTheme.colors.warning);
    root.style.setProperty('--error', customTheme.colors.error);
    
    // Apply typography
    root.style.setProperty('--font-family', customTheme.typography.fontFamily);
    
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[customTheme.typography.fontSize]);
    
    // Apply spacing density
    const spacingMap = {
      compact: '0.75',
      comfortable: '1',
      spacious: '1.25',
    };
    root.style.setProperty('--spacing-scale', spacingMap[customTheme.spacing.density]);
    
    // Apply border radius
    const borderRadiusMap = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '12px',
    };
    root.style.setProperty('--border-radius', borderRadiusMap[customTheme.borderRadius]);
    
    // Apply animations
    root.style.setProperty('--animation-duration', customTheme.animations ? '200ms' : '0ms');
    
    // Apply CSS classes for density
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    root.classList.add(`density-${customTheme.spacing.density}`);
    
    // Apply CSS classes for animations
    root.classList.toggle('animations-disabled', !customTheme.animations);
    
  }, [customTheme]);

  return <>{children}</>;
}

// Theme utility functions
export const getThemeValue = (property: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${property}`);
};

export const applyThemeToElement = (element: HTMLElement, theme: any) => {
  Object.entries(theme.colors).forEach(([key, value]) => {
    element.style.setProperty(`--${key}`, value as string);
  });
};

// Theme presets for quick switching
export const themePresets = {
  blue: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  green: {
    primary: '#059669',
    secondary: '#64748b',
    accent: '#10b981',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  purple: {
    primary: '#7c3aed',
    secondary: '#64748b',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  orange: {
    primary: '#ea580c',
    secondary: '#64748b',
    accent: '#f97316',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

// CSS-in-JS theme object for styled components
export const createThemeObject = (customTheme: any) => ({
  colors: customTheme.colors,
  typography: {
    fontFamily: customTheme.typography.fontFamily,
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
    }[customTheme.typography.fontSize],
  },
  spacing: {
    scale: {
      compact: 0.75,
      comfortable: 1,
      spacious: 1.25,
    }[customTheme.spacing.density],
  },
  borderRadius: {
    none: '0px',
    small: '4px',
    medium: '8px',
    large: '12px',
  }[customTheme.borderRadius],
  animations: {
    duration: customTheme.animations ? '200ms' : '0ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
});

// Hook for accessing theme values in components
export const useTheme = () => {
  const theme = useAppSelector((state) => state.theme);
  return {
    ...theme,
    themeObject: createThemeObject(theme.customTheme),
  };
};
