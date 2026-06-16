// Skeleton loader for course cards
export function SkeletonCard() {
  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/8 animate-pulse">
      <div className="w-full h-36 bg-white/8 rounded-xl mb-4"></div>
      <div className="h-4 bg-white/8 rounded-full w-3/4 mb-3"></div>
      <div className="h-3 bg-white/8 rounded-full w-1/2 mb-4"></div>
      <div className="h-2 bg-white/8 rounded-full w-full mb-2"></div>
      <div className="h-2 bg-white/8 rounded-full w-5/6"></div>
    </div>
  );
}

// Stat card
export function StatCard({ icon: Icon, label, value, color = 'indigo', sub }) {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/20 text-amber-400',
    violet: 'from-violet-500/20 to-purple-500/10 border-violet-500/20 text-violet-400',
  };
  const iconBg = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    violet: 'bg-violet-500/20 text-violet-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-2xl p-5 border`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${iconBg[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// Progress Bar
export function ProgressBar({ value, color = 'indigo', showLabel = true }) {
  const colorMap = {
    indigo: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
  };
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showLabel && (
          <>
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs font-semibold text-white">{Math.round(value)}%</span>
          </>
        )}
      </div>
      <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorMap[color]} transition-all duration-700 ease-out relative shimmer`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// Spinner
export function Spinner({ size = 'md' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizeMap[size]} border-2 border-indigo-500/30 border-t-indigo-500 rounded-full spinner`} />
  );
}

// Badge
export function Badge({ children, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${colorMap[color]}`}>
      {children}
    </span>
  );
}
