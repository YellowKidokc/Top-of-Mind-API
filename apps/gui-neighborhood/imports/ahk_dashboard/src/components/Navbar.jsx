import { Menu, Bell, User, Search, Zap } from 'lucide-react'

export default function Navbar({ toggleSidebar }) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <nav className="relative bg-gradient-to-r from-ahk-navy-500/90 to-ahk-navy-600/90 backdrop-blur-xl border-b border-ahk-gold-500/20 px-6 py-4 shadow-lg z-20">
      {/* Subtle Gold Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ahk-gold-500 to-transparent opacity-50"></div>
      
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-ahk-navy-500/50 transition-all duration-300 group"
          >
            <Menu className="w-6 h-6 text-ahk-gold-400 group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="hidden md:block">
            <p className="text-sm text-ahk-slate-200/70 font-sans tracking-wide">{currentDate}</p>
            <h1 className="text-xl font-display font-bold text-gradient-electric mt-1">
              Strategic Command Center
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Premium Search bar */}
          <div className="hidden md:flex items-center bg-ahk-navy-600/50 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-ahk-gold-500/20 hover:border-ahk-gold-500/40 transition-all duration-300 group">
            <Search className="w-5 h-5 text-ahk-gold-400 mr-2 group-hover:scale-110 transition-transform" />
            <input
              type="text"
              placeholder="Search dashboard..."
              className="bg-transparent outline-none text-sm w-64 text-ahk-slate-100 placeholder-ahk-slate-400"
            />
          </div>

          {/* Notifications with Badge */}
          <button className="relative p-2.5 rounded-xl hover:bg-ahk-navy-500/50 transition-all duration-300 group">
            <Bell className="w-5 h-5 text-ahk-slate-200 group-hover:text-ahk-gold-400 group-hover:scale-110 transition-all" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ahk-green-500 rounded-full animate-badge-glow"></span>
          </button>

          {/* User profile with Premium Badge */}
          <div className="flex items-center space-x-3 pl-4 border-l border-ahk-gold-500/20">
            <div className="hidden md:block text-right">
              <p className="text-sm font-display font-semibold text-ahk-gold-100">Ashraf Kahoush</p>
              <p className="text-xs text-ahk-slate-300/80 font-sans flex items-center justify-end gap-1">
                <Zap className="w-3 h-3 text-ahk-gold-400" />
                Strategic Lead
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-ahk-gold-500 rounded-full blur-md opacity-40"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 rounded-full flex items-center justify-center shadow-gold-md ring-2 ring-ahk-navy-500">
                <User className="w-5 h-5 text-ahk-navy-900" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
