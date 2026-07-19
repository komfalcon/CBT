import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe } from '../features/auth/api';
import { getResultsHistory, GradedResultRecord, getTopicStats, TopicStatRecord } from '../features/results/api';
import { getSubjectTopics, getQuestionSubjects } from '../features/questions/api';
import { createExamSession } from '../features/exam/api';
import {
  User,
  BookOpen,
  Award,
  Zap,
  Copy,
  Check,
  Play,
  LogOut,
  AlertTriangle,
  Grid,
  CheckCircle2,
  History,
  Target,
  ArrowRight,
  CreditCard,
  Sparkles,
  Brain,
  X,
} from 'lucide-react';
import { AiChatWidget } from '../features/ai/AiChatWidget';
import { Button, Card, Modal, Alert, Badge } from '../components';
import { ThemeToggle } from '../components/ThemeToggle';
import { useToast } from '../components';

const SUBJECT_LABELS: Record<string, string> = {
  english: 'Use of English (Compulsory)',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  geography: 'Geography',
  economics: 'Economics',
  government: 'Government',
  literature: 'Literature in English',
  commerce: 'Commerce',
  accounting: 'Principles of Accounts',
  agriculture: 'Agricultural Science',
  civic_education: 'Civic Education',
  crk: 'Christian Religious Knowledge',
  irk: 'Islamic Religious Knowledge',
  history: 'History',
  further_mathematics: 'Further Mathematics',
};

const AVAILABLE_SUBJECTS = Object.keys(SUBJECT_LABELS).filter((s) => s !== 'english');

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [token, setToken] = useState<string>('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');

  // Results & drills states
  const [resultsList, setResultsList] = useState<GradedResultRecord[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStatRecord[]>([]);
  // Drill modal state
  const [isDrillModalOpen, setIsDrillModalOpen] = useState<boolean>(false);
  const [drillSubject, setDrillSubject] = useState<string>('');
  const [drillCount, setDrillCount] = useState<number>(20);
  const [drillDifficulty, setDrillDifficulty] = useState<string>('any');
  const [drillTopics, setDrillTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Array<{ topic: string, count: number }>>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  // Mock route launcher
  const handleNavigateMockSetup = () => {
    navigate('/mock-setup');
  };
  // All subjects from DB
  const [allSubjects, setAllSubjects] = useState<string[]>([]);

  // Fetch topics when drill subject changes
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



  // Paystack & Subscription states
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<string>('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const verifyPayment = async (reference: string, planCode: string, newTier: string) => {
    try {
      setIsProcessingPayment(true);
      setPaymentError('');
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const response = await fetch(`${apiBase}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ reference, planCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Payment verification failed.');
      }

      setStudent((prev: any) => ({
        ...prev,
        subscription_tier: data.subscription_tier,
        ai_messages_remaining: data.ai_messages_remaining,
      }));

      setPaymentSuccess(`Successfully upgraded to the ${newTier.toUpperCase()} plan!`);
      setShowUpgradeModal(false);
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred during payment verification.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUpgradeClick = (planCode: string, amount: number, tierName: string) => {
    if (!student) return;

    setPaymentError('');
    setPaymentSuccess('');

    const paystackPop = (window as any).PaystackPop;
    if (!paystackPop) {
      setPaymentError('Paystack checkout is loading. Please try again in a few seconds.');
      return;
    }

    const handler = paystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_068536d7f4bbe687175bcda53e3f5d116fea99dc',
      email: student.email,
      currency: 'NGN',
      plan: planCode,
      channels: ['card'],
      callback: (response: any) => {
        verifyPayment(response.reference, planCode, tierName);
      },
      onClose: () => {
        // Payment closed
      }
    });

    handler.openIframe();
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (!savedToken) {
      navigate('/auth?mode=login');
      return;
    }
    setToken(savedToken);
    fetchProfileAndHistory(savedToken);
  }, [navigate]);

  const fetchProfileAndHistory = async (authToken: string) => {
    setLoading(true);
    try {
      const profile = await getMe(authToken);
      setStudent(profile);
      setSelectedSubjects(profile.exam_subject_combination || ['english']);

      const history = await getResultsHistory(authToken);
      setResultsList(history);

      const stats = await getTopicStats(authToken);
      setTopicStats(stats);
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/auth?mode=login');
      } else {
        setError('Failed to load your profile. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
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
        topics: drillTopics.length > 0 ? drillTopics : undefined,
      });
      if (session.warnings && session.warnings.length > 0) {
        session.warnings.forEach(w => addToast({ type: 'info', title: 'Notice', message: w }));
      }
      setIsDrillModalOpen(false);
      navigate(`/exam/${session.sessionId}`);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Drill Failed',
        message: err.response?.data?.message || 'Failed to initialize subject drill.',
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/auth?mode=login');
  };

  const handleCopyKey = () => {
    if (!student?.cbt_key) return;
    navigator.clipboard.writeText(student.cbt_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subject)) {
        return prev.filter((s) => s !== subject);
      } else {
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, subject];
      }
    });
  };

  const handleSaveCombination = async () => {
    const updatedCombination = ['english', ...selectedSubjects.filter((s) => s !== 'english')];
    if (updatedCombination.length !== 4) {
      setMessage('You must select exactly 3 elective subjects plus English.');
      return;
    }

    try {
      setLoading(true);
      const data = await updateMe(token, { exam_subject_combination: updatedCombination });
      setStudent(data);
      setMessage('Subject combination updated successfully.');
      setIsEditModalOpen(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update combination.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !student) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
          <p className="text-sm text-slate-400">Loading student profile...</p>
        </div>
      </div>
    );
  }

  const combination = student?.exam_subject_combination || [];
  const isCombinationValid = combination.length === 4 && combination.includes('english');

  const drillSelectedTopicsCount = availableTopics
    .filter(t => drillTopics.includes(t.topic))
    .reduce((acc, t) => acc + t.count, 0);
  const isDrillShort = drillTopics.length > 0 && drillSelectedTopicsCount < drillCount;



  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans overflow-auto relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-text-on-accent">
              CBT
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Student Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-6">
          <Card className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center font-bold text-2xl text-text-on-accent shadow-xl shadow-primary/20">
                {student?.fullName ? student.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{student?.fullName}</h2>
                <p className="text-xs text-text-secondary">{student?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="info">
                    UTME Candidate
                  </Badge>
                  <Badge variant={
                    student?.subscription_tier === 'max' ? 'ai-flag' :
                      student?.subscription_tier === 'pro' ? 'success' :
                        student?.subscription_tier === 'plus' ? 'primary' : 'draft'
                  }>
                    {student?.subscription_tier || 'Free'} Plan
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <div>
                <div className="text-xs text-text-secondary font-semibold">Level</div>
                <div className="text-sm font-bold text-primary">{student?.level || 1}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary font-semibold">XP Points</div>
                <div className="text-sm font-bold text-primary">{student?.xp_points || 0} XP</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary font-semibold">Streak</div>
                <div className="text-sm font-bold text-pink-400">{student?.streak_count || 0} days</div>
              </div>
            </div>

            {student?.subscription_tier === 'max' ? (
              <div className="mt-5 rounded-xl border border-border bg-bg-secondary p-3 text-center">
                <p className="text-xs text-text-secondary">You're on the <span className="font-bold text-primary">MAX plan</span> — the highest tier.</p>
                <a
                  href="/contact"
                  className="mt-1 inline-block text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Contact support for custom limits
                </a>
              </div>
            ) : (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                variant="gradient"
                fullWidth
                className="mt-5"
              >
                <CreditCard className="h-4 w-4" />
                Upgrade Subscription Plan
              </Button>
            )}
          </Card>

          <Card variant="secondary" className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">Cafe Roaming CBT Access Key</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Use this key to sign in quickly at cafe terminals or CBT training halls without inputting your password. Keep this key secure.
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-bg-primary border border-border p-3">
              <span className="font-mono text-sm tracking-wider text-primary select-all flex-1">
                {student?.cbt_key}
              </span>
              <button
                onClick={handleCopyKey}
                className="p-1.5 rounded-lg bg-bg-secondary border border-border hover:bg-bg-secondary/80 hover:text-text-primary transition-colors"
                title="Copy CBT Key"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-text-secondary" />}
              </button>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {message && (
            <Alert variant="info" className="p-4 flex items-center gap-2">
              {message}
            </Alert>
          )}

          {!isCombinationValid && (
            <Alert variant="warning" title="Complete Your Subject Combination First!" className="p-6">
              <div className="space-y-3">
                <p>
                  JAMB UTME mandates that you register English Language and 3 elective subjects matching your chosen university course. Set this up to enable practice launchers.
                </p>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  size="sm"
                >
                  Set Combination Now
                </Button>
              </div>
            </Alert>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Your Subject Combination</h3>
              </div>
              {isCombinationValid && (
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-primary hover:text-primary-hover"
                >
                  Change
                </Button>
              )}
            </div>

            {isCombinationValid ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {combination.map((sub: string) => (
                  <div
                    key={sub}
                    className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary p-4"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                      {sub.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-primary">{SUBJECT_LABELS[sub] || sub}</div>
                      <div className="text-xs text-text-muted">JAMB UTME Syllabus</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted py-4 text-center">No subject combination configured.</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Play className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">UTME Practice Center</h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg-secondary p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-text-primary mb-2">4-Subject Mock Exam</h4>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    Full computer-based simulation mirroring the 180 questions and strict countdown timer of the JAMB UTME exam.
                  </p>
                </div>
                <Button
                  disabled={!isCombinationValid}
                  onClick={handleNavigateMockSetup}
                  variant="gradient"
                  className="w-full mt-4"
                >
                  Start Simulation Mock
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-bg-secondary p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-text-primary mb-2">Single Subject Drills</h4>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    Focus on individual areas. Practice 10, 20, or 40 questions at your own speed with instant feedback.
                  </p>
                </div>
                <Button
                  disabled={!isCombinationValid}
                  onClick={() => {
                    const firstSub = combination[0] || '';
                    setDrillSubject(firstSub);
                    setDrillCount(20);
                    setDrillDifficulty('any');
                    setDrillTopics([]);
                    setIsDrillModalOpen(true);
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Configure Subject Drill
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">UTME Performance Overview</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-bg-secondary p-4 border border-border text-center">
                <div className="text-xs text-text-secondary">Total Exams Completed</div>
                <div className="text-2xl font-black text-text-primary mt-1">
                  {resultsList.length}
                </div>
                <span className="text-[10px] text-text-muted">Practice makes perfect</span>
              </div>
              <div className="rounded-xl bg-bg-secondary p-4 border border-border text-center">
                <div className="text-xs text-text-secondary">Average UTME Score</div>
                <div className="text-2xl font-black text-primary mt-1">
                  {resultsList.filter((r) => r.type === 'mock').length > 0
                    ? Math.round(
                      resultsList
                        .filter((r) => r.type === 'mock')
                        .reduce((acc, r) => acc + r.totalScore, 0) /
                      resultsList.filter((r) => r.type === 'mock').length,
                    )
                    : 'N/A'}
                </div>
                <span className="text-[10px] text-text-muted">Target score is 300+</span>
              </div>
              <div className="rounded-xl bg-bg-secondary p-4 border border-border text-center">
                <div className="text-xs text-text-secondary">Streak Count</div>
                <div className="text-2xl font-black text-pink-400 mt-1">
                  {student?.streak_count || 0} days
                </div>
                <span className="text-[10px] text-text-muted">Consecutive days practice</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">Recent Attempts History</h3>
            </div>
            {resultsList.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resultsList.map((res) => (
                  <div
                    key={res.resultId}
                    className="flex justify-between items-center rounded-xl border border-border bg-bg-secondary p-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        {res.type === 'mock' ? '4-Subject Mock' : 'Single Subject Drill'}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 font-medium">
                        {new Date(res.completedAt).toLocaleDateString()} at{' '}
                        {new Date(res.completedAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">
                          {res.type === 'mock' ? res.totalScore : `${res.totalScore}%`}
                        </span>
                        <span className="text-[10px] text-text-muted block font-medium">
                          {res.type === 'mock' ? 'score' : 'accuracy'}
                        </span>
                      </div>
                      <Button
                        onClick={() => navigate(`/results/${res.resultId}`)}
                        variant="secondary"
                        size="sm"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-4">
                No past attempts history detected. Complete your combination to start practicing.
              </p>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">Cumulative Topic Stats</h3>
            </div>
            {topicStats.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {topicStats.map((stat, i) => (
                  <div key={i} className="flex justify-between items-center rounded-xl border border-border bg-bg-secondary p-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-xs font-bold text-text-primary truncate" title={stat.topic}>
                        {stat.topic}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {SUBJECT_LABELS[stat.subject] || stat.subject}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-text-primary">
                          {stat.correct} / {stat.total}
                        </div>
                        <div className="text-[9px] text-text-muted uppercase">Correct</div>
                      </div>
                      <div className="w-12 text-right">
                        <span className={`text-sm font-black ${stat.accuracy >= 70 ? 'text-success' : stat.accuracy >= 40 ? 'text-warning' : 'text-danger'}`}>
                          {Math.round(stat.accuracy)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-4">
                Keep practicing to generate topic performance statistics.
              </p>
            )}
          </Card>
        </div>
      </main>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Select Your Subject Combination"
        maxWidth="xl"
      >
        <div className="space-y-6">
          <p className="text-xs text-text-secondary leading-relaxed">
            Every candidate must sit for Use of English. You must select **exactly three (3) elective subjects** to complete your JAMB combination.
          </p>

          <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1">
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 select-none opacity-80">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-text-primary">Use of English (Compulsory)</span>
            </div>

            {AVAILABLE_SUBJECTS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject);
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleToggleSubject(subject)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${isSelected
                    ? 'border-primary bg-primary/10 text-text-primary'
                    : 'border-border bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary'
                    }`}
                >
                  <span
                    className={`h-4 w-4 rounded flex items-center justify-center border text-[10px] font-bold ${isSelected ? 'border-primary bg-primary text-text-on-accent' : 'border-border bg-bg-primary'
                      }`}
                  >
                    {isSelected && '✓'}
                  </span>
                  <span className="text-sm font-medium">{SUBJECT_LABELS[subject]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-text-secondary">
              Selected: <strong className="text-primary">{selectedSubjects.filter((s) => s !== 'english').length + 1} / 4</strong> (Needs exactly 4)
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditModalOpen(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCombination}
                size="sm"
              >
                Save Selection
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDrillModalOpen}
        onClose={() => setIsDrillModalOpen(false)}
        title="Configure Subject Drill"
        maxWidth="sm"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-secondary">Select Subject</label>
              <select
                value={drillSubject}
                onChange={(e) => setDrillSubject(e.target.value)}
                className="w-full rounded-xl bg-bg-secondary border border-border p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
              >
                {combination.map((sub: string) => (
                  <option key={sub} value={sub}>
                    {SUBJECT_LABELS[sub] || sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-secondary">Questions Count</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 40].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDrillCount(c)}
                    className={`rounded-xl border p-3 text-xs font-bold transition-all ${drillCount === c
                      ? 'border-primary bg-primary/10 text-text-primary'
                      : 'border-border bg-bg-secondary text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    {c} Qs
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-secondary">Difficulty</label>
              <select
                value={drillDifficulty}
                onChange={(e) => setDrillDifficulty(e.target.value)}
                className="w-full rounded-xl bg-bg-secondary border border-border p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
              >
                <option value="any">Any Difficulty</option>
                <option value="1">Easy (Level 1)</option>
                <option value="2">Easy-Medium (Level 2)</option>
                <option value="3">Medium (Level 3)</option>
                <option value="4">Medium-Hard (Level 4)</option>
                <option value="5">Hard (Level 5)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-text-secondary">
                  Specific Topics (Optional)
                </label>
                {availableTopics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const random = availableTopics[Math.floor(Math.random() * availableTopics.length)];
                      setDrillTopics([random.topic]);
                    }}
                    className="text-[10px] font-bold text-primary hover:opacity-70 transition-opacity px-2 py-0.5 rounded-lg border border-primary/30 bg-primary/5"
                  >
                    🎲 Random Topic
                  </button>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-bg-secondary p-2 space-y-1">
                {isLoadingTopics ? (
                  <div className="text-xs text-text-muted p-2">Loading topics...</div>
                ) : availableTopics.length === 0 ? (
                  <div className="text-xs text-text-muted p-2">No specific topics available</div>
                ) : (
                  availableTopics.map(t => (
                    <label key={t.topic} className="flex items-center gap-2 p-1.5 hover:bg-bg-primary rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={drillTopics.includes(t.topic)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDrillTopics(prev => [...prev, t.topic]);
                          } else {
                            setDrillTopics(prev => prev.filter(x => x !== t.topic));
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-text-primary flex-1">{t.topic}</span>
                      <span className="text-[10px] font-mono text-text-muted">{t.count}</span>
                    </label>
                  ))
                )}
              </div>
              {isDrillShort && (
                <p className="text-[10px] text-amber-500 font-medium">
                  Warning: Selected topics only have {drillSelectedTopicsCount} questions available. The remaining {drillCount - drillSelectedTopicsCount} will be filled with random {drillSubject} questions.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              onClick={() => setIsDrillModalOpen(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartDrill}
              size="sm"
            >
              Launch Drill
            </Button>
          </div>
        </div>
      </Modal>


      <Modal
        isOpen={!!paymentSuccess}
        onClose={() => setPaymentSuccess('')}
        title="Payment Success"
        maxWidth="sm"
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
            <Check className="h-6 w-6 text-success" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-text-primary">Payment Successful!</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{paymentSuccess}</p>
          </div>
          <Button onClick={() => setPaymentSuccess('')} fullWidth>
            Start Practicing
          </Button>
        </div>
      </Modal>

      {/* Subscription Plans Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Your CBT Account"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <p className="text-xs text-text-secondary text-center max-w-xl mx-auto">
            Unlock mock exams, detailed reviews, and advanced AI-powered tutoring to score 300+ in your UTME.
          </p>

          {paymentError && (
            <Alert variant="error" className="p-4 flex items-center gap-2">
              <span>{paymentError}</span>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Plus Plan Card */}
            <div className="rounded-2xl border border-border bg-bg-secondary/40 p-6 flex flex-col justify-between hover:border-primary/20 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">Plus Plan</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold text-text-primary">₦3,500</span>
                    <span className="text-[10px] text-text-muted">/mo</span>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                    1 Mock Exam Daily
                  </span>
                </div>

                <ul className="space-y-2.5 text-[11px] text-text-secondary pt-2 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> 1 full mock exam daily</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> Detailed score reviews</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> CBT Access Key</li>
                  <li className="flex items-center gap-2 text-text-muted"><X className="h-3 w-3 text-text-muted/60 flex-shrink-0" /> Subject-specific drills</li>
                  <li className="flex items-center gap-2 text-text-muted"><X className="h-3 w-3 text-text-muted/60 flex-shrink-0" /> AI Conversational Tutor</li>
                </ul>
              </div>

              <Button
                onClick={() => handleUpgradeClick('PLN_3pu5sd2pl33k7qw', 3500, 'plus')}
                disabled={isProcessingPayment}
                variant="secondary"
                fullWidth
                className="mt-6"
              >
                {isProcessingPayment ? 'Processing...' : 'Subscribe to Plus'}
              </Button>
            </div>

            {/* Pro Plan Card */}
            <div className="rounded-2xl border border-primary/25 bg-bg-secondary/40 p-6 flex flex-col justify-between relative hover:border-primary/40 transition-all group">
              <div className="absolute top-3 right-3 text-[9px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Popular
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">Pro Plan</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold text-text-primary">₦6,000</span>
                    <span className="text-[10px] text-text-muted">/mo</span>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                    2 Mock Exams Daily
                  </span>
                </div>

                <ul className="space-y-2.5 text-[11px] text-text-secondary pt-2 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> 2 full mock exams daily</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> Subject-specific drills</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> Detailed score reviews</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> CBT Access Key</li>
                  <li className="flex items-center gap-2 text-text-muted"><X className="h-3 w-3 text-text-muted/60 flex-shrink-0" /> AI Conversational Tutor</li>
                </ul>
              </div>

              <Button
                onClick={() => handleUpgradeClick('PLN_yzw49g99ybur0c1', 6000, 'pro')}
                disabled={isProcessingPayment}
                variant="gradient"
                fullWidth
                className="mt-6"
              >
                {isProcessingPayment ? 'Processing...' : 'Subscribe to Pro'}
              </Button>
            </div>

            {/* Max Plan Card */}
            <div className="rounded-2xl border border-ai-flag/25 bg-bg-secondary/40 p-6 flex flex-col justify-between hover:border-ai-flag/45 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-ai-flag/10 border border-ai-flag/20 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-ai-flag" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary block leading-none">Max Plan</span>
                    <span className="text-[8px] text-ai-flag font-semibold uppercase tracking-wide">Tutor Edition</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold text-text-primary">₦14,000</span>
                    <span className="text-[10px] text-text-muted">/mo</span>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-ai-flag bg-ai-flag/5 border border-ai-flag/10 px-2 py-0.5 rounded">
                    5 Mock Exams Daily + AI
                  </span>
                </div>

                <ul className="space-y-2.5 text-[11px] text-text-secondary pt-2 border-t border-border">
                  <li className="flex items-center gap-2 text-ai-flag font-bold"><Sparkles className="h-3 w-3 text-ai-flag flex-shrink-0" /> AI Conversational Tutor</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> 5 full mock exams daily</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> Subject-specific drills</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> Detailed score reviews</li>
                  <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success flex-shrink-0" /> CBT Access Key</li>
                </ul>
              </div>

              <Button
                onClick={() => handleUpgradeClick('PLN_015edt1c8m9nnow', 14000, 'max')}
                disabled={isProcessingPayment}
                fullWidth
                className="mt-6 bg-ai-flag hover:bg-ai-flag-hover text-text-on-accent border-ai-flag hover:border-ai-flag-hover"
              >
                {isProcessingPayment ? 'Processing...' : 'Subscribe to Max'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <AiChatWidget />
    </div>
  );
}
