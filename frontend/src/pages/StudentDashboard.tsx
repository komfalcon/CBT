import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMe, updateMe, logout } from '../features/auth/api';
import { getResultsHistory, GradedResultRecord, getTopicStats, TopicStatRecord } from '../features/results/api';
import { getSubjectTopics } from '../features/questions/api';
import { createExamSession } from '../features/exam/api';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Play,
  Target,
  Sparkles,
  Bot,
  BarChart3,
  TrendingUp,
  Info,
  AlertTriangle,
  FileText,
  Atom,
  Calculator,
  FlaskConical,
  Flame,
  Search,
  CheckCircle2,
  CircleDashed,
  HelpCircle,
} from 'lucide-react';
import { StudentLayout } from '../components/StudentLayout';
import { Alert, Badge, Button, Modal, useToast } from '../components';
import { AVAILABLE_SUBJECTS, getSubjectLabel } from '../constants/subjects';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Falke AI input state in card
  const [aiPromptInput, setAiPromptInput] = useState('');

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
  const readinessIndex = averageMockScore !== null ? Math.min(100, Math.round((averageMockScore / 400) * 100)) : 0;

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
    const sorted = [...topicStats]
      .filter((t) => (t.total || 0) > 0)
      .sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0));
    return sorted[0] || null;
  }, [topicStats]);

  const weakTopics = useMemo(() => {
    return topicStats
      .filter((t) => (t.total || 0) > 0 && Number(t.accuracy || 0) < 70)
      .sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0))
      .slice(0, 4);
  }, [topicStats]);

  const openDrill = (subject?: string, topicName?: string) => {
    const targetSubject = subject || nextWeakTopic?.subject || combination[1] || 'physics';
    setDrillSubject(targetSubject);
    setDrillCount(20);
    setDrillDifficulty('any');
    setDrillTopics(topicName ? [topicName] : nextWeakTopic?.topic ? [nextWeakTopic.topic] : []);
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

  const handleAiPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    navigate(`/falke-ai?prompt=${encodeURIComponent(aiPromptInput.trim())}`);
  };

  const firstName = student?.fullName ? student.fullName.split(' ')[0] : 'Candidate';

  // Time of day greeting
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // SVG Gauge calculations
  const gaugeRadius = 45;
  const circumference = 2 * Math.PI * gaugeRadius;
  const strokeDashoffset = circumference - (circumference * readinessIndex) / 100;

  // Subject Contribution stats helper
  const getSubjectContrib = (sub: string) => {
    const realStat = subjectBreakdown.find((s) => s.subject.toLowerCase() === sub.toLowerCase());
    if (realStat && realStat.total > 0) {
      return {
        solved: realStat.correct,
        total: realStat.total,
        percentage: realStat.accuracy,
        tested: true,
      };
    }
    return { solved: 0, total: 60, percentage: 0, tested: false };
  };

  // Helper for subject icons
  const getSubjectIcon = (sub: string) => {
    const key = sub.toLowerCase();
    if (key.includes('math')) return { icon: Calculator, bg: 'bg-emerald-500/15 text-emerald-500' };
    if (key.includes('phys')) return { icon: Atom, bg: 'bg-purple-500/15 text-purple-500' };
    if (key.includes('chem')) return { icon: FlaskConical, bg: 'bg-amber-500/15 text-amber-500' };
    return { icon: BookOpen, bg: 'bg-blue-500/15 text-blue-500' };
  };

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

  return (
    <StudentLayout student={student}>
      <div className="space-y-6 pb-12">
        {/* ========================================================= */}
        {/* 1. HERO COCKPIT BANNER                                    */}
        {/* ========================================================= */}
        <section className="rounded-2xl border border-border bg-bg-card p-6 md:p-8 relative overflow-hidden shadow-sm">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Greeting, Target & Action Buttons */}
            <div className="space-y-4 max-w-xl">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary tracking-tight">
                  Good {timeOfDay}, {firstName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-primary">UTME 2025</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-sm font-semibold text-primary">Target: 320+</span>
                </div>
                <p className="text-text-secondary text-sm mt-1.5 leading-relaxed">
                  Stay consistent, keep practicing, and let's get you to your target.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => navigate('/mock-setup')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.98]"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="w-3 h-3 fill-current text-white translate-x-0.5" />
                  </div>
                  <span>Start Full Mock Exam</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => openDrill()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-variant text-text-primary font-medium text-sm transition-all active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4 text-text-muted" />
                  <span>Practice a Topic</span>
                </button>
              </div>
            </div>

            {/* Middle: Streak & Next Target Telemetry Cards */}
            <div className="flex flex-row lg:flex-col gap-3 shrink-0">
              {/* Streak Card */}
              <div className="flex-1 lg:w-56 flex items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-container border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-text-primary">
                      {student?.streak_count ?? 0} Day Streak
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {(student?.streak_count ?? 0) > 0 ? 'Keep it going!' : 'Start today!'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
              </div>

              {/* Next Target Card */}
              <div className="flex-1 lg:w-56 flex items-center gap-3 p-3.5 rounded-xl bg-surface-container border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-text-muted font-medium block">Next Target</span>
                  <span className="text-sm font-bold text-text-primary">320+</span>
                  <span className="text-[11px] text-text-muted block">UTME 2025</span>
                </div>
              </div>
            </div>

            {/* Right: Desk Illustration Graphic */}
            <div className="hidden xl:block w-72 h-36 rounded-xl overflow-hidden relative border border-border shrink-0">
              <picture>
                <source srcSet="/illustrations/hero-desk-dark.png" media="(prefers-color-scheme: dark)" />
                <img
                  src="/illustrations/hero-desk-dark.png"
                  alt="Study Workspace"
                  className="w-full h-full object-cover dark:block hidden"
                />
              </picture>
              <img
                src="/illustrations/hero-desk-light.png"
                alt="Study Workspace"
                className="w-full h-full object-cover dark:hidden block"
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. MIDDLE BENTO ROW: READINESS OVERVIEW & FALKE AI         */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 Cols): Your Readiness Overview */}
          <div className="lg:col-span-8 bg-bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-text-primary font-display">
                    Your Readiness Overview
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                  <span>View Detailed Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Gauge & Subject Contribution */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SVG Radial Score Gauge */}
                <div className="md:col-span-5 flex flex-col items-center justify-center py-2">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r={gaugeRadius}
                        fill="transparent"
                        stroke="currentColor"
                        className="text-surface-container-high"
                        strokeWidth="8"
                      />
                      {/* Progress Stroke */}
                      <circle
                        cx="50"
                        cy="50"
                        r={gaugeRadius}
                        fill="transparent"
                        stroke="#3B82F6"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>

                    {/* Central Score Text */}
                    <div className="absolute flex flex-col items-center text-center">
                      <span className="text-3xl font-display font-extrabold text-text-primary tracking-tight leading-none">
                        {hasMockData && averageMockScore !== null ? averageMockScore : '—'}
                      </span>
                      <span className="text-xs text-text-muted font-medium mt-0.5">
                        / 400
                      </span>
                      <span className="text-[11px] text-text-secondary mt-1">
                        Readiness Score
                      </span>
                      <div className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                        !hasMockData
                          ? 'bg-surface-container-high text-text-muted border-border'
                          : averageMockScore! >= 280
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : averageMockScore! >= 220
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      }`}>
                        {!hasMockData ? (
                          <>
                            <CircleDashed className="w-3 h-3" />
                            <span>Not Assessed Yet</span>
                          </>
                        ) : averageMockScore! >= 280 ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Exam Ready</span>
                          </>
                        ) : averageMockScore! >= 220 ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            <span>On Track</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Needs Improvement</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject Contribution Progress Bars */}
                <div className="md:col-span-7 space-y-3.5 pl-0 md:pl-4 md:border-l border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-xs font-semibold text-text-secondary">
                      Subject Contribution
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {subjectBreakdown.filter(s => s.total > 0).length} of 4 assessed
                    </span>
                  </div>

                  {combination.map((sub: string) => {
                    const { icon: SubIcon, bg: subBg } = getSubjectIcon(sub);
                    const stats = getSubjectContrib(sub);
                    return (
                      <div key={sub} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${subBg}`}>
                              <SubIcon className="w-3 h-3" />
                            </div>
                            <span className="font-medium text-text-primary">
                              {getSubjectLabel(sub)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            {stats.tested ? (
                              <>
                                <span className="text-text-muted">{stats.solved} / {stats.total}</span>
                                <span className="font-semibold text-text-primary">{stats.percentage}%</span>
                              </>
                            ) : (
                              <span className="text-text-muted text-[10px]">Not tested yet</span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.tested ? 'bg-primary' : 'bg-transparent'}`}
                            style={{ width: stats.tested ? `${Math.max(4, stats.percentage)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Tip / Banner */}
            <div className="mt-6 p-3 rounded-xl bg-surface-container border border-border flex items-center gap-2.5 text-xs text-text-secondary">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>
                Complete more questions to get a clearer readiness score. Your performance will improve as you practice.
              </span>
            </div>
          </div>

          {/* Right Column (4 Cols): Falke AI Study Assistant */}
          <div className="lg:col-span-4 bg-bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-primary font-display">
                        Falke AI Study Assistant
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        PRO
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
                      Get instant explanations, solve doubts and improve your weak topics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Search / Prompt Bar */}
              <form onSubmit={handleAiPromptSubmit} className="relative mt-2">
                <input
                  type="text"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="Ask a question, explain a topic or get study tips..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-surface-container text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-7 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors"
                  title="Ask Falke AI"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick Prompts */}
              <div className="space-y-2 pt-1">
                <span className="block text-[11px] font-semibold text-text-muted">
                  Quick Prompts
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Explain a concept', icon: Sparkles, q: 'Explain a key concept from JAMB syllabus' },
                    { label: 'Solve a question', icon: FileText, q: 'Solve this difficult UTME question step-by-step' },
                    { label: 'Study plan', icon: Target, q: 'Generate a 14-day intensive UTME study plan' },
                  ].map((chip) => {
                    const ChipIcon = chip.icon;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => navigate(`/falke-ai?prompt=${encodeURIComponent(chip.q)}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-variant text-[11px] font-medium text-text-secondary hover:text-text-primary transition-all active:scale-[0.98]"
                      >
                        <ChipIcon className="w-3 h-3 text-primary" />
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Trust Badge */}
            <div className="pt-4 border-t border-border mt-4 text-[10px] text-text-muted flex items-center justify-center gap-2">
              <span>Powered by Aurikrex AI</span>
              <span>•</span>
              <span>Accurate</span>
              <span>•</span>
              <span>Fast</span>
              <span>•</span>
              <span>Reliable</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. ROW 3: SUBJECT MASTERY & RECENT MOCK PROGRESSION       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 Cols): Subject Mastery Breakdown */}
          <div className="lg:col-span-8 bg-bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Target className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold text-text-primary font-display">
                    Subject Mastery &amp; Target Breakdown
                  </h2>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Your 4 UTME Examination Combination Subjects
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Edit Combination
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/practice')}
                  className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Practice Subjects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 Subject Performance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {combination.map((sub: string) => {
                const isEng = sub === 'english';
                const { icon: SubIcon } = getSubjectIcon(sub);
                const stats = getSubjectContrib(sub);
                return (
                  <div
                    key={sub}
                    className="p-4 rounded-xl border border-border bg-surface-container flex flex-col justify-between space-y-4 hover:border-border-hover transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                          <SubIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono text-text-muted uppercase">
                          {isEng ? 'Compulsory' : 'Elective'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {getSubjectLabel(sub)}
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                        {stats.tested ? `${stats.total} questions answered` : '60 questions target'}
                      </p>

                      <div className="mt-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            !stats.tested
                              ? 'bg-surface-container-high text-text-muted border-border'
                              : stats.percentage >= 70
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : stats.percentage >= 50
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          }`}
                        >
                          {!stats.tested
                            ? 'Not Tested'
                            : stats.percentage >= 70
                            ? 'Mastered'
                            : stats.percentage >= 50
                            ? 'Progressing'
                            : 'Needs Practice'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span>Accuracy</span>
                        <span className="font-mono font-semibold text-text-primary">
                          {stats.tested ? `${stats.percentage}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stats.tested ? 'bg-primary' : 'bg-transparent'}`}
                          style={{ width: stats.tested ? `${Math.max(4, stats.percentage)}%` : '0%' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => openDrill(sub)}
                        className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 pt-1 transition-colors cursor-pointer"
                      >
                        <span>{stats.tested ? 'Practice More' : 'Start Practice'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (4 Cols): Recent Mock Progression */}
          <div className="lg:col-span-4 bg-bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display">
                    Recent Mock Progression
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Last 5 Full-Length CBT Attempts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/results')}
                  className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {hasMockData ? (
                <div className="py-4 space-y-4">
                  <div className="h-32 w-full flex items-end justify-between gap-2 pt-4 px-2 pb-2 bg-surface-container rounded-xl border border-border">
                    {mockResults.slice(-5).map((m, idx, arr) => {
                      const score = Number(m.totalScore || 0);
                      const isLatest = idx === arr.length - 1;
                      const heightPercent = `${Math.min(100, Math.max(15, Math.round((score / 400) * 100)))}%`;
                      return (
                        <div key={m.resultId || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className={`text-[10px] font-mono ${isLatest ? 'text-primary font-bold' : 'text-text-muted'}`}>
                            {score}
                          </span>
                          <div
                            className={`w-full rounded-t-sm ${isLatest ? 'bg-primary' : 'bg-surface-container-high'}`}
                            style={{ height: heightPercent }}
                          />
                          <span className="text-[9px] font-mono text-text-muted">
                            M-0{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Target 320+ Benchmark
                    </span>
                    <span className="font-mono">{mockResults.length} Logged</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">No mock attempts yet</h4>
                    <p className="text-[11px] text-text-muted max-w-[200px] mt-1 leading-normal">
                      Take your first full-length mock exam to start tracking your progress.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/mock-setup')}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Take First Mock Exam →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. ROW 4: TOPIC WEAK SPOTS & LEARNING RESOURCES           */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 Cols): Topic Weak Spots & Priority Revision */}
          <div className="lg:col-span-8 bg-bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-bold text-text-primary font-display">
                    Diagnostic Weak Spots &amp; Priority Revision
                  </h2>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Topics requiring targeted reinforcement based on your attempt telemetry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/study')}
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Full Syllabus Tracker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {weakTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {weakTopics.map((topic) => {
                  const acc = Math.round(Number(topic.accuracy || 0));
                  return (
                    <div
                      key={`${topic.subject}-${topic.topic}`}
                      className="p-4 rounded-xl border border-border bg-surface-container flex flex-col justify-between space-y-3 hover:border-border-hover transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            {getSubjectLabel(topic.subject)}
                          </span>
                          <span className="text-[10px] font-mono text-amber-500 font-semibold">
                            {acc}% Accuracy
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-text-primary line-clamp-1">
                          {topic.topic}
                        </h4>
                        <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                          {topic.total} attempts logged · Deficit detected
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-[11px] text-text-muted">
                          Goal: &ge; 75%
                        </span>
                        <button
                          type="button"
                          onClick={() => openDrill(topic.subject, topic.topic)}
                          className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Drill Topic</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 px-4 rounded-xl bg-surface-container border border-border text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {topicStats.length > 0 ? 'No Critical Weak Spots Detected' : 'No Topic Diagnostic Data Yet'}
                  </h4>
                  <p className="text-xs text-text-muted max-w-md mx-auto mt-1 leading-relaxed">
                    {topicStats.length > 0
                      ? 'All curriculum topics you have attempted show solid retention (&ge; 70%). Keep practicing to maintain your edge.'
                      : 'Complete topic-specific drills or a full mock exam to let the diagnostic engine identify topics for priority revision.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/practice')}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Start a Topic Drill →
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/study')}
                    className="px-4 py-2 rounded-xl border border-border bg-surface-container-high hover:bg-surface-variant text-text-primary text-xs font-semibold transition-all cursor-pointer"
                  >
                    Explore Syllabus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (4 Cols): Your Learning Resources */}
          <div className="lg:col-span-4 bg-bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-text-primary font-display">
                Your Learning Resources
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                Everything you need to stay on track.
              </p>
            </div>

            <div className="space-y-2.5">
              {/* UTME Syllabus */}
              <Link
                to="/study"
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-container hover:border-border-hover hover:bg-surface-variant transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                      UTME Syllabus
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      Track curriculum coverage and key topics.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              {/* Past Questions */}
              <Link
                to="/questions?mode=past"
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-container hover:border-border-hover hover:bg-surface-variant transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                      Past Questions
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      Practice with real JAMB-style questions.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS: COMBINATION & DRILL CONFIGURATION                 */}
      {/* ========================================================= */}

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
                      ? 'border-primary/40 bg-primary/15 text-primary opacity-90'
                      : isSelected
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-surface-container text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{getSubjectLabel(sub)}</span>
                  {isSelected && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs font-mono text-text-muted">
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
              className="w-full p-2.5 rounded-xl border border-border bg-surface-container text-text-primary text-sm outline-none focus:border-primary"
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
                className="w-full p-2.5 rounded-xl border border-border bg-surface-container text-text-primary text-sm outline-none focus:border-primary"
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
                className="w-full p-2.5 rounded-xl border border-border bg-surface-container text-text-primary text-sm outline-none focus:border-primary"
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
    </StudentLayout>
  );
}
