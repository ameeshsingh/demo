import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, COLORS } from '../utils/config';

// Theme types
const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Light theme
const lightTheme = {
  type: THEME_TYPES.LIGHT,
  colors: {
    primary: COLORS.PRIMARY,
    primaryDark: COLORS.PRIMARY_DARK,
    primaryLight: COLORS.PRIMARY_LIGHT,
    accent: COLORS.ACCENT,
    accentDark: COLORS.ACCENT_DARK,
    accentLight: COLORS.ACCENT_LIGHT,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    error: COLORS.ERROR,
    info: COLORS.INFO,
    background: COLORS.BACKGROUND,
    surface: COLORS.SURFACE,
    textPrimary: COLORS.TEXT_PRIMARY,
    textSecondary: COLORS.TEXT_SECONDARY,
    textDisabled: COLORS.TEXT_DISABLED,
    border: COLORS.BORDER,
    shadow: COLORS.SHADOW,
    overlay: COLORS.OVERLAY,
    gradientStart: COLORS.GRADIENT_START,
    gradientEnd: COLORS.GRADIENT_END,
  },
};

// Dark theme
const darkTheme = {
  type: THEME_TYPES.DARK,
  colors: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#1E3A8A',
    accent: '#10B981',
    accentDark: '#059669',
    accentLight: '#064E3B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: '#111827',
    surface: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textDisabled: '#6B7280',
    border: '#374151',
    shadow: '#000000',
    overlay: '#000000CC',
    gradientStart: '#3B82F6',
    gradientEnd: '#2563EB',
  },
};

// Create context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [themeType, setThemeType] = useState(THEME_TYPES.LIGHT);
  const [theme, setTheme] = useState(lightTheme);

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
        if (storedTheme) {
          setThemeType(storedTheme);
          setTheme(storedTheme === THEME_TYPES.DARK ? darkTheme : lightTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Update theme when theme type changes
  useEffect(() => {
    const newTheme = themeType === THEME_TYPES.DARK ? darkTheme : lightTheme;
    setTheme(newTheme);
  }, [themeType]);

  // Save theme preference to storage
  const saveThemePreference = async (newThemeType) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, newThemeType);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Change theme
  const changeTheme = (newThemeType) => {
    setThemeType(newThemeType);
    saveThemePreference(newThemeType);
  };

  // Toggle theme
  const toggleTheme = () => {
    const newThemeType = themeType === THEME_TYPES.LIGHT ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;
    changeTheme(newThemeType);
  };

  // Context value
  const value = {
    theme,
    themeType,
    changeTheme,
    toggleTheme,
    isDark: themeType === THEME_TYPES.DARK,
    isLight: themeType === THEME_TYPES.LIGHT,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export theme types for use in other files
export { THEME_TYPES };