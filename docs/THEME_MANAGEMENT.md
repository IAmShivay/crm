# Theme Management System

This document provides a comprehensive guide to the CRM's theme management system, including customization options, implementation details, and best practices.

## Overview

The CRM features a powerful theme management system that allows users to:
- Switch between light, dark, and auto modes
- Choose from predefined color presets
- Create custom color schemes
- Adjust typography settings
- Control layout density and spacing
- Enable/disable animations
- Export and import theme configurations

## Architecture

### Core Components

1. **ThemeSlice** (`lib/slices/themeSlice.ts`)
   - Redux store for theme state management
   - Actions for theme modifications
   - Predefined theme presets

2. **ThemeProvider** (`components/providers/ThemeProvider.tsx`)
   - React context provider for theme application
   - CSS custom property management
   - System preference detection

3. **ThemeCustomizer** (`components/theme/ThemeCustomizer.tsx`)
   - User interface for theme customization
   - Real-time preview functionality
   - Import/export capabilities

### Theme Structure

```typescript
interface CustomTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  spacing: {
    density: 'compact' | 'comfortable' | 'spacious';
  };
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  animations: boolean;
}
```

## Usage Guide

### Basic Theme Switching

```typescript
import { useAppDispatch } from '@/lib/hooks';
import { setThemeMode, setPreset } from '@/lib/slices/themeSlice';

const dispatch = useAppDispatch();

// Switch theme mode
dispatch(setThemeMode('dark'));

// Apply preset
dispatch(setPreset('blue'));
```

### Custom Color Configuration

```typescript
import { updateThemeColors } from '@/lib/slices/themeSlice';

// Update specific colors
dispatch(updateThemeColors({
  primary: '#2563eb',
  accent: '#0ea5e9'
}));
```

### Typography Customization

```typescript
import { updateTypography } from '@/lib/slices/themeSlice';

// Update font settings
dispatch(updateTypography({
  fontFamily: 'Inter',
  fontSize: 'medium'
}));
```

### Layout Adjustments

```typescript
import { updateSpacing, setBorderRadius } from '@/lib/slices/themeSlice';

// Adjust spacing density
dispatch(updateSpacing({ density: 'compact' }));

// Set border radius
dispatch(setBorderRadius('medium'));
```

## Theme Modes

### Light Mode
- Default bright theme
- High contrast for readability
- Suitable for well-lit environments

### Dark Mode
- Dark background with light text
- Reduced eye strain in low-light conditions
- Modern aesthetic appeal

### Auto Mode
- Automatically switches based on system preference
- Uses `prefers-color-scheme` media query
- Seamless user experience

## Predefined Presets

### Ocean Blue (Default)
```css
--primary: #2563eb
--secondary: #64748b
--accent: #0ea5e9
--success: #10b981
```

### Forest Green
```css
--primary: #059669
--secondary: #64748b
--accent: #10b981
--success: #22c55e
```

### Royal Purple
```css
--primary: #7c3aed
--secondary: #64748b
--accent: #8b5cf6
--success: #10b981
```

### Sunset Orange
```css
--primary: #ea580c
--secondary: #64748b
--accent: #f97316
--success: #10b981
```

## CSS Custom Properties

The theme system uses CSS custom properties for dynamic styling:

```css
:root {
  /* Colors */
  --primary: #2563eb;
  --secondary: #64748b;
  --accent: #0ea5e9;
  --background: #ffffff;
  --surface: #f8fafc;
  --text: #1e293b;
  --border: #e2e8f0;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  
  /* Typography */
  --font-family: 'Inter';
  --base-font-size: 16px;
  
  /* Layout */
  --spacing-scale: 1;
  --border-radius: 8px;
  --animation-duration: 200ms;
}
```

## Component Integration

### Using Theme Values in Components

```typescript
import { useTheme } from '@/components/providers/ThemeProvider';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <div style={{
      backgroundColor: theme.customTheme.colors.primary,
      borderRadius: theme.themeObject.borderRadius
    }}>
      Content
    </div>
  );
}
```

### CSS Classes for Density

```css
.density-compact {
  --spacing-scale: 0.75;
}

.density-comfortable {
  --spacing-scale: 1;
}

.density-spacious {
  --spacing-scale: 1.25;
}
```

### Animation Control

```css
.animations-disabled * {
  animation-duration: 0ms !important;
  transition-duration: 0ms !important;
}
```

## Advanced Features

### Theme Export/Import

Users can export their custom themes as JSON files:

```json
{
  "mode": "dark",
  "preset": "custom",
  "customTheme": {
    "colors": {
      "primary": "#2563eb",
      "secondary": "#64748b"
    },
    "typography": {
      "fontFamily": "Inter",
      "fontSize": "medium"
    }
  }
}
```

### Real-time Preview

The theme customizer provides real-time preview functionality:
- Changes apply immediately
- No page refresh required
- Visual feedback for all modifications

### Accessibility Considerations

- High contrast ratios maintained
- Color-blind friendly palettes
- Keyboard navigation support
- Screen reader compatibility

## Best Practices

### Color Selection
1. Ensure sufficient contrast ratios (WCAG AA compliance)
2. Test colors in both light and dark modes
3. Consider color-blind accessibility
4. Maintain brand consistency

### Typography
1. Choose web-safe fonts with good fallbacks
2. Ensure readability at all sizes
3. Consider loading performance
4. Test across different devices

### Performance
1. Use CSS custom properties for efficiency
2. Minimize theme switching overhead
3. Optimize font loading
4. Cache theme preferences

### User Experience
1. Provide clear visual feedback
2. Allow easy theme reset
3. Support system preferences
4. Enable theme sharing

## Troubleshooting

### Common Issues

**Theme not applying:**
- Check if ThemeProvider is properly wrapped
- Verify CSS custom properties are defined
- Ensure theme state is updated in Redux

**Colors not updating:**
- Clear browser cache
- Check for CSS specificity conflicts
- Verify custom property names

**Performance issues:**
- Reduce animation complexity
- Optimize font loading
- Use efficient CSS selectors

### Debug Tools

```typescript
// Check current theme state
console.log(store.getState().theme);

// Verify CSS custom properties
console.log(getComputedStyle(document.documentElement).getPropertyValue('--primary'));
```

## Migration Guide

### From v1.x to v2.x

1. Update theme slice imports
2. Replace old color variables
3. Update component styling
4. Test theme switching

### Breaking Changes

- Color property names changed
- Typography structure updated
- Spacing system redesigned

## API Reference

### Theme Actions

```typescript
// Mode management
setThemeMode(mode: 'light' | 'dark' | 'auto')
toggleTheme()

// Preset management
setPreset(presetId: string)
addCustomPreset(preset: ThemePreset)
removeCustomPreset(presetId: string)

// Customization
updateThemeColors(colors: Partial<ThemeColors>)
updateTypography(typography: Partial<Typography>)
updateSpacing(spacing: Partial<Spacing>)
setBorderRadius(radius: BorderRadius)
toggleAnimations()

// Utility
resetTheme()
```

### Theme Hooks

```typescript
// Get complete theme state
const theme = useTheme();

// Get specific theme values
const primaryColor = useThemeValue('primary');
const isDark = useThemeMode() === 'dark';
```

## Contributing

When contributing to the theme system:

1. Follow existing naming conventions
2. Ensure backward compatibility
3. Add comprehensive tests
4. Update documentation
5. Consider accessibility impact

## Future Enhancements

- Advanced color palette generation
- Theme marketplace
- AI-powered theme suggestions
- Enhanced accessibility features
- Performance optimizations
