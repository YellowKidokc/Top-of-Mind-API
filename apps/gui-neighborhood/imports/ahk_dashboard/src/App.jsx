import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Strategy from './pages/Strategy'
import MarketingPulse from './pages/MarketingPulse'
import AssetVault from './pages/AssetVault'
import Partnerships from './pages/Partnerships'
import ReportsArchive from './components/ReportsArchive'
import EmmaInsights from './components/EmmaInsights'
import EmmaLearning from './components/EmmaLearning'
import AICoPilot from './components/AICoPilot'
import EmmaChat from './components/EmmaChat'
import EmmaButton from './components/EmmaButton'
import { ThemeProvider } from './contexts/ThemeContext'
import sessionContext from './engine/sessionContext'
import CommandCenter from './pages/CommandCenter';
import { ENABLE_BACKEND_FEATURES, ENABLE_EMMA_CHAT } from './config/features'

function AppContent() {
  // Emma chat state
  const [isEmmaChatOpen, setIsEmmaChatOpen] = useState(false)
  const [isEmmaChatMinimized, setIsEmmaChatMinimized] = useState(false)

  // Initialize session context on app load
  useEffect(() => {
    console.log('🧠 Emma Context Engine v2.0 initializing...');
    sessionContext.load();
    
    // Save context before tab closes or refreshes
    const handleBeforeUnload = () => {
      console.log('💾 Saving session context before unload...');
      sessionContext.save();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionContext.save(); // Save on unmount too
    };
  }, []);

  // Keyboard shortcut for Emma (Ctrl+E or Cmd+E)
  useEffect(() => {
    if (!ENABLE_EMMA_CHAT) {
      return undefined
    }

    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setIsEmmaChatOpen(prev => !prev);
        if (isEmmaChatMinimized) {
          setIsEmmaChatMinimized(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isEmmaChatMinimized]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/marketing" element={<MarketingPulse />} />
        <Route path="/assets" element={<AssetVault />} />
        <Route path="/partnerships" element={<Partnerships />} />
        <Route path="/reports" element={<ReportsArchive />} />
        {ENABLE_BACKEND_FEATURES && (
          <>
            <Route path="/emma-insights" element={<EmmaInsights />} />
            <Route path="/emma-learning" element={<EmmaLearning />} />
            <Route path="/command-center" element={<CommandCenter />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Global AI Co-Pilot - Static-safe prompt generator */}
      <AICoPilot />
      
      {ENABLE_EMMA_CHAT && (
        <>
          <EmmaChat 
            isOpen={isEmmaChatOpen}
            onClose={() => setIsEmmaChatOpen(false)}
            onMinimize={() => setIsEmmaChatMinimized(!isEmmaChatMinimized)}
            isMinimized={isEmmaChatMinimized}
          />
          
          <EmmaButton 
            onClick={() => {
              setIsEmmaChatOpen(true);
              setIsEmmaChatMinimized(false);
            }}
            isOpen={isEmmaChatOpen}
          />
        </>
      )}
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  )
}

export default App
