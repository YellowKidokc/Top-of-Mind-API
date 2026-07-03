import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, setDarkMode, setLightMode, isDark } = useTheme();

  // Listen for voice commands
  useEffect(() => {
    const handleToggleTheme = () => toggleTheme();
    const handleSetDark = () => setDarkMode();
    const handleSetLight = () => setLightMode();

    window.addEventListener('toggleTheme', handleToggleTheme);
    window.addEventListener('setDarkMode', handleSetDark);
    window.addEventListener('setLightMode', handleSetLight);

    return () => {
      window.removeEventListener('toggleTheme', handleToggleTheme);
      window.removeEventListener('setDarkMode', handleSetDark);
      window.removeEventListener('setLightMode', handleSetLight);
    };
  }, [toggleTheme, setDarkMode, setLightMode]);

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: 20,
        left: 120,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: isDark 
          ? '2px solid rgba(157, 78, 221, 0.5)' 
          : '2px solid rgba(99, 102, 241, 0.3)',
        background: isDark
          ? 'linear-gradient(135deg, #1E2749 0%, #0A0E27 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
        boxShadow: isDark
          ? '0 8px 32px rgba(157, 78, 221, 0.4), inset 0 0 20px rgba(157, 78, 221, 0.1)'
          : '0 4px 12px rgba(99, 102, 241, 0.2)',
        cursor: 'pointer',
        fontSize: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overflow: 'hidden',
        animation: isDark ? 'pulseGlow 3s ease-in-out infinite' : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 12px 40px rgba(157, 78, 221, 0.6), inset 0 0 30px rgba(157, 78, 221, 0.2)'
          : '0 8px 20px rgba(99, 102, 241, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 8px 32px rgba(157, 78, 221, 0.4), inset 0 0 20px rgba(157, 78, 221, 0.1)'
          : '0 4px 12px rgba(99, 102, 241, 0.2)';
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Rotating Icon Container */}
      <div style={{
        transition: 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isDark ? (
          // Moon Icon with stars
          <div style={{ position: 'relative' }}>
            <span style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))'
            }}>🌙</span>
            {/* Orbiting stars */}
            <span style={{
              position: 'absolute',
              top: -5,
              right: -5,
              fontSize: 12,
              animation: 'twinkle 2s ease-in-out infinite'
            }}>✨</span>
          </div>
        ) : (
          // Sun Icon with rays
          <span style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
            animation: 'rotate 20s linear infinite'
          }}>☀️</span>
        )}
      </div>

      {/* Background animation effect */}
      {isDark && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(157, 78, 221, 0.2) 0%, transparent 70%)',
          animation: 'pulse 2s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
      )}

      {/* Add keyframe animations */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(157, 78, 221, 0.4), inset 0 0 20px rgba(157, 78, 221, 0.1);
          }
          50% {
            box-shadow: 0 8px 40px rgba(157, 78, 221, 0.6), inset 0 0 30px rgba(157, 78, 221, 0.2);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(0.8);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
