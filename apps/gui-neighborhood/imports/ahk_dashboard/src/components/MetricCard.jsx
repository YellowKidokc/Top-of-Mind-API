import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ title, value, change, icon: Icon, trend, color = 'navy' }) {
  const isPositive = trend === 'up'
  
  return (
    <div className="metric-card group cursor-pointer">
      {/* Animated Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-ahk-gold-500/10 via-transparent to-ahk-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
      
      {/* Content Container */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icon with Glow Effect */}
          <div className="relative">
            {/* Glow Background */}
            <div className="absolute inset-0 bg-ahk-gold-400/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Icon Container */}
            <div className="relative bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 rounded-xl p-3 border border-ahk-gold-500/30 group-hover:border-ahk-gold-500/60 transition-all duration-300 group-hover:scale-110">
              <Icon className="w-6 h-6 text-ahk-gold-400 group-hover:text-ahk-gold-300 transition-colors" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* Trend Indicator */}
          {change && (
            <div className={`flex items-center space-x-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
              isPositive 
                ? 'bg-ahk-green-500/20 text-ahk-green-400 border border-ahk-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        
        {/* Title and Value */}
        <div className="space-y-1">
          <p className="text-ahk-slate-200 text-sm font-sans font-medium tracking-wide uppercase opacity-90">
            {title}
          </p>
          <p className="text-4xl font-display font-black text-white group-hover:text-gradient-gold transition-all duration-300">
            {value}
          </p>
        </div>
      </div>

      {/* Bottom Accent Line with Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  )
}
