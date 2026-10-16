import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout';
import { getMe } from '../features/auth/api';
import { getResultsHistory, getTopicStats, GradedResultRecord, TopicStatRecord } from '../features/results/api';
import { getSubjectLabel } from '../constants/subjects';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Flame,
  Search,
  Award,
} from 'lucide-react';

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
  const [mainView, setMainView] = useState<'analytics' | 'leaderboard'>('analytics');
  const [xpLeaders, setXpLeaders] = useState<LeaderboardUser[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<LeaderboardUser[]>([]);
  const [resultsHistory, setResultsHistory] = useState<GradedResultRecord[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLeaderTab, setActiveLeaderTab] = useState<'xp' | 'streaks'>('xp');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getMe().catch(() => null),
      getResultsHistory().catch(() => []),
      getTopicStats().catch(() => []),
    ]).then(([userData, historyData, statsData]) => {
      if (userData) setUser(userData);
      setResultsHistory(Array.isArray(historyData) ? historyData : []);
      setTopicStats(Array.isArray(statsData) ? statsData : []);
      setLoading(false);
    });

    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
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
    }
  };

  // Real scholars list from database
  const scholars = useMemo(() => {
    const sourceList = activeLeaderTab === 'streaks' ? streakLeaders : xpLeaders;
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

    if (activeLeaderTab === 'streaks') {
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
  }, [xpLeaders, streakLeaders, activeLeaderTab, searchQuery]);

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

  // Real candidate analytics metrics
  const mockAttempts = useMemo(() => resultsHistory.filter((r) => r.type === 'mock'), [resultsHistory]);
  const drillAttempts = useMemo(() => resultsHistory.filter((r) => r.type === 'drill'), [resultsHistory]);

  const averageMockScore = useMemo(() => {
    if (mockAttempts.length === 0) return null;
    const total = mockAttempts.reduce((acc, curr) => acc + Number(curr.totalScore || 0), 0);
    return Math.round(total / mockAttempts.length);
  }, [mockAttempts]);

  const highestMockScore = useMemo(() => {
    if (mockAttempts.length === 0) return null;
    return Math.max(...mockAttempts.map((r) => Number(r.totalScore || 0)));
  }, [mockAttempts]);

  const totalQuestionsAnswered = useMemo(() => {
    return topicStats.reduce((acc, t) => acc + (t.total || 0), 0);
  }, [topicStats]);

  const overallAccuracy = useMemo(() => {
    const totalCorrect = topicStats.reduce((acc, t) => acc + (t.correct || 0), 0);
    if (totalQuestionsAnswered === 0) return null;
    return Math.round((totalCorrect / totalQuestionsAnswered) * 100);
  }, [topicStats, totalQuestionsAnswered]);

  const weakTopics = useMemo(() => {
    return topicStats
      .filter((t) => t.total >= 3 && t.accuracy < 50)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
  }, [topicStats]);

  const strongTopics = useMemo(() => {
    return topicStats
      .filter((t) => t.total >= 3 && t.accuracy >= 70)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);
  }, [topicStats]);

  return (
    <StudentLayout student={user}>
      <div className="space-y-6">
        {/* Main View Switcher: Analytics vs National Leaderboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
              Performance &amp; Scholar Rankings
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Review your authentic exam telemetry, score progression, and national rank.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl border border-border shrink-0">
            <button
              onClick={() => setMainView('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                mainView === 'analytics'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>My Analytics</span>
            </button>
            <button
              onClick={() => setMainView('leaderboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                mainView === 'leaderboard'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>National Leaderboard</span>
            </button>
          </div>
        </div>

        {mainView === 'analytics' ? (
          /* ======================================================== */
          /* TAB 1: MY PERFORMANCE ANALYTICS (REAL ATTEMPTS & STATS)  */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Avg Mock Score */}
              <div className="p-4 rounded-2xl bg-bg-card border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Average Mock Score</span>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-display text-text-primary">
                    {averageMockScore !== null ? averageMockScore : '—'}
                  </span>
                  <span className="text-xs text-text-muted font-normal ml-1">/ 400</span>
                  <p className="text-[11px] text-text-muted mt-1 font-mono">
                    {mockAttempts.length > 0 ? `${mockAttempts.length} full mock sitting(s)` : 'No mocks completed yet'}
                  </p>
                </div>
              </div>

              {/* Best Mock Score */}
              <div className="p-4 rounded-2xl bg-bg-card border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Highest Mock Score</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-display text-text-primary">
                    {highestMockScore !== null ? highestMockScore : '—'}
                  </span>
                  <span className="text-xs text-text-muted font-normal ml-1">/ 400</span>
                  <p className="text-[11px] text-text-muted mt-1 font-mono">Target: 320+ Agg.</p>
                </div>
              </div>

              {/* Total Questions Solved */}
              <div className="p-4 rounded-2xl bg-bg-card border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Questions Answered</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-display text-text-primary">
                    {totalQuestionsAnswered}
                  </span>
                  <p className="text-[11px] text-text-muted mt-1 font-mono">
                    {drillAttempts.length} topic drill(s) logged
                  </p>
                </div>
              </div>

              {/* Overall Accuracy */}
              <div className="p-4 rounded-2xl bg-bg-card border border-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Overall Practice Accuracy</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-display text-text-primary">
                    {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
                  </span>
                  <p className="text-[11px] text-text-muted mt-1 font-mono">
                    {overallAccuracy !== null && overallAccuracy >= 70
                      ? 'Solid competitive form'
                      : overallAccuracy !== null
                      ? 'Focus on weak topics'
                      : 'Untested candidate'}
                  </p>
                </div>
              </div>
            </div>

            {/* Score History & Blindspots Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 Cols): Exam History */}
              <div className="lg:col-span-8 bg-bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold font-display text-text-primary">
                      Examination &amp; Drill History
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      All completed CBT sittings and graded sessions
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/mock-setup')}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Take New Mock</span>
                  </button>
                </div>

                {resultsHistory.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">No Exam Attempts Recorded</h4>
                      <p className="text-xs text-text-muted max-w-sm mt-1">
                        Take a full-length CBT mock exam or subject practice drill to see your historical scores, speed, and accuracy breakdowns here.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/mock-setup')}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary-hover transition-colors"
                    >
                      Start First Mock Exam →
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Score</th>
                          <th className="py-2.5 px-3">Time Spent</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {resultsHistory.slice(0, 10).map((r) => {
                          const dateStr = r.completedAt
                            ? new Date(r.completedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Recent';
                          const mins = Math.floor((r.timeSpentSeconds || 0) / 60);
                          const secs = (r.timeSpentSeconds || 0) % 60;
                          return (
                            <tr key={r.resultId} className="hover:bg-surface-container/50 transition-colors">
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                    r.type === 'mock'
                                      ? 'bg-primary/10 text-primary border border-primary/20'
                                      : 'bg-surface-container-high text-text-secondary border border-border'
                                  }`}
                                >
                                  {r.type === 'mock' ? 'Full Mock' : 'Topic Drill'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-text-muted font-mono">{dateStr}</td>
                              <td className="py-3 px-3 font-mono font-bold text-text-primary">
                                {r.type === 'mock' ? `${r.totalScore} / 400` : `${r.totalScore}%`}
                              </td>
                              <td className="py-3 px-3 font-mono text-text-muted">
                                {mins}m {secs}s
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => navigate(`/results/${r.resultId}`)}
                                  className="text-primary hover:text-primary-hover font-semibold flex items-center gap-1 justify-end ml-auto"
                                >
                                  <span>Review</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column (4 Cols): Diagnostic Deficits / Weak Topics */}
              <div className="lg:col-span-4 bg-bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="pb-3 border-b border-border">
                  <h3 className="text-sm font-bold font-display text-text-primary">
                    Diagnostic Blindspots
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Sub-topics needing urgent attention (&lt;50% accuracy)
                  </p>
                </div>

                {weakTopics.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-semibold text-text-primary">No Critical Deficits</p>
                    <p className="text-[11px] text-text-muted">
                      {topicStats.length === 0
                        ? 'Practice more topic drills to discover weak areas.'
                        : 'Your accuracy across tested topics is above 50%.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weakTopics.map((topic, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-surface-container border border-rose-500/20 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[170px]">{topic.topic}</span>
                          </div>
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">
                            {getSubjectLabel(topic.subject)} · {topic.correct}/{topic.total} correct
                          </p>
                        </div>
                        <span className="font-mono font-bold text-rose-500 text-sm shrink-0">
                          {Math.round(topic.accuracy)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {strongTopics.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-bold text-text-primary mb-2">Mastered Strengths (70%+)</h4>
                    <div className="space-y-1.5">
                      {strongTopics.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="text-text-secondary truncate max-w-[180px]">{topic.topic}</span>
                          <span className="font-mono text-emerald-500 font-semibold">{Math.round(topic.accuracy)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* TAB 2: NATIONAL SCHOLAR LEADERBOARD                       */
          /* ======================================================== */
          <div className="space-y-6">
            {/* HERO & METRIC TELEMETRY BANNER */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-card via-surface-container to-bg-primary border border-border p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-surface-container border border-border text-xs text-primary font-semibold">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Official Standings · UTME 2025/2026</span>
                  </div>
                  <h2 className="text-xl font-bold font-display text-text-primary tracking-tight">
                    National UTME Scholar Standings
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Verified rankings based on real mock exam scores, completed topic drills, and study streaks.
                  </p>
                </div>

                {/* Active User Standing */}
                <div className="bg-surface-container border border-border rounded-xl p-3.5 flex items-center gap-4 shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {user?.level ?? 1}
                  </div>
                  <div>
                    <div className="text-[11px] text-text-muted">Your Standing</div>
                    <div className="text-sm font-bold text-text-primary">
                      {isRanked ? `#${userRankIndex + 1} Nationwide` : 'Unranked'}
                    </div>
                    <div className="text-[10px] text-text-muted font-mono">
                      {(user?.xp_points ?? 0).toLocaleString()} XP · {user?.streak_count ?? 0}d streak
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveLeaderTab('xp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeLeaderTab === 'xp'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  Top XP Scholars
                </button>
                <button
                  onClick={() => setActiveLeaderTab('streaks')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeLeaderTab === 'streaks'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  Streak Leaders
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search candidate or AKX ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container border border-border text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Podium or List */}
            {scholars.length === 0 ? (
              <div className="bg-bg-card border border-border rounded-2xl p-8 text-center space-y-3">
                <Award className="w-10 h-10 text-primary mx-auto opacity-40" />
                <h4 className="text-sm font-bold text-text-primary">National Leaderboard Live</h4>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Be among the first scholars on the board. Take mock exams and drills to earn XP and claim your national ranking.
                </p>
                <button
                  onClick={() => navigate('/mock-setup')}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Launch Mock Exam
                </button>
              </div>
            ) : (
              <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-container text-text-muted uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Aurikrex ID</th>
                        <th className="py-3 px-4">Study Streak</th>
                        <th className="py-3 px-4 text-right">Total XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {scholars.map((s, index) => {
                        const rank = index + 1;
                        return (
                          <tr key={s.id || index} className="hover:bg-surface-container/50 transition-colors">
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs ${
                                  rank === 1
                                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/40'
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
                            <td className="py-3 px-4">
                              <div className="font-semibold text-text-primary">{s.fullName}</div>
                              <div className="text-[10px] text-text-muted">{s.state}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-primary hidden sm:table-cell">
                              {s.aurikrex_id}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 font-mono text-amber-500 font-semibold">
                                <Flame className="w-3.5 h-3.5 fill-current" />
                                {s.streak_count}d
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                              {s.xp_points?.toLocaleString()} XP
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
