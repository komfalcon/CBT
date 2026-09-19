import { useEffect, useState } from 'react';
import { Card, Badge } from '../components';
import { Trophy, Flame, User } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components';

export default function Leaderboard() {
  const [xpLeaders, setXpLeaders] = useState<any[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const [xpRes, streakRes] = await Promise.all([
        fetch(`${apiBase}/leaderboard/xp`, { credentials: 'include' }),
        fetch(`${apiBase}/leaderboard/streak`, { credentials: 'include' })
      ]);
      if (xpRes.ok) setXpLeaders(await xpRes.json());
      if (streakRes.ok) setStreakLeaders(await streakRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderRankBadge = (rank: number, isStreak = false) => {
    if (rank === 1) {
      return (
        <div className="h-8 w-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-400/40 shadow-sm shadow-amber-400/20">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="h-8 w-8 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center font-black text-xs border border-slate-300/40 shadow-sm">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="h-8 w-8 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-black text-xs border border-amber-700/40 shadow-sm">
          🥉
        </div>
      );
    }
    return (
      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
        isStreak ? 'bg-streak/15 text-streak' : 'bg-primary/20 text-primary'
      }`}>
        {rank}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-auto font-sans">
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
            Global Leaderboard
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 grid gap-8 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-6 w-6 text-amber-400" />
            <h3 className="text-lg font-bold text-text-primary">Top XP Earners</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-bg-secondary border border-border rounded-xl" />
              ))}
            </div>
          ) : xpLeaders.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm rounded-xl border border-dashed border-border p-6">
              No XP scores recorded yet. Complete a mock or practice drill to claim the #1 spot!
            </div>
          ) : (
            <div className="space-y-3">
              {xpLeaders.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg-secondary/70 hover:border-border-hover transition-colors">
                  <div className="flex items-center gap-3">
                    {renderRankBadge(i + 1, false)}
                    <div>
                      <div className="font-bold text-sm text-text-primary">{u.fullName}</div>
                      <div className="text-xs text-text-secondary">Level {u.level || 1}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-primary">{u.xp_points}</div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-6 w-6 text-streak" />
            <h3 className="text-lg font-bold text-text-primary">Longest Streaks</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-bg-secondary border border-border rounded-xl" />
              ))}
            </div>
          ) : streakLeaders.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm rounded-xl border border-dashed border-border p-6">
              No streaks recorded yet. Practice daily to build your streak!
            </div>
          ) : (
            <div className="space-y-3">
              {streakLeaders.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg-secondary/70 hover:border-border-hover transition-colors">
                  <div className="flex items-center gap-3">
                    {renderRankBadge(i + 1, true)}
                    <div>
                      <div className="font-bold text-sm text-text-primary">{u.fullName}</div>
                      <div className="text-xs text-text-secondary">Level {u.level || 1}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-streak">{u.streak_count}</div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Days</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
