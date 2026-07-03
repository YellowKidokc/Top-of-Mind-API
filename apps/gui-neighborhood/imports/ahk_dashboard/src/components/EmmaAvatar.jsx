
/**
 * Emma's Avatar Component - Visual personality system
 * Displays animated avatar that changes based on Emma's mood/state
 * Features: Expression changes, particle effects, smooth transitions
 */
export default function EmmaAvatar({ mood = 'idle', showParticles = false }) {
  const [particles, setParticles] = useState([]);

  // Generate celebration particles when task completes
  useEffect(() => {
    if (showParticles) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i * 360) / 12,
        delay: i * 0.1,
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [showParticles]);

  // Avatar configurations for each mood
  const avatarConfig = {
    idle: {
      emoji: '😊',
      color: 'from-indigo-500 to-purple-500',
      glow: 'shadow-lg shadow-indigo-500/50',
      ring: 'ring-2 ring-indigo-400/30',
      animation: 'animate-pulse-slow',
      label: 'Ready',
    },
    listening: {
      emoji: '👂',
      color: 'from-green-500 to-emerald-500',
      glow: 'shadow-xl shadow-green-500/60',
      ring: 'ring-4 ring-green-400/50 ring-offset-2 ring-offset-slate-900',
      animation: 'animate-listening',
      label: 'Listening',
    },
    thinking: {
      emoji: '🧠',
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-xl shadow-orange-500/60',
      ring: 'ring-4 ring-orange-400/50',
      animation: 'animate-spin-slow',
      label: 'Thinking',
    },
    speaking: {
      emoji: '💬',
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-xl shadow-purple-500/60',
      ring: 'ring-4 ring-purple-400/50',
      animation: 'animate-speaking',
      label: 'Speaking',
    },
    happy: {
      emoji: '🎉',
      color: 'from-pink-500 to-rose-500',
      glow: 'shadow-2xl shadow-pink-500/70',
      ring: 'ring-4 ring-pink-400/60',
      animation: 'animate-bounce',
      label: 'Success!',
    },
    working: {
      emoji: '⚡',
      color: 'from-cyan-500 to-blue-500',
      glow: 'shadow-xl shadow-cyan-500/60',
      ring: 'ring-4 ring-cyan-400/50',
      animation: 'animate-pulse',
      label: 'Working',
    },
    error: {
      emoji: '😅',
      color: 'from-red-500 to-orange-500',
      glow: 'shadow-lg shadow-red-500/50',
      ring: 'ring-2 ring-red-400/40',
      animation: '',
      label: 'Oops!',
    },
  };

  const config = avatarConfig[mood] || avatarConfig.idle;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 animate-particle"
          style={{
            transform: `rotate(${particle.angle}deg) translateY(-40px)`,
            animationDelay: `${particle.delay}s`,
            opacity: 0,
          }}
        />
      ))}

      {/* Outer glow ring */}
      <div className={`absolute inset-0 rounded-full ${config.glow} blur-md opacity-75`} />
      
      {/* Main avatar container */}
      <div
        className={`
          relative flex items-center justify-center
          w-14 h-14 rounded-full
          bg-gradient-to-br ${config.color}
          ${config.ring}
          ${config.animation}
          transition-all duration-500 ease-in-out
          cursor-pointer hover:scale-110
        `}
      >
        {/* Avatar emoji */}
        <span className="text-2xl filter drop-shadow-lg">
          {config.emoji}
        </span>

        {/* Listening wave effect */}
        {mood === 'listening' && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-green-400/40 animate-ping" />
            <div
              className="absolute inset-0 rounded-full border-2 border-green-400/20 animate-ping"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}

        {/* Speaking pulse effect */}
        {mood === 'speaking' && (
          <div className="absolute -inset-1 rounded-full border-2 border-purple-400/30 animate-pulse-fast" />
        )}
      </div>

      {/* Status label */}
      <div
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap
                   px-2 py-0.5 rounded-full text-xs font-medium
                   bg-slate-800/90 text-white backdrop-blur-sm
                   border border-slate-700/50 shadow-lg"
      >
        {config.label}
      </div>
    </div>
  );
}
