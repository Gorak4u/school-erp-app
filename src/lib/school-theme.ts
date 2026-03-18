/**
 * School Theme Management System
 * 
 * Allows schools to customize their login and UI themes
 * - Pre-defined themes
 * - Custom color themes
 * - Font preferences
 * - Logo and branding
 */

export interface SchoolTheme {
  // Core colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  
  // UI elements
  gradient: string;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputFocusColor: string;
  
  // Typography
  fontFamily?: string;
  headingFont?: string;
  
  // Branding
  logoUrl?: string;
  faviconUrl?: string;
  
  // Layout preferences
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  buttonStyle?: 'rounded' | 'square' | 'pill';
  
  // Theme metadata
  themeType: 'auto' | 'preset' | 'custom';
  presetId?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  lastUpdated?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  category: 'modern' | 'classic' | 'vibrant' | 'professional' | 'educational';
}

// Pre-defined theme presets
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'modern_blue',
    name: 'Modern Blue',
    description: 'Clean and professional blue theme',
    category: 'modern',
    colors: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#60a5fa',
      background: '#0f172a',
      text: '#ffffff'
    }
  },
  {
    id: 'elegant_purple',
    name: 'Elegant Purple',
    description: 'Sophisticated purple gradient theme',
    category: 'professional',
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#a78bfa',
      background: '#1e1b4b',
      text: '#ffffff'
    }
  },
  {
    id: 'fresh_green',
    name: 'Fresh Green',
    description: 'Natural and calming green theme',
    category: 'educational',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      background: '#064e3b',
      text: '#ffffff'
    }
  },
  {
    id: 'warm_orange',
    name: 'Warm Orange',
    description: 'Energetic and welcoming orange theme',
    category: 'vibrant',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#fb923c',
      background: '#431407',
      text: '#ffffff'
    }
  },
  {
    id: 'classic_gray',
    name: 'Classic Gray',
    description: 'Traditional and neutral gray theme',
    category: 'classic',
    colors: {
      primary: '#6b7280',
      secondary: '#4b5563',
      accent: '#9ca3af',
      background: '#111827',
      text: '#ffffff'
    }
  },
  {
    id: 'royal_red',
    name: 'Royal Red',
    description: 'Bold and prestigious red theme',
    category: 'professional',
    colors: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#f87171',
      background: '#450a0a',
      text: '#ffffff'
    }
  }
];

/**
 * Generate theme from preset
 */
export function generateThemeFromPreset(preset: ThemePreset): SchoolTheme {
  const { colors } = preset;
  
  return {
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    backgroundColor: `linear-gradient(135deg, 
      ${colors.background} 0%, 
      ${colors.secondary}33 50%, 
      ${colors.background} 100%
    )`,
    textColor: colors.text,
    gradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    inputBackgroundColor: `${colors.primary}20`,
    inputBorderColor: `${colors.primary}60`,
    inputFocusColor: colors.accent,
    themeType: 'preset'
  };
}

/**
 * Generate custom theme from color values
 */
export function generateCustomTheme(colors: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}): SchoolTheme {
  return {
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    backgroundColor: `linear-gradient(135deg, 
      ${colors.background} 0%, 
      ${colors.secondary}33 50%, 
      ${colors.background} 100%
    )`,
    textColor: colors.text,
    gradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    inputBackgroundColor: `${colors.primary}20`,
    inputBorderColor: `${colors.primary}60`,
    inputFocusColor: colors.accent,
    themeType: 'custom',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Generate automatic theme based on school name (fallback)
 */
export function generateAutoTheme(schoolName: string): SchoolTheme {
  // Generate hash from school name for consistent colors
  let hash = 0;
  for (let i = 0; i < schoolName.length; i++) {
    hash = schoolName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate hue value (0-360)
  const hue = Math.abs(hash % 360);
  
  // Generate complementary colors
  const primaryHue = hue;
  const secondaryHue = (hue + 120) % 360;
  const accentHue = (hue + 240) % 360;
  
  // Generate colors
  const primaryColor = `hsl(${primaryHue}, 70%, 55%)`;
  const secondaryColor = `hsl(${secondaryHue}, 65%, 50%)`;
  const accentColor = `hsl(${accentHue}, 75%, 60%)`;
  
  return {
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor: `linear-gradient(135deg, 
      hsl(${primaryHue}, 30%, 8%) 0%, 
      hsl(${secondaryHue}, 25%, 12%) 50%, 
      hsl(${primaryHue}, 20%, 6%) 100%
    )`,
    textColor: '#ffffff',
    gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
    inputBackgroundColor: `hsl(${primaryHue}, 15%, 25%)`,
    inputBorderColor: `hsl(${primaryHue}, 40%, 40%)`,
    inputFocusColor: accentColor,
    themeType: 'auto'
  };
}

/**
 * Get theme for a school from settings or generate fallback
 */
export async function getSchoolTheme(schoolId: string): Promise<SchoolTheme> {
  try {
    // Only fetch theme settings if we're in a browser environment
    if (typeof window === 'undefined') {
      return generateAutoTheme('School');
    }
    
    // Fetch theme settings from public API
    const response = await fetch('/api/school-theme');
    if (!response.ok) {
      console.warn('Theme settings API not available, using auto theme');
      return generateAutoTheme('School');
    }
    
    const data = await response.json();
    const themeData = data.theme;
    
    // Check if theme is configured
    if (themeData && themeData.themeType && themeData.themeType !== 'auto') {
      if (themeData.themeType === 'preset' && themeData.presetId) {
        const preset = THEME_PRESETS.find(p => p.id === themeData.presetId);
        if (preset) {
          return {
            ...generateThemeFromPreset(preset),
            ...themeData.customizations
          };
        }
      } else if (themeData.themeType === 'custom' && themeData.colors) {
        return generateCustomTheme(themeData.colors);
      }
    }
    
    // Fallback to auto-generated theme
    const schoolResponse = await fetch(`/api/school/by-subdomain?subdomain=${schoolId}`);
    if (schoolResponse.ok) {
      const schoolData = await schoolResponse.json();
      const schoolName = schoolData.school?.name || 'School';
      return generateAutoTheme(schoolName);
    }
    
    return generateAutoTheme('School');
    
  } catch (error) {
    console.warn('Error fetching school theme, using fallback:', error);
    // Ultimate fallback
    return generateAutoTheme('School');
  }
}

/**
 * Save theme settings for a school
 */
export async function saveSchoolTheme(schoolId: string, theme: Partial<SchoolTheme>): Promise<boolean> {
  try {
    const response = await fetch('/api/school-structure/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group: 'theme',
        settings: theme
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error saving school theme:', error);
    return false;
  }
}
