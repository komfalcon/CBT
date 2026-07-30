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
        fetch(`${apiBase}/leaderboard/xp`),
        fetch(`${apiBase}/leaderboard/streak`)
      ]);
      if (xpRes.ok) setXpLeaders(await xpRes.json());
      if (streakRes.ok) setStreakLeaders(await streakRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-auto">
      <header className="border-b border-border bg-bg-primary/80 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
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
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-bold">Top XP Earners</h3>
          </div>
          {loading ? (
            <div className="animate-pulse h-20 bg-bg-secondary rounded-xl" />
          ) : (
            <div className="space-y-4">
              {xpLeaders.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg-secondary">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{u.fullName}</div>
                      <div className="text-xs text-text-secondary">Level {u.level || 1}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-primary">{u.xp_points}</div>
                    <div className="text-[10px] text-text-muted">XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-6 w-6 text-pink-500" />
            <h3 className="text-lg font-bold">Longest Streaks</h3>
          </div>
          {loading ? (
            <div className="animate-pulse h-20 bg-bg-secondary rounded-xl" />
          ) : (
            <div className="space-y-4">
              {streakLeaders.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl bg-bg-secondary">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center font-bold text-xs text-pink-500">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{u.fullName}</div>
                      <div className="text-xs text-text-secondary">Level {u.level || 1}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-pink-500">{u.streak_count}</div>
                    <div className="text-[10px] text-text-muted">Days</div>
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
