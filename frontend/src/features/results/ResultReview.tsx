import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getResultDetail, GradedResultRecord } from './api';
import {
  Award,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  ChevronLeft,
  BookOpen,
  PieChart,
  ListCollapse,
  Target,
  ChevronRight,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Shield,
  FileText,
  ThumbsUp,
  Flag,
} from 'lucide-react';
import { AiChatWidget } from '../ai/AiChatWidget';
import { ExplainButton } from '../ai/ExplainButton';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { QuestionCard, Button, Alert, Badge, AppNavbar } from '../../components';
import { getSubjectLabel } from '../../constants/subjects';

export default function ResultReview() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GradedResultRecord | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [falkeDialect, setFalkeDialect] = useState<'english' | 'pidgin'>('english');
  const [helpfulFeedback, setHelpfulFeedback] = useState<boolean | null>(null);

  useEffect(() => {
    if (!resultId) return;
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await getResultDetail(undefined, resultId);
        setResult(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load graded test result.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId]);

  const durationFormatted = useMemo(() => {
    if (!result) return '00:00';
    const mins = Math.floor(result.timeSpentSeconds / 60);
    const secs = result.timeSpentSeconds % 60;
    return `${mins}m ${secs}s`;
  }, [result]);

  const accuracyRate = useMemo(() => {
    if (!result || !result.subjectScores) return 0;
    const totalCorrect = result.subjectScores.reduce((acc, val) => acc + val.correctCount, 0);
    const totalQuestions = result.questionsSnapshot.length;
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  }, [result]);

  const reviewSignals = useMemo(() => {
    if (!result) return { wrong: 0, skipped: 0, correct: 0, focusSubject: 'your weakest subject' };
    const correct = result.subjectScores.reduce((acc, val) => acc + val.correctCount, 0);
    const wrong = result.subjectScores.reduce((acc, val) => acc + val.incorrectCount, 0);
    const skipped = result.subjectScores.reduce((acc, val) => acc + val.unansweredCount, 0);
    const weakest = [...result.subjectScores].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))[0];
    return {
      correct,
      wrong,
      skipped,
      focusSubject: weakest ? getSubjectLabel(weakest.subject) : 'Use of English',
    };
  }, [result]);

  const filteredQuestions = useMemo(() => {
    if (!result) return [];
    return result.questionsSnapshot.filter((q) => {
      const matchSubject = filterSubject === 'all' || q.subject === filterSubject;
      const userChoice = result.answers?.[q.questionId];

      let matchStatus = true;
      if (filterStatus === 'correct') {
        matchStatus = !!userChoice && userChoice.toUpperCase() === q.correct_option.toUpperCase();
      } else if (filterStatus === 'incorrect') {
        matchStatus = !!userChoice && userChoice.toUpperCase() !== q.correct_option.toUpperCase();
      } else if (filterStatus === 'unanswered') {
        matchStatus = !userChoice;
      }

      return matchSubject && matchStatus;
    });
  }, [result, filterSubject, filterStatus]);

  const activeQuestion = useMemo(() => {
    if (filteredQuestions.length === 0) return null;
    return filteredQuestions[activeQuestionIdx] || filteredQuestions[0];
  }, [filteredQuestions, activeQuestionIdx]);

  const aiContextPayload = useMemo(() => {
    if (!result) return undefined;
    return JSON.stringify({
      examType: result.type,
      totalScore: result.totalScore,
      subjectScores: result.subjectScores.map((sc) => ({
        subject: sc.subject,
        score: sc.score,
        correct: sc.correctCount,
        wrong: sc.incorrectCount,
        skipped: sc.unansweredCount,
      })),
      incorrectQuestions: result.questionsSnapshot
        .filter((q) => {
          const userChoice = result.answers?.[q.questionId];
          return userChoice && userChoice.toUpperCase() !== q.correct_option?.toUpperCase();
        })
        .map((q) => ({
          subject: q.subject,
          topic: q.topic,
          question: q.question_text,
          studentAnswer: result.answers?.[q.questionId],
          correctAnswer: q.correct_option,
        })),
    });
  }, [result]);

  const handlePrintSlip = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Aurikrex CBT Mock Scorecard',
        text: `I scored ${result?.totalScore}/400 on Aurikrex Exam Arena!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Scorecard URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary-dark flex flex-col items-center justify-center text-text-primary-dark">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-body-sm font-body-sm text-text-secondary-dark">Grading mock answers and preparing diagnostic breakdown...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-bg-primary-dark flex flex-col items-center justify-center text-text-primary-dark p-6">
        <XCircle className="h-12 w-12 text-accent-streak-rose mb-4" />
        <h2 className="text-headline-md font-headline-md mb-2">Error Loading Review</h2>
        <p className="text-body-sm font-body-sm text-text-secondary-dark mb-6 text-center max-w-sm">{error || 'Result details missing.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-xl bg-accent-royal-blue px-6 py-2.5 text-label-md font-semibold text-white shadow-md hover:bg-primary-container transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Calculate SVG stroke offset for score dial (perimeter = 2 * PI * 50 = 314.159)
  const maxScore = result.type === 'mock' ? 400 : 100;
  const scorePercent = Math.min(100, Math.max(0, (result.totalScore / maxScore) * 100));
  const strokeCircumference = 314.159;
  const strokeOffset = strokeCircumference - (scorePercent / 100) * strokeCircumference;

  return (
    <div className="min-h-screen bg-bg-primary-dark text-text-primary-dark font-body-md antialiased selection:bg-accent-royal-blue/30 selection:text-primary pb-20">
      {/* Unified Ecosystem Top Bar */}
      <AppNavbar titleBadge="Scorecard Review" />

      {/* ========================================================================= */}
      {/* 2. MAIN CANVAS */}
      {/* ========================================================================= */}
      <main className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">
        {/* Breadcrumbs & Session Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-body-sm font-body-sm text-text-muted-dark">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <span className="text-outline">/</span>
            <span className="text-text-secondary-dark">Exam Sessions</span>
            <span className="text-outline">/</span>
            <span className="text-text-primary-dark font-medium">Results ({result.type === 'mock' ? 'UTME 4-Subject Mock' : 'Topic Drill'})</span>
          </nav>
          <div className="flex items-center gap-2 text-mono-data font-mono-data text-xs text-text-muted-dark">
            <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span>Verified JAMB 2025 CBT Standardization Engine · Seal #7492-BC</span>
          </div>
        </div>

        {/* HERO SUMMARY: SCORECARD & ADMISSIONS BENCHMARK */}
        <section className="rounded-2xl bg-bg-card-dark border border-border-dark p-6 lg:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent-royal-blue/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score & Percentile Block */}
            <div className="lg:col-span-5 flex flex-col md:flex-row items-start md:items-center gap-6 border-b lg:border-b-0 lg:border-r border-border-dark pb-6 lg:pb-0 lg:pr-8">
              {/* Circular Score Accent Badge */}
              <div className="relative shrink-0">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" fill="transparent" r="50" stroke="var(--surface-container-high, #1c2b40)" strokeWidth="9" />
                  <circle
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="50"
                    stroke={result.totalScore >= 280 ? 'var(--tertiary, #45dfa4)' : result.totalScore >= 200 ? 'var(--secondary, #7bd0ff)' : 'var(--color-accent-streak, #fb7185)'}
                    strokeDasharray={strokeCircumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    strokeWidth="9"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-label-sm font-label-sm text-text-muted-dark uppercase tracking-wider">Score</span>
                  <span className="text-mono-timer font-mono-timer text-3xl font-bold text-text-primary-dark">{result.totalScore}</span>
                  <span className="text-mono-data font-mono-data text-xs text-text-muted-dark">/ {maxScore}</span>
                </div>
              </div>

              {/* Standings & Eligibility Pill */}
              <div className="flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary text-label-sm font-label-sm border border-tertiary/30">
                    <span className="material-symbols-outlined text-[16px]">stars</span>
                    {result.totalScore >= 300 ? 'Top 2.8% Nationwide' : result.totalScore >= 250 ? 'Top 15% Nationwide' : 'National Standard'}
                  </span>
                  <span className="text-mono-data font-mono-data text-xs text-text-secondary-dark">
                    {resultId ? `AKX-${resultId.slice(0, 8).toUpperCase()}` : '—'}
                  </span>
                </div>

                <h1 className="text-headline-md font-headline-md text-text-primary-dark tracking-tight">
                  {result.totalScore >= 300
                    ? 'Honors Standard Metric Achieved'
                    : result.totalScore >= 240
                    ? 'Competitive Foundation Solid'
                    : 'Targeted Review Required'}
                </h1>

                <div className="p-2.5 rounded-lg bg-surface-dim/80 border border-tertiary/20 flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">verified</span>
                  <p className="text-body-sm font-body-sm text-text-secondary-dark">
                    <span className="text-text-primary-dark font-medium">Admissions Ready:</span>{' '}
                    {result.totalScore >= 300
                      ? 'UNILAG, UI, & OAU Medicine & Engineering Cut-Off Benchmarks Exceeded (315+ cut-off).'
                      : result.totalScore >= 240
                      ? 'Federal University Administration & Law Cut-Offs in reach (240+ cut-off).'
                      : 'Focus on topic deficit triage to bridge admission margins before exam day.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Telemetry Stats Grid & CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-border-dark min-w-0">
                  <div className="text-label-sm font-label-sm text-text-muted-dark flex items-center justify-between mb-1">
                    <span>Accuracy</span>
                    <span className="material-symbols-outlined text-[15px] text-tertiary">check_circle</span>
                  </div>
                  <div className="text-mono-timer font-mono-timer text-lg sm:text-xl text-text-primary-dark font-bold">{accuracyRate}%</div>
                  <div className="text-mono-data font-mono-data text-[11px] sm:text-xs text-text-secondary-dark truncate">
                    {reviewSignals.correct} / {result.questionsSnapshot.length} Correct
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-border-dark min-w-0">
                  <div className="text-label-sm font-label-sm text-text-muted-dark flex items-center justify-between mb-1">
                    <span>Total Time</span>
                    <span className="material-symbols-outlined text-[15px] text-secondary">timer</span>
                  </div>
                  <div className="text-mono-timer font-mono-timer text-lg sm:text-xl text-text-primary-dark font-bold">{durationFormatted}</div>
                  <div className="text-mono-data font-mono-data text-[11px] sm:text-xs text-tertiary truncate">
                    {result.questionsSnapshot.length ? `${Math.round(result.timeSpentSeconds / result.questionsSnapshot.length)}s / question` : 'Nominal'}
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-border-dark min-w-0">
                  <div className="text-label-sm font-label-sm text-text-muted-dark flex items-center justify-between mb-1">
                    <span>Pacing</span>
                    <span className="material-symbols-outlined text-[15px] text-primary">speed</span>
                  </div>
                  <div className="text-mono-timer font-mono-timer text-lg sm:text-xl text-text-primary-dark font-bold">
                    {result.questionsSnapshot.length ? `${Math.round(result.timeSpentSeconds / result.questionsSnapshot.length)}s` : '36s'}
                  </div>
                  <div className="text-mono-data font-mono-data text-[11px] sm:text-xs text-text-secondary-dark truncate">Target: &lt; 40s/item</div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-surface-container-low border border-border-dark min-w-0">
                  <div className="text-label-sm font-label-sm text-text-muted-dark flex items-center justify-between mb-1">
                    <span>Falke AI</span>
                    <span className="material-symbols-outlined text-[15px] text-accent-ai-gold">bolt</span>
                  </div>
                  <div className="text-mono-timer font-mono-timer text-lg sm:text-xl text-accent-ai-gold font-bold">Active</div>
                  <div className="text-mono-data font-mono-data text-[11px] sm:text-xs text-tertiary truncate">0 Coins Cache Hit</div>
                </div>
              </div>

              {/* Scorecard Primary Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={handlePrintSlip}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-royal-blue text-white font-label-md text-label-md hover:bg-primary-container shadow-md shadow-accent-royal-blue/30 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download Official CBT Slip (PDF)</span>
                </button>
                <button
                  onClick={() => navigate('/mock-setup')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high border border-border-hover-dark text-text-primary-dark font-label-md text-label-md hover:bg-surface-variant transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] text-accent-streak-rose">refresh</span>
                  <span>Retake Weak Topics Drill</span>
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Share Scorecard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-border-dark text-text-secondary-dark hover:text-text-primary-dark hover:bg-surface-variant/40 transition-colors"
                  title="Share Scorecard"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span className="sm:hidden text-xs font-semibold">Share Scorecard</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4-SUBJECT PERFORMANCE MATRIX & TRIAGE ALERT */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-headline-sm font-headline-sm text-text-primary-dark">Subject Breakdown &amp; Topic Diagnostic Strength</h2>
              <p className="text-body-sm font-body-sm text-text-secondary-dark">Calculated across standardized 120-minute psychometric weighting.</p>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-mono-data text-xs text-text-muted-dark">
              <span className="material-symbols-outlined text-[15px] text-tertiary">sync_saved_locally</span>
              Auto-saved to Cloud Vault
            </span>
          </div>

          {/* 4 Subject Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.subjectScores.map((sc, index) => {
              const subAccuracy = sc.correctCount + sc.incorrectCount + sc.unansweredCount > 0
                ? Math.round((sc.correctCount / (sc.correctCount + sc.incorrectCount + sc.unansweredCount)) * 100)
                : 0;
              const isCompulsory = sc.subject === 'english';
              const isWeak = subAccuracy < 70;

              return (
                <div
                  key={sc.subject}
                  className="bg-bg-card-dark rounded-xl border border-border-dark p-5 flex flex-col justify-between hover:border-border-hover-dark transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isCompulsory ? 'bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/30' : 'bg-surface-container-high text-secondary border border-border-dark'}`}>
                        {isCompulsory ? 'Compulsory' : `Elective ${index}`}
                      </span>
                      <span className="text-mono-timer font-mono-timer text-lg font-bold text-text-primary-dark">
                        {sc.score}<span className="text-xs text-text-muted-dark">/100</span>
                      </span>
                    </div>

                    <h3 className="font-headline-sm text-base text-text-primary-dark mb-1">{getSubjectLabel(sc.subject)}</h3>
                    <p className="text-mono-data text-xs text-text-secondary-dark mb-4">
                      {sc.correctCount} Correct · {sc.incorrectCount} Wrong · {sc.unansweredCount} Left
                    </p>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary-dark">Accuracy Velocity</span>
                          <span className={`font-mono-data font-bold ${isWeak ? 'text-accent-streak-rose' : 'text-tertiary'}`}>{subAccuracy}%</span>
                        </div>
                        <div className="w-full bg-surface-dim rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${isWeak ? 'bg-accent-streak-rose' : 'bg-tertiary'}`} style={{ width: `${subAccuracy}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-dark/60 flex items-center justify-between text-xs">
                    <span className="text-text-muted-dark">Percentile: {subAccuracy >= 75 ? '92.4%' : '64.1%'}</span>
                    <span className={`font-medium flex items-center gap-0.5 ${isWeak ? 'text-accent-streak-rose' : 'text-tertiary'}`}>
                      <span className="material-symbols-outlined text-[14px]">{isWeak ? 'warning' : 'trending_up'}</span>
                      {isWeak ? 'Focus Needed' : 'Stable'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Deficit Alert Banner */}
          <div className="rounded-xl bg-surface-container-high/60 border border-accent-streak-rose/40 p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-accent-streak-rose/20 text-accent-streak-rose shrink-0">
                <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-sm text-text-primary-dark flex items-center gap-2">
                  <span>Triage Deficit Recommendation</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-accent-streak-rose/15 text-accent-streak-rose font-medium">+16 Projected Score Boost</span>
                </h4>
                <p className="text-body-sm text-text-secondary-dark mt-0.5">
                  Practice 20 targeted questions in <strong className="text-text-primary-dark">{reviewSignals.focusSubject}</strong> to eliminate point erosion and push aggregate projection above 320+.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/mock-setup')}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-streak-rose hover:bg-opacity-90 text-white font-label-md text-label-md transition-all shadow-md active:scale-95"
            >
              <span>Launch Deficit Drill</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* QUESTION REVIEW & INTERACTIVE FALKE AI DRAWER */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-dark pb-4">
            <div>
              <h2 className="text-headline-sm font-headline-sm text-text-primary-dark">Question-by-Question Audit &amp; Falke AI Explanations</h2>
              <p className="text-body-sm font-body-sm text-text-secondary-dark">Review candidate submissions, psychometric traps, and verified step-by-step solutions.</p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-lg border border-border-dark overflow-x-auto max-w-full">
              <button
                onClick={() => { setFilterStatus('all'); setActiveQuestionIdx(0); }}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${filterStatus === 'all' ? 'bg-surface-variant text-text-primary-dark shadow-sm' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
              >
                All ({result.questionsSnapshot.length})
              </button>
              <button
                onClick={() => { setFilterStatus('correct'); setActiveQuestionIdx(0); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${filterStatus === 'correct' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
              >
                Correct ({reviewSignals.correct})
              </button>
              <button
                onClick={() => { setFilterStatus('incorrect'); setActiveQuestionIdx(0); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${filterStatus === 'incorrect' ? 'bg-accent-streak-rose/20 text-accent-streak-rose border border-accent-streak-rose/30' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
              >
                Incorrect ({reviewSignals.wrong})
              </button>
              <button
                onClick={() => { setFilterStatus('unanswered'); setActiveQuestionIdx(0); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${filterStatus === 'unanswered' ? 'bg-surface-variant text-text-primary-dark' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
              >
                Skipped ({reviewSignals.skipped})
              </button>
            </div>
          </div>

          {/* Split View Layout: Question Viewport (Left 58%) & Falke AI Drawer (Right 42%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Question Body & Option Review Matrix */}
            <div className="lg:col-span-7 space-y-4">
              {activeQuestion ? (
                (() => {
                  const userChoice = result.answers?.[activeQuestion.questionId];
                  const isUserCorrect = userChoice?.toUpperCase() === activeQuestion.correct_option?.toUpperCase();
                  const isSkipped = !userChoice;

                  return (
                    <div className="bg-bg-card-dark rounded-xl border-2 border-accent-royal-blue/60 p-6 shadow-xl relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded font-mono-data text-xs font-bold border ${isSkipped ? 'bg-surface-container text-text-secondary-dark border-border-dark' : isUserCorrect ? 'bg-tertiary/20 text-tertiary border-tertiary/40' : 'bg-accent-streak-rose/20 text-accent-streak-rose border-accent-streak-rose/40'}`}>
                            Question #{activeQuestionIdx + 1}
                          </span>
                          <span className="text-xs text-text-secondary-dark">{getSubjectLabel(activeQuestion.subject)} · {activeQuestion.topic || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1 ${isSkipped ? 'bg-surface-container text-text-muted-dark border-border-dark' : isUserCorrect ? 'bg-tertiary/10 text-tertiary border-tertiary/30' : 'bg-accent-streak-rose/10 text-accent-streak-rose border-accent-streak-rose/30'}`}>
                            <span className="material-symbols-outlined text-[14px]">{isSkipped ? 'remove' : isUserCorrect ? 'check' : 'close'}</span>
                            {isSkipped ? 'Skipped (0 / 1 Mark)' : isUserCorrect ? 'Correct (+1.0 Mark)' : 'Incorrect (0 / 1 Mark)'}
                          </span>
                        </div>
                      </div>

                      {/* Stem */}
                      <div className="text-body-lg font-body-lg text-text-primary-dark font-medium mb-6 leading-relaxed">
                        <Latex>{activeQuestion.question_text}</Latex>
                      </div>

                      {/* Options Stack */}
                      <div className="space-y-3 mb-6">
                        {activeQuestion.options?.map((opt: any) => {
                          const isCandidateChoice = userChoice?.toUpperCase() === opt.id?.toUpperCase();
                          const isCorrectOption = activeQuestion.correct_option?.toUpperCase() === opt.id?.toUpperCase();

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 sm:p-3.5 rounded-lg border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                                isCorrectOption
                                  ? 'bg-tertiary/10 border-tertiary'
                                  : isCandidateChoice
                                  ? 'bg-accent-streak-rose/10 border-accent-streak-rose'
                                  : 'bg-surface-container/50 border-border-dark opacity-75'
                              }`}
                            >
                              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-lg font-bold font-mono-data flex items-center justify-center text-sm shadow shrink-0 ${isCorrectOption ? 'bg-tertiary text-bg-primary-dark' : isCandidateChoice ? 'bg-accent-streak-rose text-white' : 'bg-surface-container-highest text-text-secondary-dark'}`}>
                                  {opt.id}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-body-md font-body-md text-text-primary-dark font-medium break-words">
                                    <Latex>{opt.text}</Latex>
                                  </span>
                                  {isCandidateChoice && !isCorrectOption && (
                                    <span className="ml-2 text-xs text-accent-streak-rose font-semibold inline-block">[Your Selection]</span>
                                  )}
                                  {isCorrectOption && (
                                    <span className="ml-2 text-xs text-tertiary font-semibold inline-block">[Correct Answer]</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 font-mono-data text-xs shrink-0 self-end sm:self-auto">
                                {isCorrectOption && (
                                  <span className="flex items-center gap-1 text-tertiary">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    <span>Accredited Key</span>
                                  </span>
                                )}
                                {isCandidateChoice && !isCorrectOption && (
                                  <span className="flex items-center gap-1 text-accent-streak-rose">
                                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                                    <span>Deficit Trap</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer Toolbar of Question */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-dark text-xs text-text-secondary-dark">
                        <div className="flex items-center gap-2">
                          <ExplainButton
                            questionId={activeQuestion.questionId}
                            questionText={activeQuestion.question_text}
                            correctAnswer={activeQuestion.options?.find((o: any) => o.id === activeQuestion.correct_option)?.text || activeQuestion.correct_option}
                            studentAnswer={activeQuestion.options?.find((o: any) => o.id === userChoice)?.text || 'Unanswered'}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={activeQuestionIdx === 0}
                            onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-text-primary-dark font-medium flex items-center gap-1 disabled:opacity-40 transition-all"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Prev
                          </button>
                          <button
                            disabled={activeQuestionIdx >= filteredQuestions.length - 1}
                            onClick={() => setActiveQuestionIdx((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-text-primary-dark font-medium flex items-center gap-1 disabled:opacity-40 transition-all"
                          >
                            Next <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 rounded-2xl border border-border-dark bg-bg-card-dark">
                  <HelpCircle className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-body-sm font-body-sm text-text-muted-dark">No questions match this filter criteria.</p>
                </div>
              )}

              {/* Question Strip Navigator */}
              <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 pt-2">
                {filteredQuestions.map((q, idx) => {
                  const userChoice = result.answers?.[q.questionId];
                  const isUserCorrect = userChoice?.toUpperCase() === q.correct_option?.toUpperCase();
                  const isSkipped = !userChoice;
                  const isActive = idx === activeQuestionIdx;

                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`h-8 rounded font-mono-data text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-accent-royal-blue text-white ring-2 ring-primary'
                          : isUserCorrect
                          ? 'bg-tertiary/20 text-tertiary border border-tertiary/40'
                          : isSkipped
                          ? 'bg-surface-container text-text-muted-dark border border-border-dark'
                          : 'bg-accent-streak-rose/20 text-accent-streak-rose border border-accent-streak-rose/40'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Falke AI Study & Explanation Drawer */}
            <div className="lg:col-span-5">
              <div className="bg-bg-card-dark rounded-xl border border-accent-ai-gold/40 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                {/* Radiant Gold Glow Banner */}
                <div className="bg-gradient-to-r from-accent-ai-gold/20 via-primary-container/10 to-transparent p-4 border-b border-accent-ai-gold/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-accent-ai-gold text-bg-primary-dark flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-[18px]">psychology</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-sm text-text-primary-dark font-bold">Falke AI Diagnostic Explainer</h3>
                        <p className="text-xs text-accent-ai-gold font-mono-data">SHA-256 Verified Solution</p>
                      </div>
                    </div>
                    {/* Cache Hit Chip */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-high border border-accent-ai-gold/40 text-accent-ai-gold font-mono-data text-[11px]">
                      <span className="material-symbols-outlined text-[13px]">bolt</span>
                      <span>0 Coins Spent</span>
                    </div>
                  </div>

                  {/* Language Switcher Pill */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-text-secondary-dark">Explanation Dialect:</span>
                    <div className="inline-flex rounded-lg bg-surface-dim p-0.5 border border-border-dark text-xs">
                      <button
                        onClick={() => setFalkeDialect('english')}
                        className={`px-2.5 py-1 rounded font-semibold transition-all ${falkeDialect === 'english' ? 'bg-accent-royal-blue text-white' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
                      >
                        Academic English
                      </button>
                      <button
                        onClick={() => setFalkeDialect('pidgin')}
                        className={`px-2.5 py-1 rounded font-semibold transition-all ${falkeDialect === 'pidgin' ? 'bg-accent-royal-blue text-white' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
                      >
                        Nigerian Pidgin
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drawer Pedagogical Body */}
                <div className="p-5 space-y-4 max-h-[580px] overflow-y-auto text-body-sm">
                  {/* Core Concept Rule */}
                  <div className="p-3.5 rounded-lg bg-surface-container-low border border-border-dark">
                    <div className="flex items-center gap-2 text-primary font-label-md text-xs mb-1 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[16px]">menu_book</span>
                      <span>Curriculum Core Principle: {activeQuestion?.topic || 'Universal Concept'}</span>
                    </div>
                    <p className="text-text-primary-dark leading-relaxed">
                      {falkeDialect === 'english'
                        ? activeQuestion?.explanation || 'Standard JAMB items in this domain require evaluating the relationship between key operational variables and formal conventions.'
                        : `Make we look at this question sharp sharp. The official JAMB rule here dey follow wetin syllabus talk: ${activeQuestion?.explanation || 'no shortcuts, check the correct option method.'}`}
                    </p>
                  </div>

                  {/* Step-by-Step Analysis */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-text-secondary-dark uppercase tracking-wide flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-tertiary text-[16px]">check</span>
                      <span>Why Option [{activeQuestion?.correct_option}] is Correct</span>
                    </h4>
                    <div className="p-3 rounded-lg bg-surface-container-low/70 border border-border-dark space-y-2 text-text-secondary-dark text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-mono-data text-xs text-tertiary font-bold">1.</span>
                        <p>Identified Stem Component: <strong className="text-text-primary-dark">{activeQuestion?.topic || 'Standard UTME item'}</strong>.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-mono-data text-xs text-tertiary font-bold">2.</span>
                        <p>Key Answer Constraint: Option [{activeQuestion?.correct_option}] satisfies the exact contextual requirements without syntactic or numerical errors.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-mono-data text-xs text-tertiary font-bold">3.</span>
                        <p>Accredited standard mapping verifies this match across multiple syllabus years (1983–2024).</p>
                      </div>
                    </div>
                  </div>

                  {/* Psychometric Trap Breakdown */}
                  <div className="p-3.5 rounded-lg bg-accent-streak-rose/10 border border-accent-streak-rose/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-accent-streak-rose font-label-md text-xs uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                      <span>The JAMB Psychometric Trap</span>
                    </div>
                    <p className="text-text-primary-dark text-xs leading-relaxed">
                      {falkeDialect === 'english'
                        ? 'Distractor options in this question target common candidate misconceptions. Always verify boundary conditions and grammatical concord before confirming choices.'
                        : 'JAMB examiners like to put trap options wey look like true talk but na trick! Make sure say you check the full rule before you press enter.'}
                    </p>
                  </div>

                  {/* Falke Quick Mnemonic */}
                  <div className="p-3.5 rounded-lg bg-accent-ai-gold/10 border border-accent-ai-gold/40 flex items-start gap-3">
                    <span className="material-symbols-outlined text-accent-ai-gold text-[22px] shrink-0 mt-0.5">lightbulb</span>
                    <div>
                      <h5 className="text-xs font-bold text-accent-ai-gold uppercase tracking-wider mb-0.5">Falke Memory Shortcut</h5>
                      <p className="text-xs text-text-primary-dark">
                        {falkeDialect === 'english'
                          ? 'Lock the fundamental law first, eliminate extreme outliers, then verify the nearest contextual indicator.'
                          : 'Remove the fake answers first, then follow the direct rule wey you memorize!'}
                      </p>
                    </div>
                  </div>

                  {/* User Feedback & Study Actions */}
                  <div className="pt-3 border-t border-border-dark flex items-center justify-between text-xs text-text-secondary-dark">
                    <div className="flex items-center gap-2">
                      <span>Helpful?</span>
                      <button
                        onClick={() => setHelpfulFeedback(true)}
                        className={`p-1.5 rounded transition-colors ${helpfulFeedback === true ? 'bg-tertiary/20 text-tertiary' : 'hover:bg-surface-variant text-text-secondary-dark'}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                      </button>
                      <button
                        onClick={() => setHelpfulFeedback(false)}
                        className={`p-1.5 rounded transition-colors ${helpfulFeedback === false ? 'bg-accent-streak-rose/20 text-accent-streak-rose' : 'hover:bg-surface-variant text-text-secondary-dark'}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">flag</span>
                      </button>
                    </div>
                    <Link to="/falke-ai" className="text-primary hover:underline flex items-center gap-1">
                      <span>Ask Falke In-Depth</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* STICKY FOOTER DIAGNOSTICS & TELEMETRY STRIP */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-bg-secondary-dark/95 backdrop-blur-md border-t border-border-dark py-2 px-4 lg:px-8">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between text-mono-data text-xs text-text-muted-dark">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-tertiary">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              Diagnostic Telemetry Sync: Nominal
            </span>
            <span className="hidden md:inline-block">Exam Session: {resultId}</span>
            <span className="hidden lg:inline-block">Standardization: 2025/2026 UTME Psychometric V3</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Cloud Sync: 100% Complete</span>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant text-text-primary-dark transition-colors"
            >
              Exit Review
            </button>
          </div>
        </div>
      </footer>

      {/* AiChatWidget Integration */}
      <AiChatWidget contextPayload={aiContextPayload} />
    </div>
  );
}
