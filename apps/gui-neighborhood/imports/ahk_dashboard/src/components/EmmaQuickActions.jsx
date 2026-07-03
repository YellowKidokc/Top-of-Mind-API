import { FileText, Mail, AlertTriangle, Archive, Sparkles, X } from 'lucide-react';

/**
 * Emma's Quick Actions Bar
 * Floating action bubbles for one-tap shortcuts - no voice needed!
 */
export default function EmmaQuickActions({ onAction, isVisible }) {
  const [expanded, setExpanded] = useState(false);

  const actions = [
    {
      id: 'quick-report',
      icon: FileText,
      label: 'Quick Report',
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/50',
      command: 'display-report',
    },
    {
      id: 'email-summary',
      icon: Mail,
      label: 'Email Report',
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
      command: 'email-report',
    },
    {
      id: 'risk-check',
      icon: AlertTriangle,
      label: 'Risk Alert',
      color: 'from-orange-500 to-red-500',
      glow: 'shadow-orange-500/50',
      command: 'risk-analysis',
    },
    {
      id: 'show-archive',
      icon: Archive,
      label: 'View Archive',
      color: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/50',
      command: 'show-reports',
    },
  ];

  const handleActionClick = (action) => {
    onAction?.(action.command);
    setExpanded(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full
          bg-gradient-to-br from-indigo-500 to-purple-500
          shadow-lg shadow-indigo-500/50
          hover:scale-110 transition-all duration-300
          ${expanded ? 'rotate-45' : 'rotate-0'}
        `}
        title={expanded ? 'Close Quick Actions' : 'Quick Actions'}
      >
        {expanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Action Bubbles */}
      {expanded && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 animate-fadeIn">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-full
                  bg-gradient-to-br ${action.color}
                  shadow-xl ${action.glow}
                  hover:scale-105 transition-all duration-300
                  border border-white/20
                  backdrop-blur-sm
                `}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
                title={action.label}
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Label - slides in on hover */}
                <span
                  className="
                    text-white font-medium text-sm whitespace-nowrap
                    max-w-0 group-hover:max-w-xs
                    overflow-hidden transition-all duration-300
                  "
                >
                  {action.label}
                </span>

                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </button>
            );
          })}
        </div>
      )}

      {/* Helper Text */}
      {!expanded && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-slate-800/90 text-white text-xs rounded-lg whitespace-nowrap backdrop-blur-sm border border-slate-700/50 opacity-0 hover:opacity-100 transition-opacity">
          Quick Actions ⚡
        </div>
      )}
    </div>
  );
}
