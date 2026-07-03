import { MessageSquare, Zap } from 'lucide-react';

/**
 * Premium Floating Emma Button with AHK Gold Styling
 */
const EmmaButton = ({ onClick, isOpen }) => {
  if (isOpen) return null; // Hide button when chat is open

  return (
    <div className="fixed right-8 bottom-8 z-50">
      {/* Glow Effect Background */}
      <div className="absolute inset-0 bg-ahk-gold-500 rounded-full blur-2xl opacity-40 animate-glow-pulse scale-150"></div>
      
      {/* Main Button */}
      <button
        onClick={onClick}
        className="relative w-20 h-20 bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-400 hover:from-ahk-gold-400 hover:to-ahk-gold-300 rounded-full shadow-gold-xl hover:shadow-gold-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 group overflow-hidden border-2 border-ahk-gold-300/50"
        title="Open Emma AI Assistant (Ctrl+E)"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Icon Container */}
        <div className="relative flex items-center justify-center">
          <MessageSquare className="text-ahk-navy-900 w-9 h-9 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
        </div>
        
        {/* Pulse Animation Ring */}
        <span className="absolute inset-0 rounded-full bg-ahk-gold-400 animate-ping opacity-30"></span>
        
        {/* Status Badge with Lightning */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-ahk-green-500 to-ahk-green-400 rounded-full border-3 border-ahk-navy-900 flex items-center justify-center shadow-lg animate-badge-glow">
          <Zap className="text-white w-4 h-4" strokeWidth={3} fill="white" />
        </div>
      </button>
      
      {/* Helper Tooltip */}
      <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gradient-to-br from-ahk-navy-600 to-ahk-navy-700 backdrop-blur-xl border border-ahk-gold-500/30 rounded-xl px-4 py-2 shadow-2xl whitespace-nowrap">
          <p className="text-ahk-gold-300 font-display font-bold text-sm">Ask Emma AI</p>
          <p className="text-ahk-slate-300 text-xs font-sans">Press Ctrl+E</p>
        </div>
      </div>
    </div>
  );
};

export default EmmaButton;
