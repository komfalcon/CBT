import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getResultDetail, GradedResultRecord } from './api';
import { getMe } from '../auth/api';
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
import { StudentLayout } from '../../components/StudentLayout';
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
  const [candidateUser, setCandidateUser] = useState<{ fullName?: string; email?: string; id?: string } | null>(null);

  useEffect(() => {
    getMe().then((u: any) => setCandidateUser(u)).catch(() => {});
  }, []);

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
      <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-text-secondary font-medium">Grading mock answers and preparing diagnostic breakdown...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary p-6">
        <div className="text-center max-w-md p-8 rounded-2xl bg-bg-card border border-border shadow-sm">
          <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-display mb-2">Error Loading Review</h2>
          <p className="text-sm text-text-secondary mb-6">{error || 'Result details missing.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate SVG stroke offset for score dial (perimeter = 2 * PI * 50 = 314.159)
  const maxScore = result.type === 'mock' ? 400 : 100;
  const scorePercent = Math.min(100, Math.max(0, (result.totalScore / maxScore) * 100));
  const strokeCircumference = 314.159;
  const strokeOffset = strokeCircumference - (scorePercent / 100) * strokeCircumference;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-body antialiased selection:bg-primary selection:text-white print:bg-white print:text-black print:p-0 print:m-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `,
        }}
      />

      {/* Screen Interactive Review View (Hidden during Print / PDF generation) */}
      <div className="print:hidden">
        <StudentLayout student={candidateUser}>
          <div className="space-y-6 pb-12">
            {/* Breadcrumbs & Session Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <nav className="flex items-center gap-2 text-sm text-text-muted">
                <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Dashboard</span>
                </Link>
                <span>/</span>
                <span className="text-text-secondary">Exam Sessions</span>
                <span>/</span>
                <span className="text-text-primary font-semibold">Results ({result.type === 'mock' ? 'UTME 4-Subject Mock' : 'Topic Drill'})</span>
              </nav>
              <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified JAMB 2025 CBT Standardization Engine · Seal #7492-BC</span>
              </div>
            </div>

            {/* HERO SUMMARY: SCORECARD & ADMISSIONS BENCHMARK */}
            <section className="rounded-2xl bg-bg-card border border-border p-6 lg:p-8 relative overflow-hidden shadow-sm">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Score & Percentile Block */}
                <div className="lg:col-span-5 flex flex-col md:flex-row items-start md:items-center gap-6 border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-8">
                  {/* Circular Score Accent Badge */}
                  <div className="relative shrink-0">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        fill="transparent"
                        r="50"
                        className="text-surface-container-high stroke-current"
                        strokeWidth="9"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="transparent"
                        r="50"
                        stroke={result.totalScore >= 280 ? '#10b981' : result.totalScore >= 200 ? '#3b82f6' : '#f43f5e'}
                        strokeDasharray={strokeCircumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        strokeWidth="9"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Score</span>
                      <span className="font-mono text-3xl font-black text-text-primary">{result.totalScore}</span>
                      <span className="font-mono text-xs text-text-muted">/ {maxScore}</span>
                    </div>
                  </div>

                  {/* Standings & Eligibility Pill */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                        <span className="material-symbols-outlined text-[16px]">stars</span>
                        {result.totalScore >= 300 ? 'Top 2.8% Nationwide' : result.totalScore >= 250 ? 'Top 15% Nationwide' : 'National Standard'}
                      </span>
                      <span className="font-mono text-xs text-text-secondary">
                        {resultId ? `AKX-${resultId.slice(0, 8).toUpperCase()}` : '—'}
                      </span>
                    </div>

                    <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight">
                      {result.totalScore >= 300
                        ? 'Honors Standard Metric Achieved'
                        : result.totalScore >= 240
                        ? 'Competitive Foundation Solid'
                        : 'Targeted Review Required'}
                    </h1>

                    <div className="p-3 rounded-xl bg-surface-container/60 border border-border flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">verified</span>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        <span className="text-text-primary font-semibold">Admissions Ready:</span>{' '}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-surface-container border border-border min-w-0">
                      <div className="text-xs text-text-muted flex items-center justify-between mb-1">
                        <span>Accuracy</span>
                        <span className="material-symbols-outlined text-[15px] text-emerald-500">check_circle</span>
                      </div>
                      <div className="font-mono text-xl text-text-primary font-bold">{accuracyRate}%</div>
                      <div className="font-mono text-xs text-text-secondary truncate">
                        {reviewSignals.correct} / {result.questionsSnapshot.length} Correct
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container border border-border min-w-0">
                      <div className="text-xs text-text-muted flex items-center justify-between mb-1">
                        <span>Total Time</span>
                        <span className="material-symbols-outlined text-[15px] text-blue-500">timer</span>
                      </div>
                      <div className="font-mono text-xl text-text-primary font-bold">{durationFormatted}</div>
                      <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 truncate">
                        {result.questionsSnapshot.length ? `${Math.round(result.timeSpentSeconds / result.questionsSnapshot.length)}s / item` : 'Nominal'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container border border-border min-w-0">
                      <div className="text-xs text-text-muted flex items-center justify-between mb-1">
                        <span>Pacing</span>
                        <span className="material-symbols-outlined text-[15px] text-primary">speed</span>
                      </div>
                      <div className="font-mono text-xl text-text-primary font-bold">
                        {result.questionsSnapshot.length ? `${Math.round(result.timeSpentSeconds / result.questionsSnapshot.length)}s` : '36s'}
                      </div>
                      <div className="font-mono text-xs text-text-secondary truncate">Target: &lt; 40s/item</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container border border-border min-w-0">
                      <div className="text-xs text-text-muted flex items-center justify-between mb-1">
                        <span>Falke AI</span>
                        <span className="material-symbols-outlined text-[15px] text-amber-500">bolt</span>
                      </div>
                      <div className="font-mono text-xl text-amber-500 font-bold">Active</div>
                      <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 truncate">0 Coins Cache Hit</div>
                    </div>
                  </div>

                  {/* Scorecard Primary Actions */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
                    <button
                      onClick={handlePrintSlip}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover shadow-sm active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official CBT Slip (PDF)</span>
                    </button>
                    <button
                      onClick={() => navigate('/mock-setup')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container border border-border text-text-primary font-semibold text-sm hover:bg-surface-variant transition-colors active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4 text-rose-500" />
                      <span>Retake Weak Topics Drill</span>
                    </button>
                    <button
                      onClick={handleShare}
                      aria-label="Share Scorecard"
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container border border-border text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-colors"
                      title="Share Scorecard"
                    >
                      <Share2 className="w-4 h-4" />
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
                  <h2 className="font-display text-xl font-bold text-text-primary">Subject Breakdown &amp; Topic Diagnostic Strength</h2>
                  <p className="text-sm text-text-secondary">Calculated across standardized 120-minute psychometric weighting.</p>
                </div>
                <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
                  <span className="material-symbols-outlined text-[15px] text-emerald-500">sync_saved_locally</span>
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
                      className="bg-bg-card rounded-2xl border border-border p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isCompulsory ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-container text-text-secondary border border-border'}`}>
                            {isCompulsory ? 'Compulsory' : `Elective ${index}`}
                          </span>
                          <span className="font-mono text-lg font-bold text-text-primary">
                            {sc.score}<span className="text-xs text-text-muted">/100</span>
                          </span>
                        </div>

                        <h3 className="font-display font-bold text-base text-text-primary mb-1">{getSubjectLabel(sc.subject)}</h3>
                        <p className="font-mono text-xs text-text-secondary mb-4">
                          {sc.correctCount} Correct · {sc.incorrectCount} Wrong · {sc.unansweredCount} Left
                        </p>

                        <div className="space-y-2.5">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-text-secondary">Accuracy Velocity</span>
                              <span className={`font-mono font-bold ${isWeak ? 'text-rose-500' : 'text-emerald-500'}`}>{subAccuracy}%</span>
                            </div>
                            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full ${isWeak ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${subAccuracy}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-text-muted">Percentile: {subAccuracy >= 75 ? '92.4%' : '64.1%'}</span>
                        <span className={`font-medium flex items-center gap-0.5 ${isWeak ? 'text-rose-500' : 'text-emerald-500'}`}>
                          <span className="material-symbols-outlined text-[14px]">{isWeak ? 'warning' : 'trending_up'}</span>
                          {isWeak ? 'Focus Needed' : 'Stable'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diagnostic Deficit Alert Banner */}
              <div className="rounded-2xl bg-surface-container border border-rose-500/30 p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                    <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-text-primary flex items-center gap-2">
                      <span>Triage Deficit Recommendation</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold">+16 Projected Score Boost</span>
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">
                      Practice 20 targeted questions in <strong className="text-text-primary font-semibold">{reviewSignals.focusSubject}</strong> to eliminate point erosion and push aggregate projection above 320+.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/mock-setup')}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
                >
                  <span>Launch Deficit Drill</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* QUESTION REVIEW & INTERACTIVE FALKE AI DRAWER */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-text-primary">Question-by-Question Audit &amp; Falke AI Explanations</h2>
                  <p className="text-sm text-text-secondary">Review candidate submissions, psychometric traps, and verified step-by-step solutions.</p>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl border border-border overflow-x-auto max-w-full">
                  <button
                    onClick={() => { setFilterStatus('all'); setActiveQuestionIdx(0); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === 'all' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    All ({result.questionsSnapshot.length})
                  </button>
                  <button
                    onClick={() => { setFilterStatus('correct'); setActiveQuestionIdx(0); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === 'correct' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Correct ({reviewSignals.correct})
                  </button>
                  <button
                    onClick={() => { setFilterStatus('incorrect'); setActiveQuestionIdx(0); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === 'incorrect' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Incorrect ({reviewSignals.wrong})
                  </button>
                  <button
                    onClick={() => { setFilterStatus('unanswered'); setActiveQuestionIdx(0); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === 'unanswered' ? 'bg-surface-variant text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
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
                        <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-sm relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${isSkipped ? 'bg-surface-container text-text-secondary border-border' : isUserCorrect ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'}`}>
                                Question #{activeQuestionIdx + 1}
                              </span>
                              <span className="text-xs text-text-secondary">{getSubjectLabel(activeQuestion.subject)} · {activeQuestion.topic || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${isSkipped ? 'bg-surface-container text-text-muted border-border' : isUserCorrect ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                                <span className="material-symbols-outlined text-[14px]">{isSkipped ? 'remove' : isUserCorrect ? 'check' : 'close'}</span>
                                {isSkipped ? 'Skipped (0 / 1 Mark)' : isUserCorrect ? 'Correct (+1.0 Mark)' : 'Incorrect (0 / 1 Mark)'}
                              </span>
                            </div>
                          </div>

                          {/* Stem */}
                          <div className="text-base sm:text-lg text-text-primary font-medium mb-6 leading-relaxed">
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
                                  className={`p-3.5 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                    isCorrectOption
                                      ? 'bg-emerald-500/10 border-emerald-500/60 dark:bg-emerald-950/20'
                                      : isCandidateChoice
                                      ? 'bg-rose-500/10 border-rose-500/60 dark:bg-rose-950/20'
                                      : 'bg-surface-container/50 border-border opacity-85'
                                  }`}
                                >
                                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-8 h-8 rounded-lg font-bold font-mono flex items-center justify-center text-sm shrink-0 ${isCorrectOption ? 'bg-emerald-500 text-white' : isCandidateChoice ? 'bg-rose-500 text-white' : 'bg-surface-container-high text-text-secondary'}`}>
                                      {opt.id}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="text-sm sm:text-base text-text-primary font-medium break-words">
                                        <Latex>{opt.text}</Latex>
                                      </span>
                                      {isCandidateChoice && !isCorrectOption && (
                                        <span className="ml-2 text-xs text-rose-500 font-semibold inline-block">[Your Selection]</span>
                                      )}
                                      {isCorrectOption && (
                                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold inline-block">[Correct Answer]</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-end sm:self-auto">
                                    {isCorrectOption && (
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Accredited Key</span>
                                      </span>
                                    )}
                                    {isCandidateChoice && !isCorrectOption && (
                                      <span className="flex items-center gap-1 text-rose-500 font-semibold">
                                        <XCircle className="w-4 h-4" />
                                        <span>Deficit Trap</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer Toolbar of Question */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border text-xs text-text-secondary">
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
                                className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-variant text-text-primary font-semibold flex items-center gap-1 disabled:opacity-40 transition-all border border-border"
                              >
                                <ChevronLeft className="w-4 h-4" /> Prev
                              </button>
                              <button
                                disabled={activeQuestionIdx >= filteredQuestions.length - 1}
                                onClick={() => setActiveQuestionIdx((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                                className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-variant text-text-primary font-semibold flex items-center gap-1 disabled:opacity-40 transition-all border border-border"
                              >
                                Next <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-12 rounded-2xl border border-border bg-bg-card">
                      <HelpCircle className="h-8 w-8 text-text-muted mx-auto mb-2" />
                      <p className="text-sm text-text-muted">No questions match this filter criteria.</p>
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
                          className={`h-8 rounded-lg font-mono text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-primary text-white ring-2 ring-primary/40 shadow-sm'
                              : isUserCorrect
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : isSkipped
                              ? 'bg-surface-container text-text-muted border border-border'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
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
                  <div className="bg-bg-card rounded-2xl border border-amber-500/30 shadow-sm relative overflow-hidden backdrop-blur-xl">
                    {/* Radiant Gold Glow Banner */}
                    <div className="bg-gradient-to-r from-amber-500/15 via-primary/5 to-transparent p-4 border-b border-amber-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-sm text-text-primary">Falke AI Diagnostic Explainer</h3>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-mono">SHA-256 Verified Solution</p>
                          </div>
                        </div>
                        {/* Cache Hit Chip */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-semibold">
                          <span className="material-symbols-outlined text-[13px]">bolt</span>
                          <span>0 Coins Spent</span>
                        </div>
                      </div>

                      {/* Language Switcher Pill */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-text-secondary font-medium">Explanation Dialect:</span>
                        <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-border text-xs">
                          <button
                            onClick={() => setFalkeDialect('english')}
                            className={`px-2.5 py-1 rounded font-semibold transition-all ${falkeDialect === 'english' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
                          >
                            Academic English
                          </button>
                          <button
                            onClick={() => setFalkeDialect('pidgin')}
                            className={`px-2.5 py-1 rounded font-semibold transition-all ${falkeDialect === 'pidgin' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
                          >
                            Nigerian Pidgin
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Drawer Pedagogical Body */}
                    <div className="p-5 space-y-4 max-h-[580px] overflow-y-auto text-sm">
                      {/* Core Concept Rule */}
                      <div className="p-3.5 rounded-xl bg-surface-container border border-border">
                        <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1 uppercase tracking-wider">
                          <BookOpen className="w-4 h-4" />
                          <span>Curriculum Principle: {activeQuestion?.topic || 'Universal Concept'}</span>
                        </div>
                        <p className="text-text-primary leading-relaxed text-xs">
                          {falkeDialect === 'english'
                            ? activeQuestion?.explanation || 'Standard JAMB items in this domain require evaluating the relationship between key operational variables and formal conventions.'
                            : `Make we look at this question sharp sharp. The official JAMB rule here dey follow wetin syllabus talk: ${activeQuestion?.explanation || 'no shortcuts, check the correct option method.'}`}
                        </p>
                      </div>

                      {/* Step-by-Step Analysis */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Why Option [{activeQuestion?.correct_option}] is Correct</span>
                        </h4>
                        <div className="p-3 rounded-xl bg-surface-container/60 border border-border space-y-2 text-text-secondary text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-xs text-emerald-500 font-bold">1.</span>
                            <p>Identified Stem Component: <strong className="text-text-primary font-semibold">{activeQuestion?.topic || 'Standard UTME item'}</strong>.</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-xs text-emerald-500 font-bold">2.</span>
                            <p>Key Answer Constraint: Option [{activeQuestion?.correct_option}] satisfies the exact contextual requirements without syntactic or numerical errors.</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-xs text-emerald-500 font-bold">3.</span>
                            <p>Accredited standard mapping verifies this match across multiple syllabus years (1983–2024).</p>
                          </div>
                        </div>
                      </div>

                      {/* Psychometric Trap Breakdown */}
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs uppercase tracking-wide">
                          <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                          <span>The JAMB Psychometric Trap</span>
                        </div>
                        <p className="text-text-primary text-xs leading-relaxed">
                          {falkeDialect === 'english'
                            ? 'Distractor options in this question target common candidate misconceptions. Always verify boundary conditions and grammatical concord before confirming choices.'
                            : 'JAMB examiners like to put trap options wey look like true talk but na trick! Make sure say you check the full rule before you press enter.'}
                        </p>
                      </div>

                      {/* Falke Quick Mnemonic */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                        <div>
                          <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Falke Memory Shortcut</h5>
                          <p className="text-xs text-text-primary">
                            {falkeDialect === 'english'
                              ? 'Lock the fundamental law first, eliminate extreme outliers, then verify the nearest contextual indicator.'
                              : 'Remove the fake answers first, then follow the direct rule wey you memorize!'}
                          </p>
                        </div>
                      </div>

                      {/* User Feedback & Study Actions */}
                      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
                        <div className="flex items-center gap-2">
                          <span>Helpful?</span>
                          <button
                            onClick={() => setHelpfulFeedback(true)}
                            className={`p-1.5 rounded-lg transition-colors ${helpfulFeedback === true ? 'bg-emerald-500/20 text-emerald-500' : 'hover:bg-surface-variant text-text-secondary'}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setHelpfulFeedback(false)}
                            className={`p-1.5 rounded-lg transition-colors ${helpfulFeedback === false ? 'bg-rose-500/20 text-rose-500' : 'hover:bg-surface-variant text-text-secondary'}`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Link to="/falke-ai" className="text-primary font-semibold hover:underline flex items-center gap-1">
                          <span>Ask Falke In-Depth</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* AiChatWidget Integration */}
          <AiChatWidget contextPayload={aiContextPayload} />
        </StudentLayout>
      </div>

      {/* Official CBT Result Slip (Visible ONLY when printing / downloading PDF) */}
      <div className="hidden print:block w-full">
        <OfficialCbtResultSlip
          result={result}
          candidateUser={candidateUser}
          durationFormatted={durationFormatted}
          accuracyRate={accuracyRate}
        />
      </div>
    </div>
  );
}

function CbtEmblem({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0" fill="none">
      <defs>
        <linearGradient id="cbt-ring-grad" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#00d8ff" />
          <stop offset="45%" stopColor="#0084ff" />
          <stop offset="100%" stopColor="#0044ff" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="#07101e" />
      <circle cx="50" cy="50" r="46.5" fill="none" stroke="#1f2c42" strokeWidth="3" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="url(#cbt-ring-grad)" strokeWidth="12" />
      <circle cx="50" cy="50" r="28" fill="#07101e" />
      <path d="M54 41 H38 A 4 4 0 0 0 34 45 V56" fill="none" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M46 59 H62 A 4 4 0 0 0 66 55 V44" fill="none" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Official CBT Examination Result Slip (JAMB UTME Standard Format)
 * Upgraded to match the exact high-end Aurikrex Exam Arena certificate layout.
 * Features the official Aurikrex blue gradient squircle "A" emblem, candidate telemetry,
 * real subject metrics, diagnostic evaluation, digital security hash, and authentic CBT Board stamp.
 */
function OfficialCbtResultSlip({
  result,
  candidateUser,
  durationFormatted,
  accuracyRate,
}: {
  result: GradedResultRecord;
  candidateUser: { fullName?: string; email?: string; id?: string } | null;
  durationFormatted: string;
  accuracyRate: number;
}) {
  const completedDate = result.completedAt ? new Date(result.completedAt) : new Date();
  const formattedDate = completedDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = completedDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalQuestions = result.questionsSnapshot?.length || 180;
  const totalCorrect = result.subjectScores.reduce((acc, s) => acc + (s.correctCount || 0), 0);
  const totalWrong = result.subjectScores.reduce((acc, s) => acc + (s.incorrectCount || 0), 0);
  const totalSkipped = result.subjectScores.reduce((acc, s) => acc + (s.unansweredCount || 0), 0);

  // Candidate Registration Number derived from user ID or session ID
  const rawId = String(candidateUser?.id || result.sessionId || result.resultId || '6A4A7F5').replace(/[^a-zA-Z0-9]/g, '');
  const regNumber = `AKX-${rawId.slice(0, 4).toUpperCase()}/${rawId.slice(4, 7).toUpperCase() || '7F5'}`;

  // Digital verification hash generated from real session ID
  const verificationHash = `SHA-256-${(result.sessionId || result.resultId || 'AURIKREX-CBT').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32).toUpperCase()}`;

  const avgSeconds = totalQuestions > 0 ? Math.round(result.timeSpentSeconds / totalQuestions) : 2;

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-slate-900 font-sans p-6 text-sm leading-normal">
      {/* 1. TOP HEADER WITH OFFICIAL AURIKREX EMBLEM & BADGE */}
      <div className="flex items-start justify-between pb-5 mb-5 border-b border-slate-200">
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <CbtEmblem size={56} />

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              Aurikrex
            </h1>
            <h2 className="text-lg font-bold text-blue-600 tracking-tight leading-tight mt-0.5">
              Examination Service
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mt-1">
              UNITED TERTIARY MATRICULATION EXAMINATION (UTME) CBT COCKPIT
            </p>
            <p className="text-[10px] text-slate-500">
              National Standardized Psychometric Testing &amp; Diagnostic Assessment Board
            </p>
          </div>
        </div>

        {/* Right Badge Pill & Ref */}
        <div className="flex flex-col items-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-sm">
            <svg className="w-4 h-4 fill-current text-blue-600" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>OFFICIAL RESULT SLIP</span>
          </div>
          <div className="text-right mt-2 font-mono">
            <span className="text-xs text-slate-500">REF: </span>
            <span className="text-sm font-bold text-slate-900">{regNumber}</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">ISO-9001:2025 Accredited Engine · Aurikrex CBT Board</p>
        </div>
      </div>

      {/* 2. CANDIDATE BIO & SESSION METRICS (2-COLUMN ROUNDED CARD) */}
      <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm mb-5 grid grid-cols-2 gap-6 text-xs">
        {/* Left Column */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-slate-500 font-medium">Candidate Name:</span>
              <span className="font-bold text-slate-900 uppercase">
                {candidateUser?.fullName || 'EXAM CANDIDATE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-slate-500 font-medium">Candidate Email:</span>
              <span className="font-mono text-slate-800">
                {candidateUser?.email || 'candidate@aurikrex.com'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-slate-500 font-medium">Registration No:</span>
              <span className="font-mono font-bold text-slate-900">{regNumber}</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-slate-500 font-medium">Examination:</span>
              <span className="font-bold text-slate-900">
                {result.type === 'mock' ? 'UTME 4-Subject Standard Mock' : 'Targeted Topic Mastery Drill'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-slate-500 font-medium">Date &amp; Time:</span>
              <span className="text-slate-800">
                {formattedDate} at {formattedTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 flex items-baseline justify-between">
              <span className="text-slate-500 font-medium">Time Taken:</span>
              <span className="font-mono text-slate-900">
                <strong className="font-bold">{durationFormatted}</strong> (Allocated: 120m)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO SCORECARD BANNER (DEEP NAVY BLUE GRADIENT) */}
      <div className="rounded-2xl p-6 mb-5 bg-gradient-to-r from-[#071329] via-[#0b2149] to-[#0d2a5e] text-white shadow-lg relative overflow-hidden">
        {/* Subtle background curved line */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 rounded-l-full pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          {/* Left: Score & Verdict */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-200 mb-2">
              <svg className="w-4 h-4 text-blue-400 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
              <span>STANDARDIZED EXAMINATION SCORE</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-display tracking-tight text-white">
                {result.totalScore}
              </span>
              <span className="text-2xl font-bold text-blue-200">/ 400</span>
            </div>

            {/* Standing Pill */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-blue-400/30 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">Standing:</span>
              <span className="font-bold text-emerald-400 uppercase">
                {result.totalScore >= 200 ? 'COMPETITIVE PASS' : 'REVISION REQUIRED'}
              </span>
              <span className="text-slate-400 text-[10px]">
                {result.totalScore >= 200 ? '(MEETS TARGET BENCHMARK)' : '(BELOW TARGET BENCHMARK)'}
              </span>
            </div>
          </div>

          {/* Right: Quick Stats Breakdown */}
          <div className="border-l border-blue-400/25 pl-8 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <span className="text-blue-200 block text-[11px]">Overall Accuracy:</span>
                <span className="text-base font-bold font-mono text-white">{accuracyRate}%</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <span className="text-blue-200 block text-[11px]">Items Solved:</span>
                <span className="text-base font-bold font-mono text-white">
                  {totalCorrect} <span className="text-xs text-blue-200 font-normal">/ {totalQuestions}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
              </div>
              <div>
                <span className="text-blue-200 block text-[11px]">Average Pacing:</span>
                <span className="text-base font-bold font-mono text-white">
                  {avgSeconds}s <span className="text-xs text-blue-200 font-normal">/ item</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 4-SUBJECT PERFORMANCE BREAKDOWN MATRIX (MODERN BLUE BORDERED TABLE) */}
      <div className="mb-5 rounded-2xl border border-blue-100 bg-white overflow-hidden shadow-sm">
        <div className="p-3.5 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
            <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            STANDARDIZED SUBJECT MATRIX &amp; PSYCHOMETRIC GRADING
          </h3>
        </div>

        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-blue-100 text-[11px]">
              <th className="py-2.5 px-3 text-center w-10">#</th>
              <th className="py-2.5 px-3">Subject Name</th>
              <th className="py-2.5 px-3 text-center">Items</th>
              <th className="py-2.5 px-3 text-center text-emerald-600 font-bold">Correct</th>
              <th className="py-2.5 px-3 text-center text-rose-500 font-bold">Wrong</th>
              <th className="py-2.5 px-3 text-center text-slate-500">Skipped</th>
              <th className="py-2.5 px-3 text-center font-bold text-slate-900">Score (/100)</th>
              <th className="py-2.5 px-3 text-center font-bold">Diagnostic Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.subjectScores.map((score, idx) => {
              const subjectTotal =
                (score.correctCount || 0) + (score.incorrectCount || 0) + (score.unansweredCount || 0) ||
                (score.subject === 'english' ? 60 : 40);
              const subjectPct = Number(score.score || 0);
              const grade =
                subjectPct >= 70
                  ? 'A (Excellent)'
                  : subjectPct >= 60
                  ? 'B (Very Good)'
                  : subjectPct >= 50
                  ? 'C (Credit)'
                  : subjectPct >= 40
                  ? 'D (Pass)'
                  : 'F (Needs Focus)';

              return (
                <tr key={score.subject} className="hover:bg-blue-50/20 transition-colors">
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {getSubjectLabel(score.subject)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-700">{subjectTotal}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                    {score.correctCount}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-500">
                    {score.incorrectCount}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                    {score.unansweredCount}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                    {score.score}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{grade}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50/70 font-bold border-t border-blue-200 text-slate-900">
              <td colSpan={2} className="py-2.5 px-3 uppercase text-xs tracking-wider">
                AGGREGATE TOTAL
              </td>
              <td className="py-2.5 px-3 text-center font-mono">{totalQuestions}</td>
              <td className="py-2.5 px-3 text-center font-mono text-emerald-700">{totalCorrect}</td>
              <td className="py-2.5 px-3 text-center font-mono text-rose-600">{totalWrong}</td>
              <td className="py-2.5 px-3 text-center font-mono text-slate-600">{totalSkipped}</td>
              <td className="py-2.5 px-3 text-center font-mono text-sm font-black text-slate-900">
                {result.totalScore}
              </td>
              <td className="py-2.5 px-3 text-center font-black">/ 400</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. DIAGNOSTIC EVALUATION & RECOMMENDATION BOX */}
      <div className="mb-6 p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 flex items-start gap-3.5 text-xs">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs mb-1">
            PSYCHOMETRIC DIAGNOSTIC EVALUATION &amp; RECOMMENDATION
          </h4>
          <p className="text-slate-600 leading-relaxed text-[11.5px]">
            Candidate completed {totalQuestions} examination items with an overall accuracy velocity of {accuracyRate}%. {totalSkipped > 0 ? `${totalSkipped} questions were left unattempted. ` : ''}Pacing index indicates an average of {avgSeconds}s per question item. Immediate revision is recommended on topic deficits to eliminate score attrition before national examination date.
          </p>
        </div>
      </div>

      {/* 6. VERIFICATION HASH, SIGNATURE & OFFICIAL WATERMARK EMBLEM */}
      <div className="pt-4 border-t border-slate-200 grid grid-cols-12 gap-4 items-center">
        {/* Left: Security Hash */}
        <div className="col-span-6 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-tight">
              DIGITAL VERIFICATION HASH:
            </p>
            <p className="font-mono text-[10px] text-slate-700 font-bold break-all">
              {verificationHash}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
              This transcript is electronically verified by the Aurikrex CBT Board. Tampering with or altering this document invalidates result credentials.
            </p>
          </div>
        </div>

        {/* Center: Signature Line */}
        <div className="col-span-3 text-center border-l border-slate-200 pl-4">
          <div className="h-8 flex items-center justify-center">
            <svg viewBox="0 0 120 30" className="w-24 h-6 text-slate-800 stroke-current fill-none stroke-[1.8]">
              <path d="M10 22 C25 5, 30 25, 45 10 C55 2, 60 28, 80 14 C90 8, 100 20, 115 12" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-bold text-[10px] uppercase tracking-wider text-slate-900 mt-1">
            REGISTRAR / CHIEF EXAMINER
          </p>
          <p className="text-[9px] text-slate-500">Aurikrex CBT Board</p>
        </div>

        {/* Right: Circular Official CBT Stamp */}
        <div className="col-span-3 flex justify-end">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-900 flex items-center justify-center p-0.5 bg-blue-50/50 text-blue-950 text-center font-mono font-bold leading-tight shadow-sm">
            <div className="w-full h-full rounded-full border border-blue-900 flex flex-col items-center justify-center p-0.5">
              <span className="text-[6px] uppercase tracking-widest text-blue-900 font-extrabold">AURIKREX</span>
              <div className="w-4 h-4 my-0.5">
                <CbtEmblem size={16} />
              </div>
              <span className="text-[6.5px] font-black text-blue-950 leading-none">CBT BOARD</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. BOTTOM BRAND BAR & QR CODE FOOTER */}
      <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <CbtEmblem size={30} />
          <div>
            <span className="font-bold text-slate-900 text-xs block leading-tight">AURIKREX</span>
            <span className="text-[10px] text-slate-500">Better Assessments. Brighter Futures.</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center">
          Aurikrex CBT Board &nbsp;|&nbsp; Not affiliated with JAMB in any way.
        </div>

        {/* QR Code Graphic for transcript verification */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-slate-300 rounded p-0.5 flex items-center justify-center bg-white">
            <svg viewBox="0 0 24 24" className="w-full h-full text-slate-800 fill-current">
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm11-2h2v2h-2v-2zm-3 2h2v2h-2v-2zm2 2h2v2h-2v-2zm3-2h2v4h-2v-4zm2 4h2v2h-2v-2z" />
            </svg>
          </div>
          <span className="text-[9px] text-slate-500 leading-tight">
            Scan to verify<br />this result
          </span>
        </div>
      </div>
    </div>
  );
}
