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
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

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
          alert('This exam session is already submitted.');
          navigate('/dashboard');
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

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || submitting) return;
      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D', 'E'].includes(key) && activeQuestion) {
        handleSelectOption(activeQuestion.questionId, key);
      } else if (e.key === 'ArrowRight' || key === 'N') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || key === 'P') {
        handlePrev();
      } else if (key === 'S' && e.altKey) {
        handleSubmitClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, submitting, activeQuestion, handleNext, handlePrev]);

  const handleSubmitClick = async () => {
    const confirmSubmit = window.confirm(
      'Are you sure you want to submit your exam? You cannot change your choices after submitting.',
    );
    if (!confirmSubmit || !sessionId) return;

    try {
      setSubmitting(true);
      const result = await submitExamSession(token, sessionId);
      navigate(`/results/${result.resultId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed.');
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Assembling exam questions from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold mb-2">Error Loading Exam</h2>
        <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-indigo-900/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full bg-violet-900/5 blur-[150px] pointer-events-none" />

      {/* Top Banner Control Hub */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md h-16 flex items-center justify-between px-6 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-sm text-white">
              CBT
            </div>
            <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              JAMB UTME Simulation
            </span>
          </div>
          {lastSaved && (
            <span className="text-[10px] text-slate-500 italic hidden md:inline">
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
                : 'border-indigo-500/20 bg-indigo-950/20 text-indigo-300'
            }`}
          >
            <Clock className={`h-4 w-4 ${timeRemaining < 300 ? 'text-rose-400' : 'text-indigo-400'}`} />
            {formatTime(timeRemaining)}
          </div>

          <button
            onClick={handleSubmitClick}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-600/10 disabled:opacity-50"
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
          <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-900">
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
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'bg-slate-900/40 border border-slate-900 text-slate-400 hover:text-slate-200'
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
              <div className="space-y-6">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider">
                    Question {activeQuestionIndex + 1} of {currentSubjectQuestions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    Difficulty {activeQuestion.difficulty_level}/5
                  </span>
                </div>

                {/* Question Text */}
                <div className="text-base sm:text-lg leading-relaxed text-slate-100 font-medium overflow-x-auto">
                  <Latex>{activeQuestion.question_text}</Latex>
                </div>

                {/* SVGs/Diagram Rendering */}
                {activeQuestion.has_diagram && activeQuestion.diagram_svg && (
                  <div
                    className="border border-slate-900 bg-slate-950/60 rounded-xl p-4 flex justify-center overflow-auto max-w-lg"
                    dangerouslySetInnerHTML={{ __html: activeQuestion.diagram_svg }}
                  />
                )}

                {/* Multiple choice options */}
                <div className="grid gap-3 mt-8">
                  {activeQuestion.options.map((option) => {
                    const isSelected = answers[activeQuestion.questionId] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(activeQuestion.questionId, option.id)}
                        className={`w-full text-left rounded-xl border p-4 text-sm transition-all flex gap-4 items-center group relative overflow-hidden ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-slate-850 bg-slate-900/20 text-slate-350 hover:border-slate-700 hover:bg-slate-900/40'
                        }`}
                      >
                        <span
                          className={`h-7 w-7 rounded-lg border font-bold text-xs flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500 text-white shadow-md'
                              : 'border-slate-805 bg-slate-950 text-slate-400 group-hover:border-slate-700 group-hover:text-slate-200'
                          }`}
                        >
                          {option.id}
                        </span>
                        <span className="flex-1 leading-normal font-medium overflow-x-auto"><Latex>{option.text}</Latex></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls footer */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-900 mt-auto">
                <button
                  onClick={handlePrev}
                  className="rounded-xl border border-slate-850 bg-slate-900/40 hover:bg-slate-900 px-5 py-3 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase hidden sm:inline">
                  Keyboard shortcuts active • Press option key directly
                </span>
                <button
                  onClick={handleNext}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-bold text-white flex items-center gap-1 transition-all"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">No questions mapped to this subject.</p>
          )}
        </main>

        {/* Right Side: Interactive Index Grid */}
        <aside
          className={`absolute inset-y-0 right-0 md:relative border-l border-slate-900 bg-slate-950/95 md:bg-slate-950/40 backdrop-blur-xl w-[85%] max-w-sm md:w-80 p-6 flex flex-col z-50 md:z-10 transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Subjects Navigator</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
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
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/20 text-white'
                        : isAnswered
                        ? 'border-indigo-600/30 bg-indigo-600/20 text-indigo-300'
                        : 'border-slate-900 bg-slate-950/60 text-slate-500 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-900 space-y-2 text-[10px] text-slate-500 leading-normal">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded bg-indigo-600/20 border border-indigo-600/30 block" />
              <span>Answered question</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded bg-slate-950/60 border border-slate-900 block" />
              <span>Unanswered question</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Panel toggle button */}
      <button
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-30 h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl hover:text-white"
        title="Toggle Question Grid"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
