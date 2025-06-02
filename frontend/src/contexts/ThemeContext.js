import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themes = {
  dark: {
    name: 'Dark',
    colors: {
      primary: '#0d1117',
      secondary: '#161b22',
      tertiary: '#21262d',
      quaternary: '#30363d',
      textPrimary: '#e6edf3',
      textSecondary: '#7d8590',
      textAccent: '#58a6ff',
      border: '#30363d',
      borderHover: '#484f58',
      success: '#2ea043',
      successHover: '#3fb950',
      error: '#da3633',
      errorHover: '#f85149',
      warning: '#f0883e',
      editorBg: '#0d1117',
      terminalBg: '#0d1117',
      monacoTheme: 'vs-dark'
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#ffffff',
      secondary: '#f6f8fa',
      tertiary: '#f1f3f4',
      quaternary: '#d0d7de',
      textPrimary: '#24292f',
      textSecondary: '#656d76',
      textAccent: '#0969da',
      border: '#d0d7de',
      borderHover: '#8c959f',
      success: '#1a7f37',
      successHover: '#2da44e',
      error: '#cf222e',
      errorHover: '#a40e26',
      warning: '#bf8700',
      editorBg: '#ffffff',
      terminalBg: '#f6f8fa',
      monacoTheme: 'vs-light'
    }
  },
  github: {
    name: 'GitHub Dark',
    colors: {
      primary: '#0d1117',
      secondary: '#161b22',
      tertiary: '#21262d',
      quaternary: '#30363d',
      textPrimary: '#f0f6fc',
      textSecondary: '#8b949e',
      textAccent: '#58a6ff',
      border: '#30363d',
      borderHover: '#484f58',
      success: '#238636',
      successHover: '#2ea043',
      error: '#da3633',
      errorHover: '#f85149',
      warning: '#d29922',
      editorBg: '#0d1117',
      terminalBg: '#0d1117',
      monacoTheme: 'vs-dark'
    }
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      primary: '#0f1419',
      secondary: '#1e2328',
      tertiary: '#2d3338',
      quaternary: '#3c4147',
      textPrimary: '#d4d4d6',
      textSecondary: '#9ca0a5',
      textAccent: '#39bae6',
      border: '#3c4147',
      borderHover: '#4b5056',
      success: '#7fd962',
      successHover: '#99e582',
      error: '#f07178',
      errorHover: '#f28b8b',
      warning: '#ffb454',
      editorBg: '#0f1419',
      terminalBg: '#0f1419',
      monacoTheme: 'vs-dark'
    }
  },
  synthwave: {
    name: 'Synthwave',
    colors: {
      primary: '#2a0845',
      secondary: '#341a5b',
      tertiary: '#3e2c71',
      quaternary: '#483e87',
      textPrimary: '#f8f8f2',
      textSecondary: '#b19cd9',
      textAccent: '#ff7edb',
      border: '#483e87',
      borderHover: '#5a4a9d',
      success: '#7df9aa',
      successHover: '#9dfac0',
      error: '#ff6c6b',
      errorHover: '#ff8584',
      warning: '#ffd93d',
      editorBg: '#2a0845',
      terminalBg: '#2a0845',
      monacoTheme: 'vs-dark'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('codepad-theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('codepad-theme', themeName);
      
      // Update CSS custom properties
      const root = document.documentElement;
      const theme = themes[themeName];
      
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }
  };

  const value = {
    theme: themes[currentTheme],
    currentTheme,
    changeTheme,
    availableThemes: Object.keys(themes).map(key => ({
      key,
      name: themes[key].name
    }))
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};