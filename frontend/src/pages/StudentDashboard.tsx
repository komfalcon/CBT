import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe, logout } from '../features/auth/api';
import { getResultsHistory, GradedResultRecord, getTopicStats, TopicStatRecord } from '../features/results/api';
import { getSubjectTopics } from '../features/questions/api';
import { createExamSession } from '../features/exam/api';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Flame,
  Grid3X3,
  History,
  KeyRound,
  LineChart,
  LockKeyhole,
  LogOut,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { AiChatWidget } from '../features/ai/AiChatWidget';
import { Alert, Badge, Button, Card, Modal, SecuritySettings, useToast } from '../components';
import { ThemeToggle } from '../components/ThemeToggle';
import { AVAILABLE_SUBJECTS, getSubjectLabel } from '../constants/subjects';

const classNames = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

function SectionKicker({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs sm:text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">{label}</p>
        {detail && <p className="mt-1 text-xs text-text-secondary">{detail}</p>}
      </div>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  detail,
  action,
  actionLabel,
}: {
  icon: typeof CircleDashed;
  title: string;
  detail: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border-hover bg-bg-secondary/45 px-6 py-7 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-info/25 bg-info/10 text-info shadow-[0_8px_20px_rgba(56,189,248,0.08)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-bold text-text-primary">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-text-secondary">{detail}</p>
      {action && actionLabel && (
        <Button onClick={action} variant="secondary" size="sm" className="mt-4">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const token = '';
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [resultsList, setResultsList] = useState<GradedResultRecord[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStatRecord[]>([]);
  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);
  const [drillSubject, setDrillSubject] = useState('');
  const [drillCount, setDrillCount] = useState(20);
  const [drillDifficulty, setDrillDifficulty] = useState('any');
  const [drillTopics, setDrillTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Array<{ topic: string; count: number }>>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const combination = student?.exam_subject_combination || [];
  const isCombinationValid = combination.length === 4 && combination.includes('english');

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
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
  }, [topicStats]);

  const mockResults = useMemo(() => resultsList.filter((result) => result.type === 'mock'), [resultsList]);
  const averageMockScore = mockResults.length
    ? Math.round(mockResults.reduce((sum, result) => sum + Number(result.totalScore || 0), 0) / mockResults.length)
    : null;
  const drillAverage = resultsList.length
    ? Math.round(resultsList.reduce((sum, result) => sum + Number(result.totalScore || 0), 0) / resultsList.length)
    : 0;
  const readinessScore = Math.max(0, Math.min(100, averageMockScore !== null ? Math.round(averageMockScore / 4) : drillAverage));
  const nextWeakTopic = [...topicStats].sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0))[0];
  const trendValues = useMemo(() => {
    const values = resultsList
      .slice(0, 6)
      .reverse()
      .map((result) => result.type === 'mock' ? Math.round(Number(result.totalScore || 0) / 4) : Math.round(Number(result.totalScore || 0)));
    return values.length ? values : [0, 0, 0, 0, 0, 0];
  }, [resultsList]);
  const trendPoints = trendValues.map((value, index) => `${8 + index * 34},${64 - Math.min(52, Math.max(0, value) * 0.52)}`).join(' ');
  const drillSelectedTopicsCount = availableTopics
    .filter((topic) => drillTopics.includes(topic.topic))
    .reduce((accumulator, topic) => accumulator + topic.count, 0);
  const isDrillShort = drillTopics.length > 0 && drillSelectedTopicsCount < drillCount;

  const openDrill = (subject = nextWeakTopic?.subject || combination.find((item: string) => item !== 'english') || combination[0] || 'physics') => {
    setDrillSubject(subject);
    setDrillCount(20);
    setDrillDifficulty('any');
    setDrillTopics([]);
    setIsDrillModalOpen(true);
  };

  useEffect(() => {
    if (!drillSubject) return;
    setIsLoadingTopics(true);
    setAvailableTopics([]);
    setDrillTopics([]);
    getSubjectTopics(drillSubject)
      .then((topics) => setAvailableTopics(topics))
      .catch((requestError) => console.error('Failed to load topics', requestError))
      .finally(() => setIsLoadingTopics(false));
  }, [drillSubject]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

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

  const verifyPayment = async (reference: string, planCode: string, newTier: string) => {
    try {
      setIsProcessingPayment(true);
      setPaymentError('');
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const response = await fetch(`${apiBase}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reference, planCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment verification failed.');
      setStudent((previous: any) => ({
        ...previous,
        subscription_tier: data.subscription_tier,
        ai_messages_remaining: data.ai_messages_remaining,
      }));
      setPaymentSuccess(`Your ${newTier.toUpperCase()} plan is now active.`);
      setShowUpgradeModal(false);
    } catch (requestError: any) {
      setPaymentError(requestError.message || 'An error occurred while verifying your payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUpgradeClick = (planCode: string, tierName: string) => {
    if (!student) return;
    setPaymentError('');
    setPaymentSuccess('');
    const paystackPop = (window as any).PaystackPop;
    if (!paystackPop) {
      setPaymentError('Checkout is still loading. Please try again in a few seconds.');
      return;
    }
    const handler = paystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: student.email,
      currency: 'NGN',
      plan: planCode,
      channels: ['card'],
      callback: (response: any) => verifyPayment(response.reference, planCode, tierName),
      onClose: () => undefined,
    });
    handler.openIframe();
  };

  const handleStartDrill = async () => {
    if (!drillSubject) return;
    try {
      setLoading(true);
      const session = await createExamSession(token, {
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

  const handleGoToLibrary = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const response = await fetch(`${apiBase}/v1/auth/handoffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          audience: 'library',
          scope: ['profile', 'topic_context', 'return_context'],
          returnUrl: `${window.location.origin}/dashboard`,
          nextPath: '/',
        }),
      });
      if (!response.ok) throw new Error();
      const { handoff } = await response.json();
      const libraryUrl = import.meta.env.VITE_LIBRARY_URL || 'https://library.aurikrex.tech';
      window.open(`${libraryUrl}/sso?handoff=${encodeURIComponent(handoff)}`, '_blank', 'noopener,noreferrer');
    } catch {
      addToast({ type: 'error', title: 'Library unavailable', message: 'We could not open the E-Library. Please try again.' });
    }
  };

  const handleCopyKey = async () => {
    if (!student?.cbt_key) return;
    try {
      await navigator.clipboard.writeText(student.cbt_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ type: 'error', title: 'Copy failed', message: 'Copy the key manually or try again.' });
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

  if (loading && !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-text-secondary">Preparing your study workspace…</p>
        </div>
      </div>
    );
  }

  const maskedKey = student?.cbt_key ? '•'.repeat(Math.max(student.cbt_key.length, 12)) : 'No access key available';
  const initials = student?.fullName
    ? student.fullName.split(' ').map((name: string) => name[0]).join('').slice(0, 2).toUpperCase()
    : 'ST';

  return (
    <div className="student-workspace relative min-h-screen overflow-x-hidden bg-bg-primary font-sans text-text-primary">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_70%_-10%,rgba(91,114,255,0.16),transparent_58%)]" />
      <div className="relative z-10">
        <header className="relative sticky top-0 z-40 border-b border-border bg-bg-primary/88 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 xl:px-8">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="Aurikrex" className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-primary/15" />
              <div className="leading-tight">
                <p className="font-display text-sm font-bold tracking-tight text-text-primary">Student Workspace</p>
                <p className="mt-0.5 text-xs sm:text-[11px] font-medium text-text-muted">Focused UTME preparation</p>
              </div>
            </div>

            <nav className="hidden items-center gap-2 lg:flex" aria-label="Workspace navigation">
              <Button onClick={() => navigate('/exam-hub')} variant="ghost" size="sm">
                <Target className="h-4 w-4" /> Exam Hub
              </Button>
              <Button onClick={() => navigate('/leaderboard')} variant="ghost" size="sm">
                <Award className="h-4 w-4" /> Leaderboard
              </Button>
              <Button onClick={handleGoToLibrary} variant="secondary" size="sm">
                <BookOpen className="h-4 w-4" /> E-Library
              </Button>
              <div className="mx-1 h-5 w-px bg-border" />
              <ThemeToggle className="min-h-11 min-w-11 lg:min-h-0 lg:min-w-0" />
              <Button onClick={handleLogout} variant="ghost" size="sm" aria-label="Log out">
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </nav>

            <div className="relative flex items-center gap-2 lg:hidden">
              <ThemeToggle className="min-h-11 min-w-11 lg:min-h-0 lg:min-w-0" />
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-xl border border-border bg-bg-secondary p-2 text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                onClick={() => setMobileActionsOpen((open) => !open)}
                aria-label="Toggle workspace actions"
                aria-expanded={mobileActionsOpen}
              >
                {mobileActionsOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              {mobileActionsOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(calc(100vw-2rem),18rem)] rounded-2xl border border-border bg-bg-card p-2 shadow-2xl shadow-black/30 lg:hidden">
                  <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Workspace navigation</p>
                  <nav className="grid gap-1" aria-label="Mobile workspace navigation">
                    <button onClick={() => { setMobileActionsOpen(false); navigate('/exam-hub'); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary">
                      <Target className="h-4 w-4" /> Exam Hub
                    </button>
                    <button onClick={() => { setMobileActionsOpen(false); navigate('/leaderboard'); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary">
                      <Award className="h-4 w-4" /> Leaderboard
                    </button>
                    <button onClick={() => { setMobileActionsOpen(false); handleGoToLibrary(); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary">
                      <BookOpen className="h-4 w-4" /> E-Library
                    </button>
                    <button onClick={() => { setMobileActionsOpen(false); handleLogout(); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-6 py-8 xl:px-8 xl:py-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-info">Study dashboard</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-text-primary">Welcome back, {student?.fullName?.split(' ')[0] || 'Student'}.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Choose a focused practice plan, keep an eye on your progress, and prepare with confidence.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-secondary/70 px-3 py-2 text-xs text-text-secondary shadow-sm">
              <CircleDashed className="h-4 w-4 text-info" aria-hidden="true" />
              <span>{resultsList.length ? `${resultsList.length} practice session${resultsList.length === 1 ? '' : 's'} recorded` : 'Your progress begins with one practice session'}</span>
            </div>
          </div>

          {error && <Alert variant="error" className="mb-6 flex items-center gap-2"><CircleAlert className="h-4 w-4" />{error}</Alert>}
          {message && <Alert variant="info" className="mb-6 flex items-center gap-2">{message}</Alert>}
          {!isCombinationValid && (
            <Alert variant="warning" title="Set your subject combination to unlock practice" className="mb-6 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-2xl text-sm leading-6">Use of English plus three electives matching your university course are required before you can start a mock or drill.</p>
                <Button onClick={() => setIsEditModalOpen(true)} size="sm" className="shrink-0">Set combination</Button>
              </div>
            </Alert>
          )}

          <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[340px,minmax(0,1fr)]">
            <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
              <SectionKicker label="Account" detail="Your profile and secure access" />
              <Card className="overflow-hidden border-border bg-bg-card p-0 shadow-[0_16px_36px_rgba(0,0,0,0.16)]">
                <div className="border-b border-border bg-[linear-gradient(145deg,rgba(91,114,255,0.16),rgba(17,29,52,0)_70%)] p-5">
                  <div className="flex flex-col items-start gap-4 xl:flex-row xl:gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-black text-text-on-accent shadow-[0_10px_25px_rgba(91,114,255,0.3)]">{initials}</div>
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words font-display text-base font-bold leading-5 text-text-primary">{student?.fullName}</h2>
                      <p className="mt-1 break-all text-xs leading-5 text-text-secondary">{student?.email}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="info">Candidate</Badge>
                        <Badge variant={student?.subscription_tier === 'max' ? 'ai-flag' : student?.subscription_tier === 'pro' ? 'success' : student?.subscription_tier === 'plus' ? 'primary' : 'draft'}>
                          {student?.subscription_tier || 'Free'} plan
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 divide-y divide-border px-2 py-3 text-center xl:grid-cols-3 xl:divide-x xl:divide-y-0 xl:py-4">
                  <div className="py-2 xl:py-0">
                    <p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wide text-text-muted">Level</p>
                    <p className="mt-1 text-sm font-black text-text-primary">{student?.level || 1}</p>
                  </div>
                  <div className="py-2 xl:py-0">
                    <p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wide text-text-muted">Points</p>
                    <p className="mt-1 text-sm font-black text-text-primary">{student?.xp_points || 0}</p>
                  </div>
                  <div className="py-2 xl:py-0">
                    <p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wide text-text-muted">Streak</p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-sm font-black text-streak"><Flame className="h-3.5 w-3.5" />{student?.streak_count || 0}</p>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  {student?.subscription_tier === 'max' ? (
                    <div className="rounded-xl border border-ai-flag/25 bg-ai-flag/10 px-3 py-2.5 text-xs leading-5 text-text-secondary"><span className="font-bold text-ai-flag">Max plan active.</span> You have access to the complete study toolkit.</div>
                  ) : (
                    <Button onClick={() => setShowUpgradeModal(true)} variant="gradient" fullWidth size="sm"><CreditCard className="h-4 w-4" />Explore plans</Button>
                  )}
                </div>
              </Card>

              <Card variant="secondary" className="border-border p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><KeyRound className="h-4 w-4" /></div>
                    <div>
                      <h2 className="text-sm font-bold text-text-primary">CBT access key</h2>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">For trusted cafe terminals and CBT halls. Keep it private.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-bg-primary px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs tracking-[0.18em] text-text-primary" aria-label={showAccessKey ? 'CBT access key shown' : 'CBT access key hidden'}>{showAccessKey ? student?.cbt_key || '—' : maskedKey}</span>
                  <button type="button" onClick={() => setShowAccessKey((shown) => !shown)} className="min-h-11 min-w-11 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary" aria-label={showAccessKey ? 'Hide CBT access key' : 'Reveal CBT access key'} title={showAccessKey ? 'Hide key' : 'Reveal key'}>
                    {showAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={handleCopyKey} className="min-h-11 min-w-11 rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary" aria-label={copied ? 'CBT access key copied' : 'Copy CBT access key'} title="Copy key">
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 min-h-4 text-xs sm:text-[11px] text-success" aria-live="polite">{copied ? 'Access key copied securely.' : ''}</p>
              </Card>

              <SecuritySettings token={token} mfaEnabled={student?.mfa_enabled || false} onUpdate={() => fetchProfileAndHistory()} />
            </aside>

            <div className="min-w-0 space-y-8">
              <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[#101d38] p-6 shadow-[0_24px_54px_rgba(0,0,0,0.24)] xl:p-7">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-12 h-28 w-28 rounded-full border border-info/20" />
                <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2 text-xs sm:text-[11px] font-bold uppercase tracking-[0.16em] text-info"><TrendingUp className="h-4 w-4" />Preparation outlook</div>
                    <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white">Build readiness one focused session at a time.</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{nextWeakTopic ? `Your next opportunity is ${nextWeakTopic.topic}. A short, targeted drill can turn a weak area into a confident one.` : 'Complete a practice session to reveal a personalized readiness signal and your next area of focus.'}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-info/25 bg-info/10 px-3 py-1.5 text-xs font-medium text-info">{nextWeakTopic ? `Focus: ${nextWeakTopic.topic}` : 'Focus: establish a baseline'}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">Target UTME score: 300+</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4 backdrop-blur-sm">
                    <div className="text-right">
                      <p className="text-xs sm:text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Readiness</p>
                      <p className="mt-1 font-display text-3xl font-black text-white">{readinessScore}<span className="text-base font-semibold text-slate-400">/100</span></p>
                    </div>
                    <Button onClick={() => openDrill()} disabled={!isCombinationValid} className="whitespace-nowrap"><Zap className="h-4 w-4" />Start a drill</Button>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <SectionKicker label="Practice" detail="Choose the type of preparation that fits your next study block" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card hoverable className="mock-exam-card relative overflow-hidden border-primary/30 p-6 shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/15 text-primary"><Play className="h-5 w-5" /></div>
                      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Full simulation</p>
                      <h3 className="mt-2 font-display text-xl font-bold text-text-primary">Mock exam</h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">A realistic 180-question exam with the timing and structure of the UTME experience.</p>
                      <div className="mt-6"><Button onClick={() => navigate('/mock-setup')} disabled={!isCombinationValid} className="w-full lg:w-auto"><Play className="h-4 w-4" />Start mock exam</Button></div>
                    </div>
                  </Card>
                  <Card hoverable className="border-border bg-bg-card p-6 shadow-[0_14px_30px_rgba(0,0,0,0.12)]">
                    <div className="flex h-full flex-col">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-info/25 bg-info/10 text-info"><Target className="h-5 w-5" /></div>
                      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-info">Targeted practice</p>
                      <h3 className="mt-2 font-display text-xl font-bold text-text-primary">Subject drill</h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">Choose a subject, topic, question count, and difficulty to practice with immediate feedback.</p>
                      <div className="mt-6"><Button onClick={() => openDrill()} disabled={!isCombinationValid} variant="secondary" className="w-full lg:w-auto"><Target className="h-4 w-4" />Configure drill</Button></div>
                    </div>
                  </Card>
                </div>
              </section>

              <section className="space-y-4">
                <SectionKicker label="Exam setup" detail="The subjects that shape your personalized mock and drill experience" />
                <Card className="border-border p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><Grid3X3 className="h-4 w-4" /></div>
                      <div><h2 className="text-sm font-bold text-text-primary">Your subject combination</h2><p className="mt-0.5 text-xs text-text-secondary">Use of English plus three electives</p></div>
                    </div>
                    <Button onClick={() => setIsEditModalOpen(true)} variant="ghost" size="sm">{isCombinationValid ? 'Edit' : 'Set up'}<ChevronRight className="h-3.5 w-3.5" /></Button>
                  </div>
                  {isCombinationValid ? (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {combination.map((subject: string) => (
                        <div key={subject} className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary/65 px-3 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs sm:text-[10px] font-black text-primary">{subject.slice(0, 3).toUpperCase()}</div>
                          <p className="min-w-0 truncate text-xs font-semibold text-text-primary" title={getSubjectLabel(subject)}>{getSubjectLabel(subject)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel icon={Grid3X3} title="Your practice plan needs four subjects" detail="Set up Use of English and three electives to unlock mock exams and custom drills." action={() => setIsEditModalOpen(true)} actionLabel="Set combination" />
                  )}
                </Card>
              </section>

              <section className="space-y-4">
                <SectionKicker label="Performance" detail="A concise view of your readiness, recent work, and subject-level progress" />
                <div className="grid gap-4 xl:grid-cols-[1.12fr,0.88fr]">
                  <Card className="border-border p-6 shadow-[0_14px_30px_rgba(0,0,0,0.12)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-info/25 bg-info/10 text-info"><LineChart className="h-4 w-4" /></div><div><h2 className="text-sm font-bold text-text-primary">Performance overview</h2><p className="mt-0.5 text-xs text-text-secondary">Your session trend and readiness signal</p></div></div>
                      <span className="rounded-full bg-info/10 px-2.5 py-1 text-xs sm:text-[10px] font-bold uppercase tracking-[0.12em] text-info">{resultsList.length ? 'Live data' : 'Baseline'}</span>
                    </div>
                    <div className="mt-6 grid min-w-0 items-center gap-5 sm:grid-cols-[112px,minmax(0,1fr)]">
                      <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-accent-info) ${readinessScore * 3.6}deg, rgba(148, 163, 184, 0.16) 0deg)` }} aria-label={`Readiness score: ${readinessScore} out of 100`} role="img">
                        <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-bg-card"><span className="font-display text-2xl font-black text-text-primary">{readinessScore}</span><span className="text-xs sm:text-[10px] font-bold uppercase tracking-wide text-text-muted">ready</span></div>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-text-primary">Session trend</p><p className="text-xs sm:text-[11px] text-text-muted">Last {trendValues.length} sessions</p></div>
                        <div className="h-20 min-w-0 overflow-hidden rounded-xl border border-border bg-bg-secondary/55 px-2 py-2">
                          <svg viewBox="0 0 190 72" className="h-full w-full" preserveAspectRatio="none" aria-label="Practice score trend" role="img">
                            <line x1="8" x2="178" y1="64" y2="64" stroke="currentColor" className="text-text-muted" strokeOpacity="0.22" strokeWidth="1" />
                            <line x1="8" x2="178" y1="36" y2="36" stroke="currentColor" className="text-text-muted" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 4" />
                            <polyline points={trendPoints} fill="none" stroke="var(--color-accent-info)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={resultsList.length ? undefined : '5 5'} />
                            {trendValues.map((value, index) => <circle key={`${value}-${index}`} cx={8 + index * 34} cy={64 - Math.min(52, Math.max(0, value) * 0.52)} r="3" fill="var(--color-bg-card)" stroke="var(--color-accent-info)" strokeWidth="2" />)}
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-bg-secondary/45 py-1 text-center xl:grid-cols-3 xl:divide-x xl:divide-y-0 xl:py-3">
                      <div className="py-2 xl:py-0"><p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wide text-text-muted">Sessions</p><p className="mt-1 text-lg font-black text-text-primary">{resultsList.length}</p></div>
                      <div className="py-2 xl:py-0"><p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wide text-text-muted">Mock average</p><p className="mt-1 text-lg font-black text-primary">{averageMockScore ?? '—'}</p></div>
                      <div className="py-2 xl:py-0"><p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wide text-text-muted">Streak</p><p className="mt-1 text-lg font-black text-streak">{student?.streak_count || 0}d</p></div>
                    </div>
                    {!resultsList.length && <p className="mt-4 text-center text-xs leading-5 text-text-secondary">Your first completed session will turn this baseline into a personalized trend.</p>}
                  </Card>

                  <Card className="border-border p-6 shadow-sm">
                    <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><BarChart3 className="h-4 w-4" /></div><div><h2 className="text-sm font-bold text-text-primary">Subject breakdown</h2><p className="mt-0.5 text-xs text-text-secondary">Accuracy across the topics you have practiced</p></div></div>
                    {subjectBreakdown.length ? (
                      <div className="mt-6 space-y-4">
                        {subjectBreakdown.map((subject) => (
                          <div key={subject.subject}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-text-primary">{getSubjectLabel(subject.subject)}</span><span className={classNames('font-bold tabular-nums', subject.accuracy >= 70 ? 'text-success' : subject.accuracy >= 40 ? 'text-warning' : 'text-error')}>{subject.accuracy}%</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-bg-secondary"><div className={classNames('h-full rounded-full transition-[width] duration-500', subject.accuracy >= 70 ? 'bg-success' : subject.accuracy >= 40 ? 'bg-warning' : 'bg-error')} style={{ width: `${subject.accuracy}%` }} /></div>
                            <p className="mt-1 text-xs sm:text-[11px] text-text-muted">{subject.correct} of {subject.total} correct</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyPanel icon={BarChart3} title="Your subject breakdown will appear here" detail="Complete a drill or mock exam to see the topics that need more attention." action={() => openDrill()} actionLabel="Start a drill" />
                    )}
                  </Card>
                </div>
              </section>

              <section className="space-y-4 pb-8">
                <SectionKicker label="Review" detail="Return to a completed practice session when you are ready to learn from it" />
                <Card className="border-border p-6 shadow-sm">
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><History className="h-4 w-4" /></div><div><h2 className="text-sm font-bold text-text-primary">Recent attempts</h2><p className="mt-0.5 text-xs text-text-secondary">Review answers, scores, and feedback from your latest sessions</p></div></div>
                  {resultsList.length ? (
                    <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-bg-secondary/35">
                      {resultsList.slice(0, 5).map((result) => (
                        <div key={result.resultId || (result as any).id} className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-bg-secondary sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3"><div className={classNames('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', result.type === 'mock' ? 'border-primary/25 bg-primary/10 text-primary' : 'border-info/25 bg-info/10 text-info')}><Play className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-text-primary">{result.type === 'mock' ? 'Mock exam' : 'Subject drill'}</p><p className="mt-0.5 text-xs text-text-secondary">{new Date(result.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(result.completedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p></div></div>
                          <div className="flex items-center justify-between gap-4 sm:justify-end"><div className="text-left sm:text-right"><p className="text-sm font-black text-text-primary">{result.type === 'mock' ? result.totalScore : `${result.totalScore}%`}</p><p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wide text-text-muted">{result.type === 'mock' ? 'score' : 'accuracy'}</p></div><Button onClick={() => navigate(`/results/${result.resultId || (result as any).id}`)} variant="secondary" size="sm">Review</Button></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5"><EmptyPanel icon={History} title="No completed attempts yet" detail="Your completed mocks and drills will be saved here for review." action={() => openDrill()} actionLabel="Start a drill" /></div>
                  )}
                </Card>
              </section>
            </div>
          </div>
        </main>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Set your subject combination" maxWidth="xl">
        <div className="space-y-6">
          <p className="text-sm leading-6 text-text-secondary">Use of English is required. Select three electives to complete your four-subject UTME combination.</p>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 p-3 text-text-primary"><Check className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Use of English <span className="font-normal text-text-secondary">(required)</span></span></div>
            {AVAILABLE_SUBJECTS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject);
              return (
                <button key={subject} type="button" onClick={() => handleToggleSubject(subject)} className={classNames('flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.99]', isSelected ? 'border-primary bg-primary/10 text-text-primary' : 'border-border bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary')} aria-pressed={isSelected}>
                  <span className={classNames('flex h-4 w-4 items-center justify-center rounded border text-xs sm:text-[10px] font-black', isSelected ? 'border-primary bg-primary text-text-on-accent' : 'border-border bg-bg-primary')}>{isSelected && '✓'}</span>
                  <span className="font-medium">{getSubjectLabel(subject)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-secondary">Selected: <strong className="text-primary">{selectedSubjects.filter((subject) => subject !== 'english').length + 1} of 4</strong> subjects</p>
            <div className="flex gap-2"><Button onClick={() => setIsEditModalOpen(false)} variant="secondary" size="sm">Cancel</Button><Button onClick={handleSaveCombination} size="sm">Save combination</Button></div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDrillModalOpen} onClose={() => setIsDrillModalOpen(false)} title="Configure a subject drill" maxWidth="sm">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5"><label htmlFor="drill-subject" className="text-xs font-bold uppercase tracking-wide text-text-secondary">Subject</label><select id="drill-subject" value={drillSubject} onChange={(event) => setDrillSubject(event.target.value)} className="w-full rounded-xl border border-border bg-bg-secondary p-3 text-sm text-text-primary transition-colors"><option value="" disabled>Select a subject</option>{combination.map((subject: string) => <option key={subject} value={subject}>{getSubjectLabel(subject)}</option>)}</select></div>
            <div className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-text-secondary">Question count</span><div className="grid grid-cols-3 gap-2">{[10, 20, 40].map((count) => <button key={count} type="button" onClick={() => setDrillCount(count)} className={classNames('rounded-xl border p-3 text-xs font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98]', drillCount === count ? 'border-primary bg-primary/10 text-text-primary' : 'border-border bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary')} aria-pressed={drillCount === count}>{count} questions</button>)}</div></div>
            <div className="space-y-1.5"><label htmlFor="drill-difficulty" className="text-xs font-bold uppercase tracking-wide text-text-secondary">Difficulty</label><select id="drill-difficulty" value={drillDifficulty} onChange={(event) => setDrillDifficulty(event.target.value)} className="w-full rounded-xl border border-border bg-bg-secondary p-3 text-sm text-text-primary transition-colors"><option value="any">Any difficulty</option><option value="1">Easy</option><option value="2">Easy–medium</option><option value="3">Medium</option><option value="4">Medium–hard</option><option value="5">Hard</option></select></div>
            <div className="space-y-2"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-text-secondary">Topics <span className="font-normal normal-case">(optional)</span></span>{availableTopics.length > 0 && <button type="button" onClick={() => { const random = availableTopics[Math.floor(Math.random() * availableTopics.length)]; setDrillTopics([random.topic]); }} className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 text-xs sm:text-[11px] font-bold text-primary transition-colors hover:bg-primary/15"><Sparkles className="h-3 w-3" />Choose one for me</button>}</div><div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-border bg-bg-secondary p-2">{isLoadingTopics ? <div className="p-2 text-xs text-text-muted">Loading topics…</div> : availableTopics.length === 0 ? <div className="p-2 text-xs text-text-muted">No specific topics are available for this subject.</div> : availableTopics.map((topic) => <label key={topic.topic} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-xs text-text-primary transition-colors hover:bg-bg-primary"><input type="checkbox" checked={drillTopics.includes(topic.topic)} onChange={(event) => setDrillTopics((previous) => event.target.checked ? [...previous, topic.topic] : previous.filter((item) => item !== topic.topic))} className="rounded border-border text-primary focus:ring-primary" /><span className="flex-1">{topic.topic}</span><span className="text-text-muted">{topic.count}</span></label>)}</div>{isDrillShort && <p className="text-xs text-warning">Selected topics have fewer than {drillCount} available questions; the drill may contain fewer questions.</p>}</div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4"><Button onClick={() => setIsDrillModalOpen(false)} variant="secondary" size="sm">Cancel</Button><Button onClick={handleStartDrill} disabled={!drillSubject} size="sm"><Zap className="h-4 w-4" />Start drill</Button></div>
        </div>
      </Modal>

      <Modal isOpen={!!paymentSuccess} onClose={() => setPaymentSuccess('')} title="Plan updated" maxWidth="sm">
        <div className="space-y-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-success/25 bg-success/10 text-success"><Check className="h-6 w-6" /></div><div><h3 className="font-display text-lg font-bold text-text-primary">Payment confirmed</h3><p className="mt-2 text-sm leading-6 text-text-secondary">{paymentSuccess}</p></div><Button onClick={() => setPaymentSuccess('')} fullWidth>Continue studying</Button></div>
      </Modal>

      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Choose a study plan" maxWidth="4xl">
        <div className="space-y-6"><p className="mx-auto max-w-xl text-center text-sm leading-6 text-text-secondary">Unlock more mocks, detailed reviews, targeted drills, and FalkeAI tutoring as your preparation needs grow.</p>{paymentError && <Alert variant="error" className="flex items-center gap-2">{paymentError}</Alert>}<div className="grid gap-4 md:grid-cols-3">
          {[
            { name: 'Plus', price: '₦3,500', plan: 'PLN_3pu5sd2pl33k7qw', summary: 'Core mock practice', features: ['1 full mock each day', 'Detailed score reviews', 'CBT access key'], icon: Zap, tone: 'primary' },
            { name: 'Pro', price: '₦6,000', plan: 'PLN_yzw49g99ybur0c1', summary: 'More depth and flexibility', features: ['2 full mocks each day', 'Subject-specific drills', 'Detailed score reviews'], icon: Award, tone: 'info', featured: true },
            { name: 'Max', price: '₦10,000', plan: 'PLN_kbpykg9tm67n6yv', summary: 'Complete preparation suite', features: ['Unlimited mock exams', 'Advanced performance review', 'FalkeAI tutor access'], icon: Brain, tone: 'ai-flag' },
          ].map((plan) => {
            const Icon = plan.icon;
            return <div key={plan.name} className={classNames('relative flex flex-col rounded-2xl border bg-bg-secondary/50 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1', plan.featured ? 'border-primary/55 shadow-[0_12px_28px_rgba(91,114,255,0.12)]' : 'border-border')}>
              {plan.featured && <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-1 text-xs sm:text-[10px] font-bold uppercase tracking-wide text-primary">Popular</span>}
              <div className={classNames('flex h-9 w-9 items-center justify-center rounded-xl border', plan.tone === 'ai-flag' ? 'border-ai-flag/30 bg-ai-flag/10 text-ai-flag' : plan.tone === 'info' ? 'border-info/30 bg-info/10 text-info' : 'border-primary/30 bg-primary/10 text-primary')}><Icon className="h-4 w-4" /></div>
              <p className="mt-4 text-base font-bold text-text-primary">{plan.name}</p><p className="mt-1 text-xs text-text-secondary">{plan.summary}</p><p className="mt-5 font-display text-2xl font-black text-text-primary">{plan.price}<span className="ml-1 font-body text-xs font-medium text-text-muted">/month</span></p>
              <ul className="mt-5 space-y-2 border-t border-border pt-4 text-xs leading-5 text-text-secondary">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />{feature}</li>)}</ul>
              <Button onClick={() => handleUpgradeClick(plan.plan, plan.name.toLowerCase())} disabled={isProcessingPayment} variant={plan.featured ? 'gradient' : 'secondary'} fullWidth size="sm" className="mt-6">{isProcessingPayment ? 'Processing…' : `Choose ${plan.name}`}</Button>
            </div>;
          })}
        </div></div>
      </Modal>

      <AiChatWidget />
    </div>
  );
}
