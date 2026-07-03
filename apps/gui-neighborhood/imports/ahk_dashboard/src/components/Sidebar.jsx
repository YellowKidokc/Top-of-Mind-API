import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, TrendingUp, FolderOpen, ChevronLeft, Zap, Handshake, FileText, Brain, Sparkles } from 'lucide-react';
import { ENABLE_BACKEND_FEATURES } from '../config/features';

export default function Sidebar({ isOpen, setIsOpen }) {
  const coreNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/strategy', icon: Target, label: 'Strategy' },
    { path: '/marketing', icon: TrendingUp, label: 'Marketing Pulse' },
    { path: '/assets', icon: FolderOpen, label: 'Asset Vault' },
    { path: '/partnerships', icon: Handshake, label: 'Partnerships' },
    { path: '/reports', icon: FileText, label: 'Reports Archive' },
  ]
  const backendNavItems = [
    { path: '/emma-insights', icon: Brain, label: 'Emma Insights' },
    { path: '/emma-learning', icon: Sparkles, label: 'Emma Learning' },
  ]
  const navItems = ENABLE_BACKEND_FEATURES
    ? [...coreNavItems, ...backendNavItems]
    : coreNavItems

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-ahk-navy-900/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 💎 Premium Glass Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 h-screen
          bg-gradient-to-b from-ahk-navy-500/90 to-ahk-navy-600/90
          backdrop-blur-xl border-r border-ahk-gold-500/20
          shadow-2xl
          transition-all duration-500 ease-in-out
          ${isOpen ? 'w-64' : 'w-20'}
        `}
        style={{
          boxShadow: '0 0 40px rgba(212, 175, 55, 0.15), inset 0 0 60px rgba(212, 175, 55, 0.05)'
        }}
      >
        {/* ✨ Header with Animated 3D Logo Video */}
        <div className="flex items-center justify-between p-4 border-b border-ahk-gold-500/30">
          {isOpen ? (
            <div className="flex items-center space-x-3 animate-fade-in-down">
              {/* Animated 3D Logo Video with Pulse Effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-ahk-gold-500 rounded-xl blur-lg opacity-50 animate-glow-pulse"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 rounded-xl overflow-hidden shadow-gold-lg animate-logo-pulse">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover rounded-xl"
                  >
                    <source src="/assets/3D-animated-logo.mp4" type="video/mp4" />
                    {/* Fallback icon if video fails to load */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400">
                      <Zap className="w-7 h-7 text-ahk-navy-900" strokeWidth={2.5} />
                    </div>
                  </video>
                </div>
              </div>
              {/* Company Name with Gradient */}
              <div className="flex flex-col">
                <span className="text-xl font-display font-black text-gradient-gold">
                  AHK
                </span>
                <span className="text-[0.65rem] font-sans font-medium tracking-wider uppercase text-ahk-gold-100/80">
                  Strategies
                </span>
              </div>
            </div>
          ) : (
            <div className="relative mx-auto">
              <div className="absolute inset-0 bg-ahk-gold-500 rounded-xl blur-lg opacity-50 animate-glow-pulse"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 rounded-xl overflow-hidden shadow-gold-lg animate-logo-pulse">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover rounded-xl"
                >
                  <source src="/assets/3D-animated-logo.mp4" type="video/mp4" />
                  {/* Fallback icon if video fails to load */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400">
                    <Zap className="w-7 h-7 text-ahk-navy-900" strokeWidth={2.5} />
                  </div>
                </video>
              </div>
            </div>
          )}
        </div>

        {/* 🎯 Toggle button with Premium Style */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex absolute -right-4 top-24 bg-gradient-to-r from-ahk-gold-500 to-ahk-gold-400 rounded-full p-2 shadow-gold-md hover:shadow-gold-lg transition-all duration-300 hover:scale-110 z-40"
          style={{
            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)'
          }}
        >
          <ChevronLeft className={`w-5 h-5 text-ahk-navy-900 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
        </button>

        {/* 🚀 Premium Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                group relative flex items-center space-x-3 px-4 py-3.5 rounded-xl
                transition-all duration-300 overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-ahk-gold-500 to-ahk-gold-400 text-ahk-navy-900 shadow-gold-md' 
                  : 'text-ahk-slate-200 hover:bg-ahk-navy-500/50 hover:text-ahk-gold-100'
                }
                ${!isOpen && 'justify-center'}
              `}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/0 via-ahk-gold-500/10 to-ahk-gold-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with Animation */}
              <item.icon className="w-5 h-5 flex-shrink-0 relative z-10 group-hover:scale-110 transition-transform duration-300" />
              
              {/* Label with Smooth Appearance */}
              {isOpen && (
                <span className="font-sans font-medium text-sm relative z-10">
                  {item.label}
                </span>
              )}

              {/* Active Indicator */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-ahk-gold-400 rounded-l-full opacity-0 group-[.active]:opacity-100 transition-opacity"></div>
            </NavLink>
          ))}
        </nav>

        {/* 🌟 Premium Footer with Brand Tagline */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ahk-gold-500/20 bg-ahk-navy-600/50 backdrop-blur-sm">
            <div className="space-y-2">
              {/* Brand Badge */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 rounded-lg flex items-center justify-center shadow-gold-sm">
                  <Zap className="w-4 h-4 text-ahk-navy-900" />
                </div>
                <div>
                  <p className="text-xs font-display font-bold text-gradient-gold">AHKStrategies</p>
                  <p className="text-[0.65rem] text-ahk-slate-300/80 font-sans">Strategic Dashboard</p>
                </div>
              </div>
              
              {/* Tagline */}
              <p className="text-[0.65rem] text-ahk-gold-100/60 font-sans italic leading-relaxed border-t border-ahk-gold-500/10 pt-2">
                Where Human Intuition and AI Move as One
              </p>
              
              {/* Version */}
              <p className="text-[0.6rem] text-ahk-slate-400/60 font-mono">
                v1.0.0 • MEGA-EMMA
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
