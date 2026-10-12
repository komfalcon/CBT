import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, AppNavbar } from '../components';
import { getMe } from '../features/auth/api';

interface LeaderboardUser {
  id?: string;
  fullName: string;
  level?: number;
  xp_points?: number;
  streak_count?: number;
  state?: string;
  combo?: string;
  avg_score?: number;
  aurikrex_id?: string;
}

export default function Leaderboard() {
  const [user, setUser] = useState<any>(null);
  const [xpLeaders, setXpLeaders] = useState<LeaderboardUser[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'mocks' | 'streaks' | 'regional'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getMe().then((data) => setUser(data)).catch(() => {});
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const [xpRes, streakRes] = await Promise.all([
        fetch(`${apiBase}/leaderboard/xp`, { credentials: 'include' }),
        fetch(`${apiBase}/leaderboard/streak`, { credentials: 'include' }),
      ]);
      if (xpRes.ok) {
        const data = await xpRes.json();
        setXpLeaders(Array.isArray(data) ? data : []);
      }
      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreakLeaders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load leaderboards', err);
    } finally {
      setLoading(false);
    }
  };

  // Real scholars list from database
  const scholars = useMemo(() => {
    const sourceList = activeTab === 'streaks' ? streakLeaders : xpLeaders;
    const list: LeaderboardUser[] = sourceList.map((u, i) => ({
      id: u.id || `db-${i}`,
      fullName: u.fullName || 'Candidate Scholar',
      level: u.level || Math.max(1, Math.floor((u.xp_points || 0) / 1000)),
      xp_points: u.xp_points ?? 0,
      streak_count: u.streak_count ?? 0,
      state: u.state || 'CBT National Center',
      combo: u.combo || 'Eng · Math · Phy · Chem',
      avg_score: u.avg_score || 0,
      aurikrex_id: u.aurikrex_id || `AKX-${String(u.id || '').slice(0, 6).toUpperCase()}`,
    }));

    if (activeTab === 'streaks') {
      list.sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0));
    } else {
      list.sort((a, b) => (b.xp_points || 0) - (a.xp_points || 0));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.aurikrex_id && s.aurikrex_id.toLowerCase().includes(q)) ||
        (s.state && s.state.toLowerCase().includes(q))
    );
  }, [xpLeaders, streakLeaders, activeTab, searchQuery]);

  const top1 = scholars[0];
  const top2 = scholars[1];
  const top3 = scholars[2];

  const userRankIndex = user
    ? scholars.findIndex(
        (s) =>
          (s.id && user.id && String(s.id) === String(user.id)) ||
          (s.aurikrex_id && user.aurikrex_id && s.aurikrex_id.toUpperCase() === user.aurikrex_id.toUpperCase())
      )
    : -1;
  const isRanked = userRankIndex >= 0;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-body selection:bg-accent-royal-blue selection:text-white antialiased">
      {/* Ecosystem Top Bar */}
      <AppNavbar student={user} titleBadge="Rankings" />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* HERO & METRIC TELEMETRY BANNER */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card via-surface-container to-bg-primary border border-border p-6 lg:p-8 shadow-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-royal-blue/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-border text-label-sm font-label-sm text-primary">
                <span className="material-symbols-outlined text-sm text-tertiary" data-weight="fill">
                  verified
                </span>
                Official Psychometric Standings · UTME 2025/2026
              </div>
              <h1 className="text-headline-lg font-headline-lg text-text-primary tracking-tight">
                National UTME 2025/2026 Scholar Standings
              </h1>
              <p className="text-body-md font-body-md text-text-secondary">
                Verified psychometric scoring across 100,000+ candidates nationwide. Synchronized hourly with official CBT test banks and JAMB syllabus weighting.
              </p>
            </div>

            {/* Live Season Cycle Card */}
            <div className="bg-surface-container-low border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-accent-royal-blue/20 border border-accent-royal-blue/30 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  Live Cycle Standings
                </div>
                <div className="text-label-md font-label-md text-text-primary font-semibold">
                  Season 4: Final Sprint
                </div>
                <div className="font-mono-timer text-mono-timer text-accent-ai-gold flex items-center gap-1.5">
                  <span>18d : 14h : 22m</span>
                  <span className="text-xs text-text-muted font-sans font-normal">left</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active User Quick Standings Bar */}
          <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-accent-royal-blue/40 text-text-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-ai-gold" />
                <span className="text-body-sm font-body-sm text-text-secondary">Your Standing:</span>
                <span className="font-mono-data text-mono-data text-text-primary font-bold">
                  {isRanked ? `#${userRankIndex + 1} Nationwide` : 'Unranked'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-border">
                <span className="material-symbols-outlined text-accent-ai-gold text-base" data-weight="fill">
                  military_tech
                </span>
                <span className="text-body-sm font-body-sm font-semibold text-text-primary">
                  Level {user?.level ?? 1} Scholar
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-border">
                <span className="material-symbols-outlined text-secondary text-base">bolt</span>
                <span className="font-mono-data text-mono-data text-text-primary font-semibold">
                  {(user?.xp_points ?? 0).toLocaleString()} XP
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-tertiary/40">
                <span className="material-symbols-outlined text-accent-streak-rose text-base" data-weight="fill">
                  local_fire_department
                </span>
                <span className="text-body-sm font-body-sm text-text-secondary">Daily Streak:</span>
                <span className="font-mono-data text-mono-data text-accent-streak-rose font-bold">
                  {user?.streak_count ?? 0} Days
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span>
                {isRanked ? 'Active in National Standings' : 'Complete a mock exam to enter standings'}
              </span>
            </div>
          </div>
        </section>

        {/* PODIUM CARDS: TOP NATIONAL SCHOLARS */}
        {scholars.length === 0 ? (
          <div className="bg-bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent-royal-blue/10 border border-accent-royal-blue/30 mx-auto flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[32px]">emoji_events</span>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-headline-md font-bold text-text-primary">2025/2026 National Leaderboard Live</h3>
              <p className="text-body-sm text-text-secondary">
                Official national rankings are open. Complete full-length CBT mock exams or daily drills to claim a spot on the national podium.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/arena')}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-body-sm hover:bg-primary-hover transition-colors shadow-md"
              >
                Launch Mock Exam
              </button>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* RANK 2: SILVER PODIUM */}
            {top2 && (
              <div className="relative rounded-2xl bg-bg-card border border-slate-400/30 p-6 flex flex-col justify-between shadow-lg order-2 md:order-1 hover:border-slate-300/50 transition-all">
                <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-slate-200 dark:bg-slate-300 text-slate-900 font-mono-data text-xs font-bold shadow-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">workspace_premium</span>
                  #2 NATIONWIDE
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-slate-200 to-slate-500 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-headline-md font-bold text-slate-700 dark:text-slate-200">
                          {top2.fullName.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-200 text-slate-950 font-mono-data text-xs font-bold flex items-center justify-center border-2 border-bg-card">
                        2
                      </div>
                    </div>
                    <div>
                      <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                        {top2.fullName}
                      </h2>
                      <div className="flex items-center gap-1 text-body-sm text-text-secondary">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        {top2.state}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="inline-block px-2.5 py-1 rounded bg-surface-container border border-border text-[12px] font-semibold text-secondary">
                      Engineering Combo
                    </div>
                    <div className="text-[12px] text-text-muted font-mono-data">{top2.combo}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-container-low border border-border mb-4">
                    <div>
                      <span className="text-[11px] text-text-muted block">Avg Mock Score</span>
                      <span className="font-mono-data text-headline-sm font-bold text-text-primary">
                        {top2.avg_score || '—'}
                        {top2.avg_score ? <span className="text-xs text-text-muted font-normal">/400</span> : null}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted block">Study Streak</span>
                      <span className="font-mono-data text-headline-sm font-bold text-accent-streak-rose flex items-center gap-1">
                        <span className="material-symbols-outlined text-base" data-weight="fill">
                          local_fire_department
                        </span>
                        {top2.streak_count || 0} Days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-body-sm">
                  <span className="text-text-secondary">Total XP</span>
                  <span className="font-mono-data text-mono-data font-bold text-text-primary">
                    {top2.xp_points?.toLocaleString() || 0} XP
                  </span>
                </div>
              </div>
            )}

            {/* RANK 1: GOLD PODIUM (Elevated) */}
            {top1 && (
              <div className="relative rounded-2xl bg-gradient-to-b from-surface-container to-bg-card border-2 border-accent-ai-gold/60 p-6 flex flex-col justify-between shadow-2xl order-1 md:order-2 md:-translate-y-2 ring-1 ring-accent-ai-gold/30">
                <div className="absolute -top-3.5 right-5 px-3 py-1 rounded-full bg-accent-ai-gold text-white dark:text-slate-950 font-mono-data text-xs font-bold shadow-lg flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" data-weight="fill">
                    military_tech
                  </span>
                  #1 NATIONAL SCHOLAR
                </div>
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-300 via-accent-ai-gold to-yellow-500 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-headline-md font-extrabold text-accent-ai-gold">
                          {top1.fullName.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent-ai-gold text-white dark:text-slate-950 font-mono-data text-xs font-black flex items-center justify-center border-2 border-bg-card">
                        1
                      </div>
                    </div>
                    <div>
                      <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                        {top1.fullName}
                      </h2>
                      <div className="flex items-center gap-1 text-body-sm text-text-secondary">
                        <span className="material-symbols-outlined text-sm text-accent-ai-gold">location_on</span>
                        {top1.state}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="inline-block px-2.5 py-1 rounded bg-accent-ai-gold/15 border border-accent-ai-gold/40 text-[12px] font-semibold text-accent-ai-gold">
                      Medicine Combo
                    </div>
                    <div className="text-[12px] text-text-muted font-mono-data">{top1.combo}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3.5 rounded-xl bg-surface-container border border-border mb-4">
                    <div>
                      <span className="text-[11px] text-text-muted block">Avg Mock Score</span>
                      <span className="font-mono-data text-headline-sm font-bold text-tertiary">
                        {top1.avg_score || '—'}
                        {top1.avg_score ? <span className="text-xs text-text-muted font-normal">/400</span> : null}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted block">Study Streak</span>
                      <span className="font-mono-data text-headline-sm font-bold text-accent-streak-rose flex items-center gap-1">
                        <span className="material-symbols-outlined text-base" data-weight="fill">
                          local_fire_department
                        </span>
                        {top1.streak_count || 0} Days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-body-sm">
                  <span className="text-text-secondary">Total XP</span>
                  <span className="font-mono-data text-mono-data font-bold text-accent-ai-gold">
                    {top1.xp_points?.toLocaleString() || 0} XP
                  </span>
                </div>
              </div>
            )}

            {/* RANK 3: BRONZE PODIUM */}
            {top3 && (
              <div className="relative rounded-2xl bg-bg-card border border-amber-700/30 p-6 flex flex-col justify-between shadow-lg order-3 hover:border-amber-600/50 transition-all">
                <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-amber-600 text-white font-mono-data text-xs font-bold shadow-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">workspace_premium</span>
                  #3 NATIONWIDE
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-amber-600 to-amber-900 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-headline-md font-bold text-amber-700 dark:text-amber-400">
                          {top3.fullName.substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-600 text-white font-mono-data text-xs font-bold flex items-center justify-center border-2 border-bg-card">
                        3
                      </div>
                    </div>
                    <div>
                      <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                        {top3.fullName}
                      </h2>
                      <div className="flex items-center gap-1 text-body-sm text-text-secondary">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        {top3.state}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="inline-block px-2.5 py-1 rounded bg-surface-container border border-border text-[12px] font-semibold text-secondary">
                      Commercial Combo
                    </div>
                    <div className="text-[12px] text-text-muted font-mono-data">{top3.combo}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-container-low border border-border mb-4">
                    <div>
                      <span className="text-[11px] text-text-muted block">Avg Mock Score</span>
                      <span className="font-mono-data text-headline-sm font-bold text-text-primary">
                        {top3.avg_score || '—'}
                        {top3.avg_score ? <span className="text-xs text-text-muted font-normal">/400</span> : null}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted block">Study Streak</span>
                      <span className="font-mono-data text-headline-sm font-bold text-accent-streak-rose flex items-center gap-1">
                        <span className="material-symbols-outlined text-base" data-weight="fill">
                          local_fire_department
                        </span>
                        {top3.streak_count || 0} Days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-body-sm">
                  <span className="text-text-secondary">Total XP</span>
                  <span className="font-mono-data text-mono-data font-bold text-amber-700 dark:text-amber-400">
                    {top3.xp_points?.toLocaleString() || 0} XP
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* FILTER BAR & FULL LEADERBOARD TABLE */}
        <section className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1 md:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-label-sm font-label-sm transition-all whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-accent-royal-blue text-white font-semibold shadow-sm'
                    : 'bg-surface-container text-text-secondary hover:text-text-primary'
                }`}
              >
                All Scholars
              </button>
              <button
                onClick={() => setActiveTab('mocks')}
                className={`px-3.5 py-1.5 rounded-lg text-label-sm font-label-sm transition-all whitespace-nowrap ${
                  activeTab === 'mocks'
                    ? 'bg-accent-royal-blue text-white font-semibold shadow-sm'
                    : 'bg-surface-container text-text-secondary hover:text-text-primary'
                }`}
              >
                Top Mock Scorers
              </button>
              <button
                onClick={() => setActiveTab('streaks')}
                className={`px-3.5 py-1.5 rounded-lg text-label-sm font-label-sm transition-all whitespace-nowrap ${
                  activeTab === 'streaks'
                    ? 'bg-accent-royal-blue text-white font-semibold shadow-sm'
                    : 'bg-surface-container text-text-secondary hover:text-text-primary'
                }`}
              >
                Study Streaks
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search candidate or AKX ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low border border-border text-body-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-royal-blue"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-container-low text-label-sm font-label-sm text-text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-3 sm:px-6">Rank</th>
                  <th className="py-3.5 px-3 sm:px-4">Candidate & Center</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">Aurikrex ID</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden md:table-cell">UTME Combo</th>
                  <th className="py-3.5 px-3 sm:px-4">Avg Mock</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden xs:table-cell">Study Streak</th>
                  <th className="py-3.5 px-3 sm:px-6 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Synchronizing national rankings...</span>
                      </div>
                    </td>
                  </tr>
                ) : scholars.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      No matching scholars found.
                    </td>
                  </tr>
                ) : (
                  scholars.map((s, index) => {
                    const rank = index + 1;
                    return (
                      <tr
                        key={s.id || index}
                        className="hover:bg-surface-container/50 transition-colors font-body-sm"
                      >
                        <td className="py-3.5 px-3 sm:px-6">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono-data font-bold text-xs ${
                              rank === 1
                                ? 'bg-accent-ai-gold/15 text-accent-ai-gold border border-accent-ai-gold/40'
                                : rank === 2
                                ? 'bg-slate-400/20 text-slate-700 dark:text-slate-300 border border-slate-400/40'
                                : rank === 3
                                ? 'bg-amber-700/20 text-amber-700 dark:text-amber-400 border border-amber-700/40'
                                : 'bg-surface-container text-text-muted'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4">
                          <div>
                            <div className="font-semibold text-text-primary text-body-sm">
                              {s.fullName}
                            </div>
                            <div className="text-xs text-text-muted">{s.state}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 font-mono-data text-xs text-secondary hidden sm:table-cell">
                          {s.aurikrex_id}
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 text-xs text-text-secondary font-mono-data hidden md:table-cell">
                          {s.combo}
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 font-mono-data text-body-sm font-bold text-tertiary whitespace-nowrap">
                          {s.avg_score} <span className="text-xs font-normal text-text-muted">/400</span>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 hidden xs:table-cell">
                          <span className="inline-flex items-center gap-1 font-mono-data text-xs font-semibold text-accent-streak-rose">
                            <span className="material-symbols-outlined text-sm" data-weight="fill">
                              local_fire_department
                            </span>
                            {s.streak_count}d
                          </span>
                        </td>
                        <td className="py-3.5 px-3 sm:px-6 text-right font-mono-data font-bold text-primary whitespace-nowrap">
                          {s.xp_points?.toLocaleString()} XP
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="w-full py-4 text-center text-xs text-text-muted border-t border-border mt-10">
        Aurikrex Exam Arena · © 2025/2026 Aurikrex. Psychometric standings refreshed hourly.
      </footer>
    </div>
  );
}
