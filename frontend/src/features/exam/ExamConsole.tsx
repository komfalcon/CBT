import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamSession, saveExamAnswers, submitExamSession, ExamQuestion } from './api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Grid,
  ChevronRightSquare,
  AlertTriangle,
  Monitor,
  Calculator,
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { QuestionCard, Button, Modal, Alert, Badge } from '../../components';
import { ThemeToggle } from '../../components/ThemeToggle';

const SUBJECT_LABELS: Record<string, string> = {
  english: 'Use of English',
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
  crk: 'CRK',
  irk: 'IRK',
  history: 'History',
  further_mathematics: 'Further Mathematics',
};

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
  const [calcPosition, setCalcPosition] = useState({ x: window.innerWidth - 340, y: 100 });
  const [isDraggingCalc, setIsDraggingCalc] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleCalcMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCalc(true);
    setDragStart({
      x: e.clientX - calcPosition.x,
      y: e.clientY - calcPosition.y
    });
  };

  const handleCalcMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingCalc) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 360, e.clientY - dragStart.y));
    setCalcPosition({ x: newX, y: newY });
  }, [isDraggingCalc, dragStart]);

  const handleCalcMouseUp = useCallback(() => {
    setIsDraggingCalc(false);
  }, []);

  useEffect(() => {
    if (isDraggingCalc) {
      window.addEventListener('mousemove', handleCalcMouseMove);
      window.addEventListener('mouseup', handleCalcMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleCalcMouseMove);
      window.removeEventListener('mouseup', handleCalcMouseUp);
    };
  }, [isDraggingCalc, handleCalcMouseMove, handleCalcMouseUp]);

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
        setAnswers(data.answers || {});
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
      navigate(`/results/${result.resultId}`);
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
      navigate(`/results/${result.resultId}`);
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

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full bg-violet-900/5 blur-[150px] pointer-events-none" />

      {/* Top Banner Control Hub */}
      <header className="border-b border-border bg-bg-primary backdrop-blur-md h-16 flex items-center justify-between px-6 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center font-bold text-sm text-text-primary">
              CBT
            </div>
            <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              JAMB UTME Simulation
            </span>
          </div>
          {lastSaved && (
            <span className="text-[10px] text-text-muted italic hidden md:inline">
              Auto-saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Glow Clock Timer */}
        <div className="flex items-center gap-6">
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-mono font-bold shadow-lg ${
              timeRemaining < 300
                ? 'border-rose-500/30 bg-rose-550/10 text-rose-450 animate-pulse'
                : 'border-primary/20 bg-bg-secondary/30 text-primary-hover'
            }`}
          >
            <Clock className={`h-4 w-4 ${timeRemaining < 300 ? 'text-rose-400' : 'text-primary'}`} />
            {formatTime(timeRemaining)}
          </div>

          <button
            onClick={() => setShowCalculator((prev) => !prev)}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-md ${
              showCalculator
                ? 'border-primary bg-primary text-text-primary shadow-primary/10'
                : 'border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
            title="Toggle Calculator"
          >
            <Calculator className="h-3.5 w-3.5" />
            Calculator
          </button>

          <ThemeToggle />

          <button
            onClick={handleSubmitClick}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-text-primary hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-600/10 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Console Grid */}
      <div className="flex-1 flex overflow-hidden z-10 relative">
        {/* Left Side: Question Pane */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
          {/* Subjects Tabs switcher */}
          <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border">
            {session.subjects.map((sub: string) => {
              const isActive = sub === activeSubject;
              const hasUnanswered = session.questions
                .filter((q: any) => q.subject === sub)
                .some((q: any) => !answers[q.questionId]);
              return (
                <button
                  key={sub}
                  onClick={() => {
                    setActiveSubject(sub);
                    setActiveQuestionIndex(0);
                  }}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? 'bg-primary text-text-primary shadow-lg shadow-primary/10'
                      : 'bg-bg-secondary border border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {SUBJECT_LABELS[sub] || sub}
                  {hasUnanswered && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Contains unanswered questions" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Question Text details Card */}
          {activeQuestion ? (
            <div className="flex-1 flex flex-col justify-between space-y-8 max-w-4xl">
              <QuestionCard
                question={activeQuestion}
                index={activeQuestionIndex}
                totalCount={currentSubjectQuestions.length}
                selectedOption={answers[activeQuestion.questionId]}
                onSelectOption={(optionId) => handleSelectOption(activeQuestion.questionId, optionId)}
              />

              {/* Navigation Controls footer */}
              <div className="flex justify-between items-center pt-6 border-t border-border mt-auto">
                <button
                  onClick={handlePrev}
                  className="rounded-xl border border-border bg-bg-secondary hover:bg-bg-secondary px-5 py-3 text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-[10px] text-text-muted font-semibold tracking-wider uppercase hidden sm:inline">
                  Keyboard shortcuts active • Press option key directly
                </span>
                <button
                  onClick={handleNextClick}
                  className={`rounded-xl px-5 py-3 text-xs font-bold text-text-primary flex items-center gap-1 transition-all ${
                    isLastQuestion ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/10' : 'bg-primary hover:bg-primary-hover'
                  }`}
                >
                  {isLastQuestion ? (
                    <>
                      Submit <Send className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-muted">No questions mapped to this subject.</p>
          )}
        </main>

        {/* Right Side: Interactive Index Grid */}
        <aside
          className={`absolute inset-y-0 right-0 md:relative border-l border-border bg-bg-primary md:bg-bg-primary backdrop-blur-xl w-[85%] max-w-sm md:w-80 p-6 flex flex-col z-50 md:z-10 transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Subjects Navigator</h3>
            </div>
            <span className="text-[10px] text-text-secondary font-bold bg-bg-secondary px-2 py-0.5 rounded border border-border">
              {answeredInActiveSubject} / {currentSubjectQuestions.length} answered
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {currentSubjectQuestions.map((q: ExamQuestion, idx: number) => {
                const isSelected = activeQuestionIndex === idx;
                const isAnswered = !!answers[q.questionId];

                return (
                  <button
                    key={q.questionId}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-9 w-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/20 text-text-primary'
                        : isAnswered
                        ? 'border-primary/30 bg-primary/20 text-primary-hover'
                        : 'border-border bg-bg-primary text-text-muted hover:border-border hover:text-text-secondary'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border space-y-2 text-[10px] text-text-muted leading-normal">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded bg-primary/20 border border-primary/30 block" />
              <span>Answered question</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded bg-bg-primary border border-border block" />
              <span>Unanswered question</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Panel toggle button */}
      <button
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-30 h-10 w-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center shadow-2xl hover:text-text-primary"
        title="Toggle Question Grid"
      >
        <Monitor className="h-4 w-4" />
      </button>

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
            onMouseDown={handleCalcMouseDown}
            className="bg-bg-primary px-4 py-2.5 flex items-center justify-between cursor-move border-b border-border"
          >
            <div className="flex items-center gap-2 text-primary">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Calculator</span>
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
