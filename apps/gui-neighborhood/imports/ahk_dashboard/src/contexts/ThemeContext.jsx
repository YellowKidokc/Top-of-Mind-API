
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Load theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('ahk-theme');
    return savedTheme || 'light';
  });

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }

    // Save to localStorage
    localStorage.setItem('ahk-theme', theme);

    // Apply CSS variables
    applyThemeVariables(theme);
  }, [theme]);

  const applyThemeVariables = (currentTheme) => {
    const root = document.documentElement;
    
    if (currentTheme === 'dark') {
      // 🌌 DARK MODE - Cosmic Deep Space Theme
      root.style.setProperty('--bg-primary', '#0A0E27'); // Deep space blue
      root.style.setProperty('--bg-secondary', '#141B3E'); // Darker space
      root.style.setProperty('--bg-tertiary', '#1E2749'); // Card background
      root.style.setProperty('--bg-hover', '#252D52'); // Hover state
      
      root.style.setProperty('--text-primary', '#E8F0FF'); // Bright white-blue
      root.style.setProperty('--text-secondary', '#A5B4FC'); // Soft lavender
      root.style.setProperty('--text-muted', '#6B7AA1'); // Muted blue-gray
      
      root.style.setProperty('--accent-gold', '#FFD700'); // Bright gold
      root.style.setProperty('--accent-purple', '#9D4EDD'); // Neon purple
      root.style.setProperty('--accent-cyan', '#00F5FF'); // Cyber cyan
      root.style.setProperty('--accent-pink', '#FF006E'); // Hot pink
      root.style.setProperty('--accent-green', '#39FF14'); // Neon green
      
      root.style.setProperty('--border-color', '#2E3A59'); // Subtle border
      root.style.setProperty('--border-glow', 'rgba(157, 78, 221, 0.3)'); // Purple glow
      
      root.style.setProperty('--shadow-sm', '0 2px 8px rgba(0, 0, 0, 0.6)');
      root.style.setProperty('--shadow-md', '0 4px 16px rgba(0, 0, 0, 0.7)');
      root.style.setProperty('--shadow-lg', '0 8px 32px rgba(0, 0, 0, 0.8)');
      root.style.setProperty('--shadow-glow', '0 0 20px rgba(157, 78, 221, 0.4)');
      
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
      root.style.setProperty('--gradient-gold', 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)');
      root.style.setProperty('--gradient-cyber', 'linear-gradient(135deg, #00F5FF 0%, #9D4EDD 100%)');
      root.style.setProperty('--gradient-aurora', 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)');
      
      root.style.setProperty('--glass-bg', 'rgba(30, 39, 73, 0.7)');
      root.style.setProperty('--glass-border', 'rgba(165, 180, 252, 0.15)');
      
    } else {
      // ☀️ LIGHT MODE - Clean Professional Theme
      root.style.setProperty('--bg-primary', '#F8FAFC'); // Soft white
      root.style.setProperty('--bg-secondary', '#FFFFFF'); // Pure white
      root.style.setProperty('--bg-tertiary', '#F1F5F9'); // Light gray
      root.style.setProperty('--bg-hover', '#E2E8F0'); // Hover state
      
      root.style.setProperty('--text-primary', '#0F172A'); // Near black
      root.style.setProperty('--text-secondary', '#475569'); // Medium gray
      root.style.setProperty('--text-muted', '#94A3B8'); // Light gray
      
      root.style.setProperty('--accent-gold', '#D4AF37'); // Professional gold
      root.style.setProperty('--accent-purple', '#6366f1'); // Soft indigo
      root.style.setProperty('--accent-cyan', '#06B6D4'); // Teal
      root.style.setProperty('--accent-pink', '#EC4899'); // Rose pink
      root.style.setProperty('--accent-green', '#10B981'); // Emerald green
      
      root.style.setProperty('--border-color', '#E2E8F0'); // Light border
      root.style.setProperty('--border-glow', 'rgba(99, 102, 241, 0.15)'); // Subtle glow
      
      root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-glow', '0 0 15px rgba(99, 102, 241, 0.2)');
      
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
      root.style.setProperty('--gradient-gold', 'linear-gradient(135deg, #D4AF37 0%, #B8941C 100%)');
      root.style.setProperty('--gradient-cyber', 'linear-gradient(135deg, #06B6D4 0%, #6366f1 100%)');
      root.style.setProperty('--gradient-aurora', 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)');
      
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--glass-border', 'rgba(226, 232, 240, 0.8)');
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setLightMode = () => setTheme('light');
  const setDarkMode = () => setTheme('dark');

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setLightMode, 
      setDarkMode,
      isDark: theme === 'dark',
      isLight: theme === 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
