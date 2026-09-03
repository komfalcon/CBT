import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamSession, saveExamAnswers, submitExamSession, ExamQuestion } from './api';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronRightSquare,
  Clock,
  Flag,
  Grid,
  Keyboard,
  Layers3,
  Loader2,
  Monitor,
  Send,
  ShieldCheck,
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { QuestionCard } from '../../components/QuestionCard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { getSubjectLabel } from '../../constants/subjects';

const DESKTOP_BREAKPOINT = 768;
const CALCULATOR_WIDTH = 288;
const CALCULATOR_HEIGHT = 360;

const getDefaultCalcPosition = () => ({
  x: Math.max(12, window.innerWidth - CALCULATOR_WIDTH - 20),
  y: Math.max(76, Math.min(120, window.innerHeight - CALCULATOR_HEIGHT - 20)),
});

export default function ExamConsole() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);

  // Active state
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(7200);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= DESKTOP_BREAKPOINT);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Modal and Alert states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [alertConfig, setAlertConfig] = useState<{ show: boolean; title: string; message: string; onConfirm?: () => void } | null>(null);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({ show: true, title, message, onConfirm });
  };

  // Calculator states
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [calcPosition, setCalcPosition] = useState(getDefaultCalcPosition);
  const [isDraggingCalc, setIsDraggingCalc] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleCalcPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' && window.innerWidth >= DESKTOP_BREAKPOINT) return;
    e.preventDefault();
    setIsDraggingCalc(true);
    setDragStart({
      x: e.clientX - calcPosition.x,
      y: e.clientY - calcPosition.y
    });
  };

  const handleCalcPointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingCalc) return;
    const newX = Math.max(8, Math.min(window.innerWidth - CALCULATOR_WIDTH - 8, e.clientX - dragStart.x));
    const newY = Math.max(72, Math.min(window.innerHeight - CALCULATOR_HEIGHT - 8, e.clientY - dragStart.y));
    setCalcPosition({ x: newX, y: newY });
  }, [isDraggingCalc, dragStart]);

  const handleCalcPointerUp = useCallback(() => {
    setIsDraggingCalc(false);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      setIsSidebarOpen(isDesktop);
      setCalcPosition((prev) => ({
        x: Math.max(8, Math.min(window.innerWidth - CALCULATOR_WIDTH - 8, prev.x)),
        y: Math.max(72, Math.min(window.innerHeight - CALCULATOR_HEIGHT - 8, prev.y)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDraggingCalc) {
      window.addEventListener('pointermove', handleCalcPointerMove);
      window.addEventListener('pointerup', handleCalcPointerUp);
      window.addEventListener('pointercancel', handleCalcPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleCalcPointerMove);
      window.removeEventListener('pointerup', handleCalcPointerUp);
      window.removeEventListener('pointercancel', handleCalcPointerUp);
    };
  }, [isDraggingCalc, handleCalcPointerMove, handleCalcPointerUp]);

  const handleCalcBtnClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === 'Back') {
      setCalcInput((prev) => prev.slice(0, -1));
    } else if (val === '=') {
      try {
        const expression = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
        if (!/^[0-9.+\-*/%()\s]*$/.test(expression)) {
          setCalcResult('Error');
          return;
        }
        // eslint-disable-next-line no-eval
        const res = eval(expression);
        if (isNaN(res) || !isFinite(res)) {
          setCalcResult('Error');
        } else {
          setCalcResult(String(Number(res.toFixed(8))));
        }
      } catch (err) {
        setCalcResult('Error');
      }
    } else if (val === '√') {
      try {
        const num = parseFloat(calcInput || '0');
        if (num < 0) {
          setCalcResult('Error');
        } else {
          const res = Math.sqrt(num);
          setCalcInput(`√(${num})`);
          setCalcResult(String(Number(res.toFixed(8))));
        }
      } catch {
        setCalcResult('Error');
      }
    } else {
      setCalcInput((prev) => prev + val);
    }
  };

  const token = useMemo(() => localStorage.getItem('accessToken') || '', []);

  // Fetch session details on mount
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await getExamSession(token, sessionId);
        if (data.status === 'completed') {
          // If already completed, redirect to review or results list
          showAlert('Session Completed', 'This exam session has already been submitted.', () => {
            navigate('/dashboard');
          });
          return;
        }
        setSession(data);
        // A console instance must never carry review state across sessions.
        setFlaggedQuestions(new Set());
        setAnswers(data.answers ?? {});
        setTimeRemaining(data.timeRemaining);
        if (data.subjects && data.subjects.length > 0) {
          setActiveSubject(data.subjects[0]);
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load active exam session.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, token, navigate]);

  // Filtered questions list for the active subject
  const currentSubjectQuestions = useMemo(() => {
    if (!session || !session.questions) return [];
    return session.questions.filter((q: ExamQuestion) => q.subject === activeSubject);
  }, [session, activeSubject]);

  const activeQuestion = useMemo<ExamQuestion | null>(() => {
    if (currentSubjectQuestions.length === 0) return null;
    return currentSubjectQuestions[activeQuestionIndex] || currentSubjectQuestions[0];
  }, [currentSubjectQuestions, activeQuestionIndex]);

  // Timer Countdown Logic
  useEffect(() => {
    if (loading || submitting || error || !session) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          autoSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, submitting, error, session]);

  // Trigger submission automatically when clock reaches 0
  const autoSubmitExam = async () => {
    if (!sessionId) return;
    try {
      setSubmitting(true);
      const result = await submitExamSession(token, sessionId);
      navigate(`/results/${result.resultId || result.id}`);
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    }
  };

  // periodic Auto-Save Heartbeat (every 10 seconds)
  useEffect(() => {
    if (loading || submitting || !sessionId || !session) return;
    const interval = setInterval(async () => {
      try {
        await saveExamAnswers(token, sessionId, answers, timeRemaining);
        setLastSaved(new Date());
      } catch (err) {
        console.warn('Auto-save heartbeat failed:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loading, submitting, sessionId, token, answers, timeRemaining, session]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionId };
      // Save instantly to database
      saveExamAnswers(token, sessionId!, updated, timeRemaining)
        .then(() => setLastSaved(new Date()))
        .catch((err) => console.warn('Instant save failed:', err));
      return updated;
    });
  };

  const handleNext = useCallback(() => {
    if (activeQuestionIndex < currentSubjectQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    } else {
      // Go to next subject if possible
      const currentSubjectIdx = session.subjects.indexOf(activeSubject);
      if (currentSubjectIdx < session.subjects.length - 1) {
        const nextSub = session.subjects[currentSubjectIdx + 1];
        setActiveSubject(nextSub);
        setActiveQuestionIndex(0);
      }
    }
  }, [activeQuestionIndex, currentSubjectQuestions, session, activeSubject]);

  const handlePrev = useCallback(() => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
    } else {
      // Go to previous subject if possible
      const currentSubjectIdx = session.subjects.indexOf(activeSubject);
      if (currentSubjectIdx > 0) {
        const prevSub = session.subjects[currentSubjectIdx - 1];
        setActiveSubject(prevSub);
        // Find length of previous subject questions
        const prevSubQsCount = session.questions.filter((q: any) => q.subject === prevSub).length;
        setActiveQuestionIndex(prevSubQsCount - 1);
      }
    }
  }, [activeQuestionIndex, session, activeSubject]);

  const isLastQuestion = useMemo(() => {
    if (!session || !session.subjects || !activeSubject || currentSubjectQuestions.length === 0) return false;
    const isLastSubject = session.subjects.indexOf(activeSubject) === session.subjects.length - 1;
    const isLastQuestionInSubject = activeQuestionIndex === currentSubjectQuestions.length - 1;
    return isLastSubject && isLastQuestionInSubject;
  }, [session, activeSubject, activeQuestionIndex, currentSubjectQuestions]);

  const handleNextClick = useCallback(() => {
    if (isLastQuestion) {
      setShowSubmitModal(true);
    } else {
      handleNext();
    }
  }, [isLastQuestion, handleNext]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || submitting) return;
      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D', 'E'].includes(key) && activeQuestion) {
        handleSelectOption(activeQuestion.questionId, key);
      } else if (e.key === 'ArrowRight' || key === 'N') {
        handleNextClick();
      } else if (e.key === 'ArrowLeft' || key === 'P') {
        handlePrev();
      } else if (key === 'S' && e.altKey) {
        handleSubmitClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, submitting, activeQuestion, handleNextClick, handlePrev]);

  const toggleFlaggedQuestion = useCallback((questionId: string) => {
    setFlaggedQuestions((previous) => {
      const next = new Set(previous);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const handleSubmitClick = () => {
    setSubmitError('');
    setShowSubmitModal(true);
  };

  const executeSubmit = async () => {
    if (!sessionId) return;
    try {
      setSubmitting(true);
      setSubmitError('');
      const result = await submitExamSession(token, sessionId);
      navigate(`/results/${result.resultId || result.id}`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Submission failed.');
      setSubmitting(false);
    }
  };

  // Time formatter
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const formatSavedTime = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-text-primary">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-text-secondary">Assembling exam questions from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-text-primary p-6">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold mb-2">Error Loading Exam</h2>
        <p className="text-sm text-text-secondary mb-6 text-center max-w-sm">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const answeredInActiveSubject = currentSubjectQuestions.filter(
    (q: ExamQuestion) => !!answers[q.questionId],
  ).length;

  const currentSubjectIndex = session.subjects.indexOf(activeSubject);
  const isFirstQuestion = currentSubjectIndex === 0 && activeQuestionIndex === 0;
  const totalAnswered = session.questions.filter((question: ExamQuestion) => !!answers[question.questionId]).length;
  const totalFlagged = flaggedQuestions.size;
  const sessionProgress = session.questions.length ? Math.round((totalAnswered / session.questions.length) * 100) : 0;

  return (
    <div className="exam-shell min-h-screen bg-bg-primary text-text-primary font-sans">
      <div className="exam-shell-glow exam-shell-glow-top" />
      <div className="exam-shell-glow exam-shell-glow-bottom" />

      <header className="exam-header sticky top-0 z-30 border-b border-border/80 bg-bg-primary/92 px-5 backdrop-blur-xl xl:px-8">
        <div className="mx-auto flex min-h-[76px] max-w-[1640px] items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="exam-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_0_6px_rgba(91,114,255,0.06)]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="exam-eyebrow">JAMB CBT / Live session</p>
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-black tracking-[-0.02em] text-text-primary sm:text-base">
                  {session.type === 'mock' ? 'Full Mock Exam' : 'Subject Drill'}
                </h1>
                <span className="hidden h-1 w-1 rounded-full bg-text-muted sm:block" />
                <span className="hidden truncate text-xs font-medium text-text-muted sm:block">Secure testing workspace</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {lastSaved && (
              <div className="hidden items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs font-semibold text-success lg:flex" title={`Answers last saved at ${formatSavedTime(lastSaved)}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Saved {formatSavedTime(lastSaved)}
              </div>
            )}
            <div className={`exam-timer flex items-center gap-2 rounded-2xl border px-3 py-2 font-mono text-sm font-black tabular-nums sm:px-4 ${timeRemaining < 300 ? 'exam-timer-danger' : ''}`} aria-label={`Time remaining ${formatTime(timeRemaining)}`}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{formatTime(timeRemaining)}</span>
              <span className="hidden text-[10px] font-sans font-bold uppercase tracking-[0.14em] opacity-70 sm:inline">remaining</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCalculator((previous) => !previous)}
              className={`exam-toolbar-button hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:flex ${showCalculator ? 'border-primary bg-primary/15 text-primary shadow-[0_8px_24px_rgba(91,114,255,0.16)]' : 'border-border bg-bg-secondary/55 text-text-secondary hover:border-primary/40 hover:text-text-primary'}`}
              title="Toggle calculator"
              aria-pressed={showCalculator}
            >
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" /> Calculator
            </button>
            <ThemeToggle className="h-9 w-9 rounded-xl p-2" />
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={submitting}
              className="exam-submit-button inline-flex items-center gap-2 rounded-xl border border-rose-500/60 bg-rose-600 px-3.5 py-2.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(225,29,72,0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-500 hover:shadow-[0_14px_30px_rgba(225,29,72,0.3)] active:scale-95 disabled:pointer-events-none disabled:opacity-50 sm:px-4"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="hidden sm:inline">Submit Exam</span>
              <span className="sm:hidden">Submit</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-[1640px]">
        <main className="min-w-0 flex-1 px-5 py-6 xl:px-8 xl:py-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="exam-eyebrow">Your test plan</p>
              <h2 className="mt-1 font-display text-2xl font-black tracking-[-0.05em] text-text-primary xl:text-3xl">Stay focused. One question at a time.</h2>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">Session progress</p>
                <p className="mt-1 text-sm font-black text-text-primary">{totalAnswered} <span className="font-medium text-text-muted">of {session.questions.length}</span></p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">Flagged</p>
                <p className="mt-1 text-sm font-black text-amber-500">{totalFlagged}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-bg-secondary/35 p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
            <div className="flex gap-1 overflow-x-auto">
              {session.subjects.map((sub: string) => {
                const isActive = sub === activeSubject;
                const subjectQuestions = session.questions.filter((question: ExamQuestion) => question.subject === sub);
                const subjectAnswered = subjectQuestions.filter((question: ExamQuestion) => !!answers[question.questionId]).length;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setActiveSubject(sub);
                      setActiveQuestionIndex(0);
                    }}
                    className={`group flex min-w-[145px] flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-[background-color,border-color,box-shadow,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive ? 'border border-primary/35 bg-primary text-white shadow-[0_10px_24px_rgba(91,114,255,0.22)]' : 'border border-transparent text-text-secondary hover:border-border hover:bg-bg-primary/70 hover:text-text-primary'}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black">{getSubjectLabel(sub)}</span>
                      <span className={`mt-1 block text-[10px] font-semibold ${isActive ? 'text-white/70' : 'text-text-muted'}`}>{subjectAnswered}/{subjectQuestions.length} answered</span>
                    </span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${subjectAnswered === subjectQuestions.length ? 'bg-success' : isActive ? 'bg-white/80' : 'bg-text-muted/60'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {activeQuestion ? (
            <div className="exam-content-frame">
              <div className="mb-3 flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <Layers3 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>{getSubjectLabel(activeSubject)} / Question {activeQuestionIndex + 1}</span>
                </div>
                <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted sm:flex"><Keyboard className="h-3.5 w-3.5" aria-hidden="true" /> A–E to answer</span>
              </div>

              <QuestionCard
                question={activeQuestion}
                index={activeQuestionIndex}
                totalCount={currentSubjectQuestions.length}
                selectedOption={answers[activeQuestion.questionId]}
                onSelectOption={(optionId) => handleSelectOption(activeQuestion.questionId, optionId)}
                isFlagged={flaggedQuestions.has(activeQuestion.questionId)}
                onToggleFlag={() => toggleFlaggedQuestion(activeQuestion.questionId)}
              />

              <div className="mt-6 flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isFirstQuestion}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-secondary/55 px-4 py-3 text-xs font-black text-text-secondary transition-[background-color,border-color,color,transform] duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-text-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
                </button>
                <div className="order-first flex items-center gap-2 text-center text-[11px] font-semibold text-text-muted sm:order-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Changes save automatically
                </div>
                <button
                  type="button"
                  onClick={handleNextClick}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black text-white shadow-[0_10px_24px_rgba(91,114,255,0.2)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${isLastQuestion ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-500' : 'bg-primary hover:bg-primary-hover'}`}
                >
                  {isLastQuestion ? 'Review & submit' : 'Next question'}
                  {isLastQuestion ? <Send className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-bg-secondary/25 p-12 text-center text-sm text-text-muted">No questions mapped to this subject.</div>
          )}
        </main>

        {isSidebarOpen && (
          <button type="button" aria-label="Close subject navigator" className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
        <aside className={`exam-navigator fixed inset-y-0 right-0 z-50 w-[88%] max-w-sm border-l border-border bg-bg-primary px-5 pb-6 pt-24 shadow-[-20px_0_60px_rgba(0,0,0,0.18)] transition-transform duration-300 md:sticky md:top-[76px] md:z-10 md:h-[calc(100vh-76px)] md:w-[320px] md:max-w-none md:translate-x-0 md:border-l md:bg-bg-primary/65 md:px-6 md:pt-7 md:shadow-none ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <p className="exam-eyebrow">Question map</p>
              <h3 className="mt-1 text-base font-black tracking-[-0.03em] text-text-primary">Navigator</h3>
            </div>
            <button type="button" className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-text-primary md:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigator"><ChevronRightSquare className="h-5 w-5" /></button>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-bg-secondary/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-text-secondary">{getSubjectLabel(activeSubject)}</span>
              <span className="text-xs font-black text-primary">{answeredInActiveSubject}/{currentSubjectQuestions.length}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-primary">
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${currentSubjectQuestions.length ? (answeredInActiveSubject / currentSubjectQuestions.length) * 100 : 0}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-text-muted"><span>Current subject</span><span>{sessionProgress}% session complete</span></div>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-5 gap-2.5">
              {currentSubjectQuestions.map((question: ExamQuestion, idx: number) => {
                const isSelected = activeQuestionIndex === idx;
                const isAnswered = !!answers[question.questionId];
                const isFlagged = flaggedQuestions.has(question.questionId);
                return (
                  <button
                    key={question.questionId}
                    type="button"
                    onClick={() => {
                      setActiveQuestionIndex(idx);
                      if (window.innerWidth < DESKTOP_BREAKPOINT) setIsSidebarOpen(false);
                    }}
                    className={`relative flex h-11 w-full items-center justify-center rounded-xl border text-xs font-black transition-[background-color,border-color,box-shadow,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 ${isSelected ? 'border-primary bg-primary text-white shadow-[0_8px_18px_rgba(91,114,255,0.26)] ring-2 ring-primary/20' : isFlagged ? 'border-amber-400/60 bg-amber-400/10 text-amber-500 hover:bg-amber-400/15' : isAnswered ? 'border-primary/30 bg-primary/12 text-primary hover:border-primary/60 hover:bg-primary/15' : 'border-border bg-bg-primary/55 text-text-muted hover:border-primary/35 hover:bg-bg-secondary hover:text-text-primary'}`}
                    aria-label={`Question ${idx + 1}${isAnswered ? ', answered' : ', unanswered'}${isFlagged ? ', flagged for review' : ''}`}
                    aria-current={isSelected ? 'step' : undefined}
                  >
                    {idx + 1}
                    {isFlagged && !isSelected && <Flag className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-bg-primary text-amber-500" fill="currentColor" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-border/70 pt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">Status key</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[11px] font-semibold text-text-secondary">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-md border border-primary/40 bg-primary/15" /> Answered</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-md border border-border bg-bg-primary" /> Unanswered</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-md border-2 border-primary bg-primary/15" /> Current</span>
              <span className="flex items-center gap-2"><Flag className="h-3 w-3 text-amber-500" fill="currentColor" /> Flagged</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-[11px] leading-5 text-text-muted"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> Your answers are saved as you move.</div>
          </div>
        </aside>
      </div>

      <button type="button" onClick={() => setIsSidebarOpen((previous) => !previous)} className="fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary text-white shadow-[0_14px_30px_rgba(91,114,255,0.28)] md:hidden" title="Toggle question navigator" aria-label="Toggle question navigator"><Monitor className="h-4 w-4" aria-hidden="true" /></button>

      {/* Custom Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-bg-primary backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-secondary border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <AlertTriangle className="h-5 w-5 text-rose-550" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Submit Exam</h3>
                <p className="text-xs text-text-secondary">Confirmation Required</p>
              </div>
            </div>
            
            <p className="text-sm text-text-secondary leading-normal">
              Are you sure you want to submit your exam? You cannot change your choices after submitting.
            </p>

            {submitError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {submitError}
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSubmitError('');
                }}
                disabled={submitting}
                className="rounded-xl border border-border bg-bg-primary px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeSubmit}
                disabled={submitting}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-text-primary flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/10 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    Submitting <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </>
                ) : (
                  <>
                    Confirm Submit <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertConfig && alertConfig.show && (
        <div className="fixed inset-0 bg-bg-primary backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-secondary border border-border rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-primary">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">{alertConfig.title}</h3>
              </div>
            </div>
            
            <p className="text-sm text-text-secondary leading-normal">
              {alertConfig.message}
            </p>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  const onConfirm = alertConfig.onConfirm;
                  setAlertConfig(null);
                  if (onConfirm) onConfirm();
                }}
                className="rounded-xl bg-primary hover:bg-primary-hover px-6 py-2.5 text-xs font-bold text-text-primary transition-all shadow-lg shadow-primary/10"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Draggable Calculator */}
      {showCalculator && (
        <div
          style={{
            position: 'fixed',
            left: `${calcPosition.x}px`,
            top: `${calcPosition.y}px`,
            zIndex: 40,
          }}
          className="w-72 bg-bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Drag Bar */}
          <div
            onPointerDown={handleCalcPointerDown}
            className="bg-bg-primary px-4 py-2.5 flex items-center justify-between cursor-move touch-none border-b border-border"
          >
            <div className="flex items-center gap-2 text-primary">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Calculator</span>
            </div>
            <button
              onClick={() => setShowCalculator(false)}
              className="text-text-secondary hover:text-text-primary text-xs font-semibold px-1.5 py-0.5 rounded hover:bg-bg-secondary transition-colors animate-all"
            >
              ✕
            </button>
          </div>

          {/* Calculator Screen */}
          <div className="p-4 bg-bg-primary border-b border-border text-right font-mono flex flex-col justify-end min-h-[88px] break-all">
            <div className="text-sm text-text-secondary overflow-x-auto whitespace-nowrap min-h-[20px] pb-0.5">{calcInput || '0'}</div>
            <div className="text-3xl font-black text-text-primary overflow-x-auto whitespace-nowrap pt-1 min-h-[40px] tracking-tight">{calcResult || '–'}</div>
          </div>

          {/* Calculator Keyboard */}
          <div className="p-3 grid grid-cols-4 gap-1.5 bg-bg-secondary">
            {/* Row 1 */}
            <button
              onClick={() => handleCalcBtnClick('C')}
              className="col-span-2 h-10 rounded-lg bg-rose-950/30 border border-rose-900/20 text-rose-400 font-bold hover:bg-rose-950/50 hover:border-rose-500/30 transition-all text-xs"
            >
              CLEAR
            </button>
            <button
              onClick={() => handleCalcBtnClick('Back')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-secondary hover:bg-bg-card transition-all text-xs flex items-center justify-center font-bold"
            >
              ⌫
            </button>
            <button
              onClick={() => handleCalcBtnClick('÷')}
              className="h-10 rounded-lg bg-bg-secondary/40 border border-border/50 text-primary font-bold hover:bg-bg-secondary transition-all"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleCalcBtnClick('7')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              7
            </button>
            <button
              onClick={() => handleCalcBtnClick('8')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              8
            </button>
            <button
              onClick={() => handleCalcBtnClick('9')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              9
            </button>
            <button
              onClick={() => handleCalcBtnClick('*')}
              className="h-10 rounded-lg bg-bg-secondary/40 border border-border/50 text-primary font-bold hover:bg-bg-secondary transition-all"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleCalcBtnClick('4')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              4
            </button>
            <button
              onClick={() => handleCalcBtnClick('5')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              5
            </button>
            <button
              onClick={() => handleCalcBtnClick('6')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              6
            </button>
            <button
              onClick={() => handleCalcBtnClick('-')}
              className="h-10 rounded-lg bg-bg-secondary/40 border border-border/50 text-primary font-bold hover:bg-bg-secondary transition-all"
            >
              -
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleCalcBtnClick('1')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              1
            </button>
            <button
              onClick={() => handleCalcBtnClick('2')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              2
            </button>
            <button
              onClick={() => handleCalcBtnClick('3')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              3
            </button>
            <button
              onClick={() => handleCalcBtnClick('+')}
              className="h-10 rounded-lg bg-bg-secondary/40 border border-border/50 text-primary font-bold hover:bg-bg-secondary transition-all"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              onClick={() => handleCalcBtnClick('0')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              0
            </button>
            <button
              onClick={() => handleCalcBtnClick('.')}
              className="h-10 rounded-lg bg-bg-card border border-border text-text-primary hover:bg-bg-card transition-all font-semibold"
            >
              .
            </button>
            <button
              onClick={() => handleCalcBtnClick('√')}
              className="h-10 rounded-lg bg-bg-secondary/40 border border-border/50 text-primary font-bold hover:bg-bg-secondary transition-all text-xs"
            >
              √
            </button>
            <button
              onClick={() => handleCalcBtnClick('=')}
              className="h-10 rounded-lg bg-primary border border-primary text-text-primary font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/10"
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
