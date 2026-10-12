import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe, logout } from '../features/auth/api';
import { getResultsHistory, GradedResultRecord, getTopicStats, TopicStatRecord } from '../features/results/api';
import { getSubjectTopics } from '../features/questions/api';
import { createExamSession } from '../features/exam/api';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  CircleDashed,
  KeyRound,
  Layers,
  LogOut,
  Play,
  ShieldCheck,
  Target,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { AiChatWidget } from '../features/ai/AiChatWidget';
import { Alert, Badge, Button, Modal, SecuritySettings, useToast, AppNavbar } from '../components';
import { AVAILABLE_SUBJECTS, getSubjectLabel } from '../constants/subjects';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAkxId, setCopiedAkxId] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [resultsList, setResultsList] = useState<GradedResultRecord[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStatRecord[]>([]);

  // Drill Modal State
  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);
  const [drillSubject, setDrillSubject] = useState('');
  const [drillCount, setDrillCount] = useState(20);
  const [drillDifficulty, setDrillDifficulty] = useState('any');
  const [drillTopics, setDrillTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Array<{ topic: string; count: number }>>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const combination = student?.exam_subject_combination && student.exam_subject_combination.length === 4
    ? student.exam_subject_combination
    : ['english', 'mathematics', 'physics', 'chemistry'];

  const subjectBreakdown = useMemo(() => {
    const bySubject = topicStats.reduce<Record<string, { subject: string; correct: number; total: number }>>((acc, stat) => {
      const subject = stat.subject || 'other';
      const existing = acc[subject] || { subject, correct: 0, total: 0 };
      existing.correct += Number(stat.correct || 0);
      existing.total += Number(stat.total || 0);
      acc[subject] = existing;
      return acc;
    }, {});

    return Object.values(bySubject)
      .map((item) => ({ ...item, accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0 }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [topicStats]);

  const mockResults = useMemo(() => resultsList.filter((result) => result.type === 'mock'), [resultsList]);
  const hasMockData = mockResults.length > 0;
  const averageMockScore = hasMockData
    ? Math.round(mockResults.reduce((sum, result) => sum + Number(result.totalScore || 0), 0) / mockResults.length)
    : null;
  const readinessIndex = averageMockScore !== null ? Math.round((averageMockScore / 400) * 100) : 0;

  const totalQuestionsSolved = resultsList.reduce(
    (sum, r) => sum + (r.questionsSnapshot ? r.questionsSnapshot.length : 0),
    0
  );

  const averageMockPaceFormatted = useMemo(() => {
    if (!hasMockData) return '—';
    const totalSecs = mockResults.reduce((sum, r) => sum + Number(r.timeSpentSeconds || 0), 0);
    const avgSecs = Math.round(totalSecs / mockResults.length);
    const h = Math.floor(avgSecs / 3600);
    const m = Math.floor((avgSecs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }, [hasMockData, mockResults]);

  const nextWeakTopic = useMemo(() => {
    const sorted = [...topicStats].sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0));
    return sorted[0] || null;
  }, [topicStats]);

  const openDrill = (subject = nextWeakTopic?.subject || combination[1] || 'physics') => {
    setDrillSubject(subject);
    setDrillCount(20);
    setDrillDifficulty('any');
    setDrillTopics(nextWeakTopic?.topic ? [nextWeakTopic.topic] : []);
    setIsDrillModalOpen(true);
  };

  useEffect(() => {
    if (!drillSubject) return;
    setIsLoadingTopics(true);
    setAvailableTopics([]);
    setDrillTopics([]);
    getSubjectTopics(drillSubject)
      .then((topics) => setAvailableTopics(topics))
      .catch((err) => console.error('Failed to load topics', err))
      .finally(() => setIsLoadingTopics(false));
  }, [drillSubject]);

  useEffect(() => {
    fetchProfileAndHistory();
  }, []);

  const fetchProfileAndHistory = async () => {
    setLoading(true);
    try {
      const profile = await getMe();
      setStudent(profile);
      setSelectedSubjects(profile.exam_subject_combination || ['english']);
      const [history, stats] = await Promise.all([getResultsHistory(), getTopicStats()]);
      setResultsList(history);
      setTopicStats(stats);
    } catch (requestError: any) {
      console.error(requestError);
      if (requestError?.response?.status === 401) {
        navigate('/auth?mode=login');
      } else {
        setError('We could not load your study workspace. Refresh the page to try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartDrill = async () => {
    if (!drillSubject) return;
    try {
      setLoading(true);
      const session = await createExamSession({
        type: 'drill',
        subject: drillSubject,
        count: drillCount,
        difficultyLevel: drillDifficulty,
        topics: drillTopics.length ? drillTopics : undefined,
      });
      session.warnings?.forEach((warning: string) => addToast({ type: 'info', title: 'Notice', message: warning }));
      setIsDrillModalOpen(false);
      navigate(`/exam/${session.id || session.sessionId}`);
    } catch (requestError: any) {
      addToast({
        type: 'error',
        title: 'Drill could not start',
        message: requestError.response?.data?.message || 'Failed to start this subject drill.',
      });
      setLoading(false);
    }
  };

  const handleToggleSubject = (subject: string) => {
    setSelectedSubjects((previous) => {
      if (previous.includes(subject)) return previous.filter((item) => item !== subject);
      if (previous.length >= 4) return previous;
      return [...previous, subject];
    });
  };

  const handleSaveCombination = async () => {
    const updatedCombination = ['english', ...selectedSubjects.filter((subject) => subject !== 'english')];
    if (updatedCombination.length !== 4) {
      setMessage('Select exactly three electives in addition to Use of English.');
      return;
    }
    try {
      setLoading(true);
      const updatedProfile = await updateMe({ exam_subject_combination: updatedCombination });
      setStudent(updatedProfile);
      setMessage('Your subject combination has been saved.');
      setIsEditModalOpen(false);
      setTimeout(() => setMessage(''), 3000);
      addToast({ type: 'success', title: 'Combination Updated', message: '4-Subject combination saved.' });
    } catch (requestError: any) {
      setMessage(requestError.response?.data?.message || 'We could not update your subject combination.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth?mode=login');
  };

  const aurikrexId = student?.aurikrex_id || (student?.id ? `AKX-${String(student?.id).slice(0, 6).toUpperCase()}` : '—');
  const firstName = student?.fullName ? student.fullName.split(' ')[0] : 'Candidate';

  if (loading && !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-text-secondary">Preparing your UTME diagnostic cockpit…</p>
        </div>
      </div>
    );
  }

  const getSubjectDeficit = (subjectKey: string) => {
    const statsForSub = topicStats.filter(
      (ts) => (ts.subject || '').toLowerCase() === subjectKey.toLowerCase()
    );
    if (!statsForSub.length) return null;
    const sorted = [...statsForSub].sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0));
    const lowest = sorted[0];
    return {
      topic: lowest.topic || 'General Topic',
      drillAccuracy: Math.round(Number(lowest.accuracy || 0)),
      total: Number(lowest.total || 0),
    };
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-body selection:bg-accent-royal-blue selection:text-white antialiased">
      {/* Ecosystem Top Bar */}
      <AppNavbar student={student} />

      {/* Main Canvas */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Candidate Hero Section */}
        <section className="bg-gradient-to-r from-bg-secondary via-surface-container to-bg-card rounded-2xl border border-border p-6 relative overflow-hidden shadow-lg">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-accent-royal-blue/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Greetings & Candidate Status */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md bg-surface-container border border-border text-primary font-mono-data text-[12px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  Level {student?.level ?? 1} Scholar
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-container border border-border text-tertiary font-mono-data text-[12px]">
                  {(student?.xp_points ?? 0).toLocaleString()} XP
                </span>
                <span className="px-2.5 py-1 rounded-md bg-accent-royal-blue/20 border border-accent-royal-blue/40 text-primary font-label-sm text-[12px]">
                  2025 UTME Cycle
                </span>
              </div>
              <div>
                <h1 className="text-headline-lg font-headline-lg font-bold text-text-primary tracking-tight">
                  Good day, {firstName} · Targeting 320+ in 2025 UTME
                </h1>
                <p className="text-text-secondary text-body-sm font-body-sm mt-1">
                  Institutional readiness protocol synchronized. Track real-time progress across official curriculum targets.
                </p>
              </div>
            </div>

            {/* Streak Card & Quick Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Study Streak */}
              <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-surface-container-low border border-border">
                <div className="w-10 h-10 rounded-lg bg-accent-streak-rose/10 border border-accent-streak-rose/30 flex items-center justify-center text-accent-streak-rose">
                  <span className="material-symbols-outlined text-[24px]" data-weight="fill">
                    local_fire_department
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-primary font-headline-sm text-headline-sm font-bold">
                      {student?.streak_count ?? 0}-Day Streak
                    </span>
                  </div>
                  <p className="text-text-muted text-[11px] leading-tight">
                    Keep it going! Daily practice builds exam stamina
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => navigate('/mock-setup')}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-royal-blue text-white font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-md active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]" data-weight="fill">
                    play_arrow
                  </span>
                  <span>Launch Full 4-Subject Mock</span>
                  <span className="text-[11px] font-mono-data opacity-80">(02:00:00)</span>
                </button>
                <button
                  onClick={() => openDrill()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-container border border-border text-text-primary font-label-md text-label-md hover:bg-surface-variant transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">target</span>
                  <span>Targeted Topic Drill</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid: Readiness Gauge (8 Cols) & AI / Trend (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hero Readiness Score Widget */}
            <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[22px]">speed</span>
                  <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    UTME Readiness Score & 300+ Benchmark
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/20 border border-tertiary/30 text-tertiary font-label-sm text-[12px]">
                  <span className="material-symbols-outlined text-[14px]" data-weight="fill">
                    verified
                  </span>
                  <span>
                    {hasMockData
                      ? (averageMockScore && averageMockScore >= 300
                          ? '300+ Target Achieved · UTME High Readiness'
                          : 'Active UTME Benchmark Calculation')
                      : 'No mocks completed yet · Complete a mock to calculate index'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Radial SVG Gauge */}
                <div className="md:col-span-5 flex flex-col items-center justify-center py-2">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" fill="transparent" r="50" stroke="var(--surface-container-high, #1c2b40)" strokeLinecap="round" strokeWidth="10" />
                      <circle
                        className="transition-all duration-1000 ease-out"
                        cx="60"
                        cy="60"
                        fill="transparent"
                        r="50"
                        stroke="#3454dc"
                        strokeDasharray="314.15"
                        strokeDashoffset={314.15 - (314.15 * (hasMockData ? readinessIndex : 0)) / 100}
                        strokeLinecap="round"
                        strokeWidth="10"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center text-center">
                      <span className="text-headline-xl font-headline-xl font-bold text-text-primary leading-none">
                        {hasMockData ? averageMockScore : '—'}
                      </span>
                      <span className="text-text-muted font-mono-data text-[13px] font-semibold mt-0.5">
                        {hasMockData ? '/ 400 Projected' : 'No Mocks Yet'}
                      </span>
                      <div className="mt-2 px-2.5 py-0.5 rounded-full bg-accent-royal-blue/20 text-primary text-[11px] font-mono-data border border-accent-royal-blue/30 font-semibold">
                        {hasMockData ? `${readinessIndex}% UTME Index` : '0% UTME Index'}
                      </div>
                    </div>
                  </div>
                  <span className="text-text-secondary text-[12px] font-body-sm mt-3 text-center">
                    {hasMockData ? 'Calculated across recent simulation sittings' : 'Complete full-length simulations to generate index'}
                  </span>
                </div>

                {/* Subject-Level Breakdown */}
                <div className="md:col-span-7 space-y-3.5 pl-0 md:pl-4 md:border-l border-border">
                  <div className="flex justify-between items-center text-label-sm font-label-sm text-text-secondary mb-1">
                    <span>Subject Contribution</span>
                    <span>Target Ratio</span>
                  </div>

                  {combination.map((sub: string) => {
                    const isEng = sub === 'english';
                    const realStat = subjectBreakdown.find((s) => s.subject.toLowerCase() === sub.toLowerCase());
                    const hasStat = Boolean(realStat && realStat.total > 0);
                    const accuracy = hasStat ? realStat!.accuracy : 0;
                    const targetRatio = hasStat ? `${realStat!.accuracy}% (${realStat!.correct}/${realStat!.total})` : 'Not tested yet';
                    const barWidth = `${accuracy}%`;
                    return (
                      <div key={sub} className="space-y-1">
                        <div className="flex justify-between text-body-sm font-body-sm">
                          <span className="text-text-primary font-medium">
                            {getSubjectLabel(sub)}{' '}
                            {isEng && <span className="text-text-muted text-[11px]">(Compulsory)</span>}
                          </span>
                          <span className="font-mono-data text-primary">{targetRatio}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isEng ? 'bg-primary-container' : 'bg-tertiary'}`}
                            style={{ width: barWidth }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Telemetry Badges */}
              <div className="mt-6 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-border">
                  <span className="block text-headline-sm font-headline-sm font-bold text-text-primary">
                    {mockResults.length}
                  </span>
                  <span className="text-text-muted text-[12px]">Mocks Completed</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-border">
                  <span className="block text-headline-sm font-headline-sm font-bold text-text-primary">
                    {totalQuestionsSolved.toLocaleString()}
                  </span>
                  <span className="text-text-muted text-[12px]">Questions Solved</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-low border border-border">
                  <span className="block text-headline-sm font-headline-sm font-bold text-text-primary font-mono-data">
                    {averageMockPaceFormatted}
                  </span>
                  <span className="text-text-muted text-[12px]">Avg. Mock Pace</span>
                </div>
              </div>
            </div>

            {/* 4-Subject Diagnostic Performance Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">analytics</span>
                  <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    4-Subject Diagnostic Performance
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-primary hover:underline text-xs font-semibold"
                >
                  Change Combination
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combination.map((sub: string) => {
                  const isEng = sub === 'english';
                  const deficitInfo = getSubjectDeficit(sub);
                  const realStat = subjectBreakdown.find((s) => s.subject.toLowerCase() === sub.toLowerCase());
                  const hasStat = Boolean(realStat && realStat.total > 0);
                  const accuracyStr = hasStat ? `${realStat!.accuracy}%` : '—';

                  return (
                    <div
                      key={sub}
                      className="bg-bg-card rounded-2xl border border-border p-5 flex flex-col justify-between hover:border-border-hover transition-all shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase font-semibold ${
                                isEng
                                  ? 'bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/30'
                                  : 'bg-tertiary-container/20 text-tertiary border border-tertiary/30'
                              }`}
                            >
                              {isEng ? 'Compulsory · 60 Qs' : 'Elective · 40 Qs'}
                            </span>
                            <h4 className="text-headline-sm font-headline-sm font-bold text-text-primary mt-1.5">
                              {getSubjectLabel(sub)}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-headline-md font-headline-md font-bold text-text-primary">
                              {accuracyStr}
                            </span>
                            <span className="block text-[11px] text-text-muted">Accuracy</span>
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-border">
                          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                            <span className="flex items-center gap-1 text-accent-streak-rose font-medium">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              Focus Deficit
                            </span>
                            <span>
                              {deficitInfo ? `Recent Drill: ${deficitInfo.drillAccuracy}%` : 'Untested'}
                            </span>
                          </div>
                          <p className="text-text-primary font-medium text-body-sm">
                            {deficitInfo ? deficitInfo.topic : 'Complete practice drills to diagnose topic blindspots'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-[12px] text-text-secondary">
                          {hasStat ? `${realStat!.total} questions solved` : 'Not tested yet'}
                        </span>
                        <button
                          onClick={() => openDrill(sub)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-primary border border-border text-label-sm font-label-sm font-semibold transition-all active:scale-[0.98]"
                        >
                          Drill Topic
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Falke AI Card */}
            <div className="bg-gradient-to-b from-bg-card to-surface-container rounded-2xl border border-accent-ai-gold/30 p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent-ai-gold/20 flex items-center justify-center text-accent-ai-gold border border-accent-ai-gold/40">
                    <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                  </div>
                  <h3 className="text-headline-sm font-headline-sm font-bold text-accent-ai-gold">
                    Falke AI Study Assistant
                  </h3>
                </div>
                <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-accent-ai-gold/15 text-accent-ai-gold border border-accent-ai-gold/30 font-bold">
                  PRO
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-secondary leading-relaxed">
                Curriculum-aligned explanations in Standard Academic English & Nigerian Pidgin.
              </p>

              <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-border">
                <div className="flex items-center justify-between text-[11px] font-mono-data text-text-muted mb-1">
                  <span>Shared Explanation Cache</span>
                  <span className="text-tertiary font-bold">94% Hit Rate</span>
                </div>
                <div className="flex items-center gap-2 text-label-sm text-text-primary">
                  <span className="material-symbols-outlined text-[16px] text-accent-ai-gold">bolt</span>
                  <span className="text-xs">0 Coins on cache hits · 5 Coins for new derivations</span>
                </div>
              </div>

              {/* Direct Prompt */}
              <div className="mt-4">
                <span className="block text-[11px] text-text-muted uppercase font-mono-data mb-1.5 font-semibold">
                  Direct AI Telemetry Prompt
                </span>
                <button
                  onClick={() => navigate('/falke-ai')}
                  className="w-full text-left p-3 rounded-xl bg-surface-container border border-border hover:border-accent-ai-gold/50 transition-all text-body-sm text-text-primary flex items-center justify-between group active:scale-[0.98]"
                >
                  <span className="truncate pr-2">Explain: Doppler effect in moving sound sources</span>
                  <span className="material-symbols-outlined text-accent-ai-gold group-hover:translate-x-1 transition-transform text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[12px] text-text-muted">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">translate</span>
                  <span>Modes: English & Pidgin</span>
                </div>
                <button
                  onClick={() => navigate('/falke-ai')}
                  className="text-accent-ai-gold hover:underline font-label-sm font-semibold"
                >
                  Open Studio
                </button>
              </div>
            </div>

            {/* Recent Mock Progression */}
            <div className="bg-bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    Recent Mock Progression
                  </h3>
                  <p className="text-text-muted text-[12px]">Last 5 Full-Length CBT Attempts</p>
                </div>
                {hasMockData && (
                  <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-mono-data text-[12px] font-bold">
                    {mockResults.length} Logged
                  </span>
                )}
              </div>

              {hasMockData ? (
                <>
                  <div className="h-28 w-full flex items-end justify-between gap-2 pt-4 px-2 pb-2 bg-surface-container-low rounded-xl border border-border">
                    {mockResults.slice(-5).map((m, idx, arr) => {
                      const score = Number(m.totalScore || 0);
                      const isLatest = idx === arr.length - 1;
                      const heightPercent = `${Math.min(100, Math.max(15, Math.round((score / 400) * 100)))}%`;
                      return (
                        <div key={m.resultId || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span
                            className={`text-[11px] font-mono-data ${
                              isLatest ? 'text-tertiary font-bold' : 'text-text-muted'
                            }`}
                          >
                            {score}
                          </span>
                          <div
                            className={`w-full rounded-t-sm ${isLatest ? 'bg-tertiary' : 'bg-surface-container-high'}`}
                            style={{ height: heightPercent }}
                          />
                          <span
                            className={`text-[10px] font-mono-data ${
                              isLatest ? 'text-tertiary font-bold' : 'text-text-muted'
                            }`}
                          >
                            M-0{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[12px] text-text-secondary">
                    <span className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full bg-accent-royal-blue" />
                      Target 300+ Benchmark
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-6 bg-surface-container-low rounded-xl border border-border text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container mx-auto flex items-center justify-center text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">show_chart</span>
                  </div>
                  <p className="text-body-sm text-text-secondary">
                    No mock attempts logged yet. Launch your first 120-minute mock exam to start charting your score progression.
                  </p>
                  <button
                    onClick={() => navigate('/arena')}
                    className="px-4 py-2 rounded-lg bg-primary text-text-on-primary text-label-sm font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Take First Mock Exam
                  </button>
                </div>
              )}
            </div>

            {/* Readiness Tools */}
            <div className="bg-bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
              <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                Readiness Tools
              </h3>
              <div className="space-y-2">
                <a
                  href="/study"
                  className="p-3 rounded-xl bg-surface-container-low border border-border hover:border-border-hover flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">checklist</span>
                    </div>
                    <div>
                      <span className="text-body-sm font-medium text-text-primary block">
                        Official JAMB Syllabus
                      </span>
                      <span className="text-[11px] text-text-muted">
                        Track official syllabus coverage across all 4 subjects
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-text-primary transition-colors text-[20px]">
                    chevron_right
                  </span>
                </a>

                <a
                  href="/questions"
                  className="p-3 rounded-xl bg-surface-container-low border border-border hover:border-border-hover flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-warning-amber">
                      <span className="material-symbols-outlined text-[20px]">quiz</span>
                    </div>
                    <div>
                      <span className="text-body-sm font-medium text-text-primary block">
                        1983–2024 Past Questions
                      </span>
                      <span className="text-[11px] text-text-muted">
                        1,000,000+ Verified JAMB Items
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-text-primary transition-colors text-[20px]">
                    chevron_right
                  </span>
                </a>

                <button
                  onClick={() => navigate('/mock-setup')}
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-border hover:border-border-hover flex items-center justify-between group transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[20px]">play_circle</span>
                    </div>
                    <div>
                      <span className="text-body-sm font-medium text-text-primary block">
                        Full Mock Simulation
                      </span>
                      <span className="text-[11px] text-text-muted">
                        120m Timed CBT Kiosk Mode
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-text-primary transition-colors text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Subject Combination Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit 4-Subject UTME Combination"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Use of English is compulsory. Select exactly 3 additional electives for your target faculty.
          </p>

          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scroll p-1">
            {AVAILABLE_SUBJECTS.map((sub: string) => {
              const isSelected = selectedSubjects.includes(sub);
              const isEnglish = sub === 'english';
              return (
                <button
                  key={sub}
                  type="button"
                  disabled={isEnglish}
                  onClick={() => handleToggleSubject(sub)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                    isEnglish
                      ? 'border-accent-royal-blue/40 bg-accent-royal-blue/15 text-primary opacity-90'
                      : isSelected
                      ? 'border-accent-royal-blue bg-accent-royal-blue/20 text-primary'
                      : 'border-border bg-surface-container-low text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{getSubjectLabel(sub)}</span>
                  {isSelected && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs font-mono-data text-text-muted">
              {selectedSubjects.length} / 4 Selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedSubjects.length !== 4}
                onClick={handleSaveCombination}
              >
                Save Combination
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Targeted Drill Modal */}
      <Modal
        isOpen={isDrillModalOpen}
        onClose={() => setIsDrillModalOpen(false)}
        title={`Configure Targeted Drill · ${getSubjectLabel(drillSubject)}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">Subject</label>
            <select
              value={drillSubject}
              onChange={(e) => setDrillSubject(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border bg-surface-container-low text-text-primary text-sm outline-none focus:border-accent-royal-blue"
            >
              {combination.map((sub: string) => (
                <option key={sub} value={sub}>
                  {getSubjectLabel(sub)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Questions Count
              </label>
              <select
                value={drillCount}
                onChange={(e) => setDrillCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border bg-surface-container-low text-text-primary text-sm outline-none focus:border-accent-royal-blue"
              >
                <option value={10}>10 Questions (Quick)</option>
                <option value={20}>20 Questions (Standard)</option>
                <option value={40}>40 Questions (Full Subject)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">Difficulty</label>
              <select
                value={drillDifficulty}
                onChange={(e) => setDrillDifficulty(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-surface-container-low text-text-primary text-sm outline-none focus:border-accent-royal-blue"
              >
                <option value="any">Standard JAMB Mix</option>
                <option value="3">Foundation</option>
                <option value="5">Challenge Mode</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setIsDrillModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleStartDrill}>
              Start Drill Now
            </Button>
          </div>
        </div>
      </Modal>

      <footer className="w-full py-4 text-center text-xs text-text-muted border-t border-border mt-10">
        Aurikrex Exam Arena · © 2025/2026 Aurikrex. All rights reserved.
      </footer>
    </div>
  );
}
