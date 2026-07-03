import { Bell, Check, X, TrendingDown, TrendingUp, AlertTriangle, Info, Sparkles } from 'lucide-react';
import emmaMemory from '../ai/emmaMemory';

/**
 * Emma's Notification Center
 * Badge counter showing pending insights, reports, and alerts
 * Click to see timeline of Emma's activities and suggestions
 */
export default function EmmaNotifications({ notifications = [], onDismiss, onAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'alert':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'insight':
        return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case 'suggestion':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/50';
      case 'warning':
        return 'from-orange-500/20 to-amber-500/20 border-orange-500/50';
      case 'alert':
        return 'from-red-500/20 to-rose-500/20 border-red-500/50';
      case 'insight':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/50';
      case 'suggestion':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/50';
      default:
        return 'from-slate-500/20 to-slate-600/20 border-slate-500/50';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleActionClick = (notification) => {
    if (notification.action) {
      onAction?.(notification.action);
      emmaMemory.recordSuggestion(true); // Track that suggestion was taken
    }
    onDismiss?.(notification.id);
    setIsOpen(false);
  };

  const handleDismiss = (notification) => {
    onDismiss?.(notification.id);
    if (notification.type === 'suggestion') {
      emmaMemory.recordSuggestion(false); // Track that suggestion was dismissed
    }
  };

  return (
    <>
      {/* Notification Badge on Avatar */}
      {unreadCount > 0 && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            absolute -top-1 -right-1 z-50
            flex items-center justify-center
            w-6 h-6 rounded-full
            bg-gradient-to-br from-red-500 to-pink-500
            text-white text-xs font-bold
            shadow-lg shadow-red-500/50
            animate-pulse
            hover:scale-110 transition-transform
          "
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </button>
      )}

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-20 z-50 w-96 max-h-[500px] overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-slate-700/50 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Emma's Updates</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1">No new notifications</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      relative p-4 rounded-xl border
                      bg-gradient-to-br ${getNotificationColor(notification.type)}
                      transition-all duration-300
                      ${notification.read ? 'opacity-60' : 'opacity-100'}
                    `}
                  >
                    {/* New indicator dot */}
                    {!notification.read && (
                      <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}

                    {/* Icon and Content */}
                    <div className="flex gap-3 ml-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium mb-1">
                          {notification.message}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 ml-11">
                      {notification.action && (
                        <button
                          onClick={() => handleActionClick(notification)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors"
                        >
                          Take Action
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notification)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 text-xs transition-colors"
                      >
                        Dismiss
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Hook to manage Emma's notifications
 */
export function useEmmaNotifications() {
  const [notifications, setNotifications] = useState([]);

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('emma-notifications');
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (error) {
        console.warn('Failed to load notifications', error);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('emma-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification) => {
    const newNotification = {
      id: `notif-${Date.now()}`,
      timestamp: Date.now(),
      read: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    dismissNotification,
    clearAll,
  };
}
