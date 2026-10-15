import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getExamSession, saveExamAnswers, submitExamSession, evaluateExamProctoring, ExamQuestion } from './api';
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
  ShieldAlert,
  X,
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { QuestionCard } from '../../components/QuestionCard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { getSubjectLabel } from '../../constants/subjects';

const DESKTOP_BREAKPOINT = 768;
const CALCULATOR_WIDTH = 288;
const CALCULATOR_HEIGHT = 360;

function safeEvaluate(expression: string): number {
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+|[+\-*/%()])/g) || [];
  if (tokens.join('') !== expression.replace(/\s+/g, '')) throw new Error('Invalid expression');
  let index = 0;
  const parsePrimary = (): number => {
    const token = tokens[index++];
    if (token === '(') { const value = parseAdditive(); if (tokens[index++] !== ')') throw new Error('Unbalanced expression'); return value; }
    if (token === '-') return -parsePrimary();
    if (!token || !/^\d*\.?\d+$/.test(token)) throw new Error('Expected number');
    return Number(token);
  };
  const parseMultiplicative = (): number => { let value = parsePrimary(); while (['*','/','%'].includes(tokens[index])) { const op=tokens[index++]; const rhs=parsePrimary(); if ((op==='/'||op==='%') && rhs===0) throw new Error('Division by zero'); value=op==='*'?value*rhs:op==='/'?value/rhs:value%rhs; } return value; };
  const parseAdditive = (): number => { let value=parseMultiplicative(); while (['+','-'].includes(tokens[index])) { const op=tokens[index++]; const rhs=parseMultiplicative(); value=op==='+'?value+rhs:value-rhs; } return value; };
  const value=parseAdditive(); if (index !== tokens.length || !Number.isFinite(value)) throw new Error('Invalid expression'); return value;
}

const getDefaultCalcPosition = () => {
  const isMobile = window.innerWidth < 640;
  return {
    x: isMobile ? Math.max(8, (window.innerWidth - CALCULATOR_WIDTH) / 2) : Math.max(12, window.innerWidth - CALCULATOR_WIDTH - 20),
    y: Math.max(76, Math.min(120, window.innerHeight - CALCULATOR_HEIGHT - 20)),
  };
};

export default function ExamConsole() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);

  // Expired or Terminated state
  const [expiredState, setExpiredState] = useState<{
    isExpired: boolean;
    status: string;
    resultId?: string;
  } | null>(null);

  const [terminatedState, setTerminatedState] = useState<{
    reason: 'tab_switch' | 'cheating_disqualification';
    title: string;
    message: string;
    resultId?: string;
  } | null>(null);

  // Feature 2: AI Proctoring & Strike state
  const [proctorStrikes, setProctorStrikes] = useState<number>(0);
  const [proctorWarningModal, setProctorWarningModal] = useState<{
    strike: number;
    title: string;
    message: string;
    reasons?: string[];
  } | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isProctorChecking, setIsProctorChecking] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isTerminatedRef = useRef<boolean>(false);

  // Active state
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(7200);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveInFlight = useRef(false);
  const latestExamState = useRef({ answers, timeRemaining });
  latestExamState.current = { answers, timeRemaining };

  // Persist flagged questions locally
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(() => {
    if (!sessionId) return new Set();
    try {
      const stored = localStorage.getItem(`exam_flags_${sessionId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(`exam_flags_${sessionId}`, JSON.stringify(Array.from(flaggedQuestions)));
  }, [flaggedQuestions, sessionId]);

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
      y: e.clientY - calcPosition.y,
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
      if (window.innerWidth >= DESKTOP_BREAKPOINT) {
        setIsSidebarOpen(false);
      }
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
        const res = safeEvaluate(expression);
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

  const handleImmediateTermination = useCallback(
    async (reason: 'tab_switch' | 'cheating_disqualification', message: string, strikeResultId?: string) => {
      if (isTerminatedRef.current || !sessionId) return;
      isTerminatedRef.current = true;

      // Stop camera stream immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);

      setTerminatedState({
        reason,
        title: reason === 'cheating_disqualification' ? 'Exam Disqualified & Failed' : 'Exam Terminated Immediately',
        message,
        resultId: strikeResultId,
      });

      try {
        const result = await submitExamSession(sessionId, reason);
        if (result?.resultId || result?.id) {
          setTerminatedState((prev) => (prev ? { ...prev, resultId: result.resultId || result.id } : null));
        }
      } catch (err) {
        console.error('Failed to submit immediate termination:', err);
      }
    },
    [sessionId],
  );

  // Fetch session details on mount
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await getExamSession(sessionId);
        if (data.status !== 'active' || data.isExpired) {
          setSession(data);
          setExpiredState({
            isExpired: true,
            status: data.status,
            resultId: data.resultId,
          });
          return;
        }
        setSession(data);
        setFlaggedQuestions(new Set());
        setAnswers(data.answers ?? {});
        setTimeRemaining(data.timeRemaining);
        if (data.subjects && data.subjects.length > 0) {
          setActiveSubject(data.subjects[0]);
        }
        if (Array.isArray(data.warnings)) {
          const strikes = data.warnings.filter((w: any) =>
            typeof w === 'object' ? w.type === 'proctor_violation' : typeof w === 'string' && w.includes('Proctor Strike')
          ).length;
          setProctorStrikes(strikes);
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load active exam session.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  // Tab Switch / Page Visibility Immediate Termination
  useEffect(() => {
    if (loading || submitting || !session || session.status !== 'active' || expiredState || terminatedState) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isTerminatedRef.current) {
        handleImmediateTermination(
          'tab_switch',
          'You switched away or navigated to another tab/window. In accordance with examination regulations, your exam has ended immediately.',
        );
      }
    };

    const onPageHide = () => {
      if (!isTerminatedRef.current) {
        handleImmediateTermination(
          'tab_switch',
          'Exam window was closed or navigated away. Exam terminated immediately.',
        );
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [loading, submitting, session, expiredState, terminatedState, handleImmediateTermination]);

  // Initialize Webcam for AI Proctoring
  useEffect(() => {
    if (loading || !session || session.status !== 'active' || expiredState || terminatedState) return;

    let isMounted = true;
    async function initCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } catch (err) {
        console.warn('Proctor webcam not available:', err);
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [loading, session, expiredState, terminatedState]);

  // Periodic AI Proctoring Check Loop (every 18 seconds)
  useEffect(() => {
    if (loading || !session || session.status !== 'active' || expiredState || terminatedState || !sessionId) return;

    const runProctorCheck = async () => {
      if (!videoRef.current || !canvasRef.current || isTerminatedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 320, 240);
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.6);

      try {
        setIsProctorChecking(true);
        const res = await evaluateExamProctoring(sessionId, frameBase64);
        setIsProctorChecking(false);

        if (res.violationFlagged) {
          setProctorStrikes(res.strikes);
          if (res.strikes >= 3 || res.disqualified) {
            handleImmediateTermination(
              'cheating_disqualification',
              'You have been flagged 3 times by the AI Proctoring system for suspected cheating/malpractice. Your exam has ended immediately and recorded as a failure (0 score).',
              res.resultId,
            );
          } else if (res.strikes === 2) {
            setProctorWarningModal({
              strike: 2,
              title: '🚨 FINAL WARNING (STRIKE 2 OF 3)',
              message: res.message || 'Suspicious activity detected. One more violation will immediately fail and terminate your exam!',
              reasons: res.reasons,
            });
          } else if (res.strikes === 1) {
            setProctorWarningModal({
              strike: 1,
              title: '⚠️ PROCTORING WARNING 1 OF 3',
              message: res.message || 'Potential cheating activity detected. Please face your screen alone with no unauthorized devices.',
              reasons: res.reasons,
            });
          }
        }
      } catch {
        setIsProctorChecking(false);
      }
    };

    const interval = setInterval(runProctorCheck, 18000);
    const timeout = setTimeout(runProctorCheck, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [loading, session, expiredState, terminatedState, sessionId, handleImmediateTermination]);

  // Filtered questions list for the active subject
  const currentSubjectQuestions = useMemo(() => {
    if (!session || !session.questions) return [];
    return session.questions.filter((q: ExamQuestion) => q.subject === activeSubject);
  }, [session, activeSubject]);

  const activeQuestion = useMemo<ExamQuestion | null>(() => {
    if (currentSubjectQuestions.length === 0) return null;
    return currentSubjectQuestions[activeQuestionIndex] || currentSubjectQuestions[0];
  }, [currentSubjectQuestions, activeQuestionIndex]);

  // Auto-submit when time reaches 0
  const autoSubmitExam = useCallback(async () => {
    if (!sessionId) return;
    try {
      setSubmitting(true);
      const result = await submitExamSession(sessionId);
      navigate(`/results/${result.resultId || result.id}`);
    } catch (err: any) {
      console.error(err);
      setSubmitting(false);
      showAlert(
        'Submission Failed',
        'Time is up, but we could not reach the server to submit your exam. Please check your connection and try again.',
        () => autoSubmitExam(),
      );
    }
  }, [sessionId, navigate]);

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
  }, [loading, submitting, error, session, autoSubmitExam]);

  // Serialize autosaves so slow requests cannot overlap
  useEffect(() => {
    if (loading || submitting || !sessionId || !session) return;
    const saveLatest = async () => {
      if (saveInFlight.current) return;
      saveInFlight.current = true;
      const snapshot = latestExamState.current;
      try {
        await saveExamAnswers(sessionId, snapshot.answers, snapshot.timeRemaining);
        setLastSaved(new Date());
      } catch (err) {
        console.warn('Auto-save failed:', err);
      } finally {
        saveInFlight.current = false;
      }
    };
    const interval = window.setInterval(saveLatest, 10000);
    return () => window.clearInterval(interval);
  }, [loading, submitting, sessionId, session]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionId };
      saveExamAnswers(sessionId!, updated, timeRemaining)
        .then(() => setLastSaved(new Date()))
        .catch((err) => console.warn('Instant save failed:', err));
      return updated;
    });
  };

  const handleNext = useCallback(() => {
    if (activeQuestionIndex < currentSubjectQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    } else {
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
      const currentSubjectIdx = session.subjects.indexOf(activeSubject);
      if (currentSubjectIdx > 0) {
        const prevSub = session.subjects[currentSubjectIdx - 1];
        setActiveSubject(prevSub);
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

  // Keyboard Event Handlers (JAMB 8-key bindings: A, B, C, D, P, N, S, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || submitting) return;
      const target = e.target as HTMLElement | null;
      if (target?.matches?.('input, textarea, select') || target?.isContentEditable) return;

      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(key) && activeQuestion) {
        const matchingOption = activeQuestion.options?.find(
          (o: any) => o.id?.toUpperCase() === key
        );
        if (matchingOption) {
          handleSelectOption(activeQuestion.questionId, matchingOption.id);
        }
      } else if (e.key === 'ArrowRight' || key === 'N') {
        handleNextClick();
      } else if (e.key === 'ArrowLeft' || key === 'P') {
        handlePrev();
      } else if (key === 'F' && activeQuestion) {
        setFlaggedQuestions((prev) => {
          const next = new Set(prev);
          if (next.has(activeQuestion.questionId)) next.delete(activeQuestion.questionId);
          else next.add(activeQuestion.questionId);
          return next;
        });
      } else if (key === 'S') {
        setShowSubmitModal(true);
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

  const executeSubmit = async () => {
    if (!sessionId) return;
    try {
      setSubmitting(true);
      setSubmitError('');
      const result = await submitExamSession(sessionId);
      navigate(`/results/${result.resultId || result.id}`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Submission failed.');
      setSubmitting(false);
    }
  };

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
      <div className="min-h-screen bg-bg-primary-dark flex flex-col items-center justify-center text-text-primary-dark">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-body-sm font-body-sm text-text-secondary-dark">Assembling standardized 4-subject exam cockpit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary-dark flex flex-col items-center justify-center text-text-primary-dark p-6">
        <AlertTriangle className="h-12 w-12 text-accent-streak-rose mb-4" />
        <h2 className="text-headline-md font-headline-md mb-2">Error Loading Exam</h2>
        <p className="text-body-sm font-body-sm text-text-secondary-dark mb-6 text-center max-w-sm">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-xl bg-accent-royal-blue px-6 py-2.5 text-label-md font-semibold text-white hover:bg-primary-container transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (expiredState || terminatedState) {
    const isCheatDisqualified =
      terminatedState?.reason === 'cheating_disqualification' ||
      expiredState?.status === 'terminated_cheating';
    const isTabSwitch =
      terminatedState?.reason === 'tab_switch' ||
      expiredState?.status === 'terminated_tab_switch';
    const resultId = terminatedState?.resultId || expiredState?.resultId;

    return (
      <div className="min-h-screen bg-bg-primary-dark flex flex-col items-center justify-center text-text-primary-dark p-6">
        <div className="max-w-md w-full bg-surface-container-low border border-border-dark rounded-2xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 border ${
              isCheatDisqualified
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : isTabSwitch
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-accent-royal-blue/10 border-accent-royal-blue/30 text-accent-royal-blue'
            }`}
          >
            {isCheatDisqualified ? (
              <ShieldAlert className="w-8 h-8" />
            ) : isTabSwitch ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8" />
            )}
          </div>
          <h2 className="text-2xl font-bold font-headline-md mb-2">
            {isCheatDisqualified
              ? 'Exam Disqualified & Failed'
              : isTabSwitch
              ? 'Exam Terminated (Tab Switch)'
              : 'Exam Session Concluded'}
          </h2>
          <p className="text-sm text-text-secondary-dark mb-6 leading-relaxed">
            {isCheatDisqualified
              ? 'This exam session was terminated and recorded as a failure (0 score) due to receiving 3 proctoring strikes for suspected cheating/malpractice.'
              : isTabSwitch
              ? 'This exam session was terminated immediately because an unauthorized tab or window switch was detected during the exam.'
              : 'This exam session has reached or exceeded its allotted time frame and has been finalized.'}
          </p>
          <div className="flex flex-col gap-3">
            {resultId && (
              <button
                onClick={() => navigate(`/results/${resultId}`)}
                className="w-full py-3 rounded-xl bg-accent-royal-blue text-white font-semibold hover:bg-primary-container transition-all shadow-md"
              >
                View Exam Results
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-xl bg-surface-container border border-border-dark text-text-primary-dark font-medium hover:bg-surface-container-high transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !session.subjects) {
    return (
      <div className="min-h-screen bg-bg-primary-dark flex flex-col items-center justify-center text-text-primary-dark p-6">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-body-sm text-text-secondary-dark">Loading examination cockpit...</p>
      </div>
    );
  }

  const answeredInActiveSubject = currentSubjectQuestions.filter(
    (q: ExamQuestion) => !!answers[q.questionId],
  ).length;

  const currentSubjectIndex = session.subjects.indexOf(activeSubject);
  const isFirstQuestion = currentSubjectIndex === 0 && activeQuestionIndex === 0;
  const totalAnswered = session.questions.filter((question: ExamQuestion) => !!answers[question.questionId]).length;
  const totalQuestionsCount = session.questions.length;
  const totalUnanswered = totalQuestionsCount - totalAnswered;
  const totalFlagged = flaggedQuestions.size;
  const isTimeCritical = timeRemaining < 300; // < 5 mins

  return (
    <div className="bg-bg-primary-dark text-text-primary-dark min-h-screen flex flex-col font-body-md antialiased select-none overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP APEX ECOSYSTEM BAR */}
      {/* ========================================================================= */}
      <header className="bg-bg-secondary-dark/95 backdrop-blur-md border-b border-border-dark shrink-0 z-30 sticky top-0 shadow-md">
        <div className="max-w-[1760px] mx-auto px-3.5 sm:px-5 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-6 min-h-[58px] sm:min-h-[68px]">
          {/* Left: Brand Emblem & Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <img
              src="/favicon.svg"
              alt="Aurikrex Emblem"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl ring-1 ring-border-dark shadow-sm shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-sm sm:text-[19px] text-text-primary-dark font-bold tracking-tight leading-tight">
                <span className="hidden sm:inline">Aurikrex Exam Arena</span>
                <span className="sm:hidden">Aurikrex</span>
              </span>
              <span className="font-label-sm text-[11px] sm:text-[12px] text-text-muted-dark font-medium leading-tight mt-0.5">
                <span className="hidden sm:inline">Official UTME CBT Simulation</span>
                <span className="sm:hidden font-mono-data text-[10px] text-secondary">AKX-{sessionId?.slice(0, 6).toUpperCase() || 'LIVE'}</span>
              </span>
            </div>
          </div>

          {/* Mobile Master Countdown Timer Capsule */}
          <div className={`flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isTimeCritical
              ? 'bg-accent-streak-rose/15 border-accent-streak-rose/40 text-accent-streak-rose ring-1 ring-accent-streak-rose/50 animate-pulse'
              : 'bg-surface-container-low border-border-dark text-text-primary-dark shadow-sm'
          }`}>
            <span className={`material-symbols-outlined text-[17px] ${isTimeCritical ? 'text-accent-streak-rose animate-bounce' : 'text-accent-royal-blue'}`}>timer</span>
            <span className="font-mono-timer text-[14px] sm:text-[15px] font-bold tracking-wide">
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Center: Candidate Identification Badge & Master Timer Console */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5 justify-center flex-1 max-w-[780px]">
            {/* Candidate Info Badge */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-surface-container rounded-xl border border-border-dark shadow-inner text-text-secondary-dark text-body-sm font-body-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">account_circle</span>
              <span className="font-medium text-text-primary-dark whitespace-nowrap">Candidate Session</span>
              <span className="text-border-hover-dark font-thin">|</span>
              <span className="font-mono-data text-mono-data text-secondary whitespace-nowrap font-semibold">
                AKX-{sessionId?.slice(0, 8).toUpperCase() || 'LIVE'}
              </span>
            </div>

            <div className="h-6 w-px bg-border-dark hidden lg:block" />

            {/* Master Countdown Timer Console */}
            <div className={`flex items-center gap-3.5 bg-surface-container-low px-4 py-1.5 rounded-xl border border-border-dark ring-1 ${isTimeCritical ? 'ring-accent-streak-rose/60 bg-accent-streak-rose/10' : 'ring-accent-royal-blue/30'} shadow-sm`}>
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[22px] ${isTimeCritical ? 'text-accent-streak-rose animate-bounce' : 'text-accent-royal-blue animate-pulse'}`}>timer</span>
                <span className="font-label-sm text-[11px] text-text-muted-dark uppercase tracking-wider font-semibold">Time:</span>
              </div>
              <div className={`font-mono-timer text-[22px] tracking-wider flex items-center font-bold ${isTimeCritical ? 'text-accent-streak-rose' : 'text-text-primary-dark'}`}>
                <span>{formatTime(timeRemaining)}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-label-sm text-[12px] font-medium border ${isTimeCritical ? 'bg-accent-streak-rose/20 text-accent-streak-rose border-accent-streak-rose/30' : 'bg-tertiary/10 text-tertiary border-tertiary/25'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isTimeCritical ? 'bg-accent-streak-rose animate-ping' : 'bg-tertiary animate-pulse'}`} />
                <span>{isTimeCritical ? 'Time Alert' : 'Standard Pacing'}</span>
              </div>
            </div>
          </div>

          {/* Right: Candidate Utilities & Primary Submit CTA */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Candidate Utilities Suite */}
            <div className="flex items-center bg-surface-container rounded-xl border border-border-dark p-0.5 sm:p-1 gap-0.5 shadow-sm">
              <button
                onClick={() => setShowCalculator((prev) => !prev)}
                className={`p-1 sm:p-1.5 rounded-lg transition-colors flex items-center justify-center ${showCalculator ? 'bg-accent-royal-blue text-white' : 'text-text-secondary-dark hover:text-text-primary-dark hover:bg-surface-variant'}`}
                title="UTME Calculator"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[19px]">calculate</span>
              </button>
              <ThemeToggle className="min-h-7 min-w-7 sm:min-h-8 sm:min-w-8" />
            </div>

            {/* Feature 2: AI Proctor Live Status Pill */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-[12px] font-medium transition-all ${
                proctorStrikes >= 2
                  ? 'bg-red-500/15 border-red-500/40 text-red-400 ring-1 ring-red-500/30 animate-pulse'
                  : proctorStrikes === 1
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 ring-1 ring-amber-500/30'
                  : 'bg-surface-container-lowest border-emerald-500/30 text-emerald-400'
              }`}
              title={cameraActive ? 'AI Proctoring Active' : 'AI Proctoring Standby'}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  proctorStrikes >= 2
                    ? 'bg-red-500 animate-ping'
                    : proctorStrikes === 1
                    ? 'bg-amber-500 animate-pulse'
                    : cameraActive
                    ? 'bg-emerald-400'
                    : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold whitespace-nowrap">
                {proctorStrikes === 0 ? 'AI Proctored' : `Strikes: ${proctorStrikes}/3`}
              </span>
              {isProctorChecking && <Loader2 className="w-3 h-3 animate-spin text-white/60 ml-0.5" />}
            </div>

            {/* Offline Cache Synced Status Pill */}
            <div className="hidden xl:flex items-center gap-2 text-body-sm font-body-sm text-tertiary px-3 py-1.5 bg-surface-container-lowest rounded-xl border border-tertiary/25 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              <span className="font-mono-data text-mono-data text-[12px] font-medium">Cache Synced</span>
            </div>

            <div className="h-6 w-px bg-border-dark hidden sm:block" />

            {/* Hidden Video & Canvas for Periodic Clef Frame Evaluation */}
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Primary Submit CTA with Unanswered Badge */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="relative group bg-accent-streak-rose/15 hover:bg-accent-streak-rose/25 text-accent-streak-rose border border-accent-streak-rose/40 hover:border-accent-streak-rose/60 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-label-md text-label-md flex items-center gap-1.5 sm:gap-2.5 active:scale-[0.98] transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[19px]">done_all</span>
              <span className="font-semibold tracking-tight text-xs sm:text-sm">
                <span className="hidden sm:inline">Submit Simulation</span>
                <span className="sm:hidden">Submit</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-accent-streak-rose text-white text-[10px] sm:text-[11px] font-bold rounded-full shadow">
                {totalUnanswered}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. 4-SUBJECT TAB NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="bg-surface-container-low/90 backdrop-blur border-b border-border-dark px-5 lg:px-8 py-2.5 shadow-sm">
        <div className="max-w-[1760px] mx-auto flex items-center justify-between gap-4 overflow-x-auto pb-0.5">
          <div className="flex items-center gap-3 min-w-max">
            {session.subjects.map((sub: string) => {
              const isActive = sub === activeSubject;
              const subQuestions = session.questions.filter((q: ExamQuestion) => q.subject === sub);
              const subAnswered = subQuestions.filter((q: ExamQuestion) => !!answers[q.questionId]).length;
              const subPercentage = subQuestions.length > 0 ? Math.round((subAnswered / subQuestions.length) * 100) : 0;
              const isCompulsory = sub === 'english';

              return (
                <button
                  key={sub}
                  onClick={() => {
                    setActiveSubject(sub);
                    setActiveQuestionIndex(0);
                  }}
                  className={`group flex items-center gap-3 px-4 py-2 rounded-xl transition-all border ${
                    isActive
                      ? 'bg-surface-container border-2 border-primary/50 text-text-primary-dark shadow-md ring-1 ring-primary/20'
                      : 'bg-surface-container/60 hover:bg-surface-container text-text-secondary-dark hover:text-text-primary-dark border-border-dark hover:border-border-hover-dark'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-primary ring-4 ring-primary/25 animate-pulse' : subPercentage === 100 ? 'bg-tertiary' : 'bg-surface-variant'}`} />
                  <div className="text-left flex items-center gap-2">
                    <span className={`font-label-md text-label-md font-bold leading-tight ${isActive ? 'text-primary' : 'text-text-primary-dark'}`}>
                      {getSubjectLabel(sub)} {isCompulsory && <span className="text-xs text-text-muted-dark font-normal">(Compulsory)</span>}
                    </span>
                    <span className="text-border-hover-dark font-thin">·</span>
                    <span className="font-mono-data text-mono-data text-[13px] text-text-secondary-dark">
                      {subAnswered}/{subQuestions.length} answered
                    </span>
                  </div>
                  <span className={`ml-1 text-[12px] font-bold px-2 py-0.5 rounded-md border ${isActive ? 'bg-primary/15 text-primary border-primary/30' : 'bg-surface-container text-text-muted-dark border-border-dark'}`}>
                    {subPercentage}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Aggregate Completion Counter */}
          <div className="hidden 2xl:flex items-center gap-3 px-3.5 py-1.5 bg-surface-container rounded-xl border border-border-dark text-body-sm font-body-sm shrink-0">
            <span className="text-text-muted-dark">Aggregate Completion:</span>
            <span className="font-mono-data text-mono-data text-text-primary-dark font-bold">
              {totalAnswered} / {totalQuestionsCount}
            </span>
            <div className="w-24 bg-surface-variant h-2 rounded-full overflow-hidden ml-1">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${totalQuestionsCount > 0 ? (totalAnswered / totalQuestionsCount) * 100 : 0}%` }}
              />
            </div>
            <span className="font-mono-data text-mono-data text-[12px] text-primary font-bold">
              {totalQuestionsCount > 0 ? Math.round((totalAnswered / totalQuestionsCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. EXAM WORKSPACE VIEWPORT */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1760px] w-full mx-auto px-5 lg:px-8 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MAIN EXAM CANVAS (COL 8/9) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
          {activeQuestion ? (
            <>
              {/* Question Meta Header Card */}
              <div className="bg-bg-card-dark rounded-xl border border-border-dark p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <span className="px-3.5 py-1.5 rounded-lg bg-accent-royal-blue text-white font-mono-data text-mono-data font-bold tracking-wide shadow-sm">
                    Q{activeQuestionIndex + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-text-primary-dark">
                        Question {activeQuestionIndex + 1} of {currentSubjectQuestions.length}
                      </span>
                      <span className="text-border-hover-dark">·</span>
                      <span className="font-label-md text-label-md text-primary font-semibold">{getSubjectLabel(activeSubject)}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-muted-dark">
                      {activeQuestion.topic ? `${activeQuestion.topic} · (1 Mark)` : 'Standard UTME Item · (1 Mark)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5">
                  {/* Mobile Quick-Jump Palette Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden px-2.5 py-1.5 rounded-lg border border-accent-royal-blue/40 bg-accent-royal-blue/15 text-primary hover:bg-accent-royal-blue/25 flex items-center gap-1 text-label-sm font-label-sm font-semibold transition-colors"
                    title="Open Question Palette Matrix"
                  >
                    <span className="material-symbols-outlined text-[17px]">grid_view</span>
                    <span>Q-Grid</span>
                  </button>

                  {/* Flag Status */}
                  <button
                    onClick={() => toggleFlaggedQuestion(activeQuestion.questionId)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-label-sm font-label-sm transition-colors ${
                      flaggedQuestions.has(activeQuestion.questionId)
                        ? 'border-warning-amber bg-warning-amber/20 text-warning-amber'
                        : 'border-border-dark hover:border-warning-amber/40 text-text-secondary-dark hover:text-warning-amber bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px] sm:text-[18px]">bookmark</span>
                    <span>{flaggedQuestions.has(activeQuestion.questionId) ? 'Flagged' : 'Flag'} <span className="hidden sm:inline">[F]</span></span>
                  </button>

                  {/* Mark Value Badge */}
                  <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-container text-tertiary border border-tertiary/20 text-label-sm font-label-sm font-semibold">
                    +1.0 Mark
                  </span>
                </div>
              </div>

              {/* Question Stem & Card */}
              <div className="bg-bg-card-dark rounded-xl border border-border-dark p-6 lg:p-7 shadow-md flex flex-col gap-5">
                <QuestionCard
                  question={activeQuestion}
                  index={activeQuestionIndex}
                  totalCount={currentSubjectQuestions.length}
                  selectedOption={answers[activeQuestion.questionId]}
                  onSelectOption={(optionId) => handleSelectOption(activeQuestion.questionId, optionId)}
                  isFlagged={flaggedQuestions.has(activeQuestion.questionId)}
                  onToggleFlag={() => toggleFlaggedQuestion(activeQuestion.questionId)}
                />
              </div>

              {/* Navigation & Assistant Toolbar Footer */}
              <div className="bg-bg-card-dark rounded-xl border border-border-dark p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                {/* Left: Previous CTA */}
                <button
                  onClick={handlePrev}
                  disabled={isFirstQuestion}
                  className="flex-1 sm:flex-initial justify-center px-3.5 sm:px-4 py-2.5 rounded-xl border border-border-dark hover:border-border-hover-dark bg-surface-container text-text-secondary-dark hover:text-text-primary-dark text-label-md font-label-md flex items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Prev<span className="hidden xs:inline">ious</span> [P]</span>
                </button>

                {/* Center: Auto-Save Status */}
                <div className="order-last sm:order-none w-full sm:w-auto flex items-center justify-center gap-2 text-xs text-text-muted-dark font-mono-data py-0.5">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span className="truncate">{lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Connected to Exam Vault'}</span>
                </div>

                {/* Right: Next Question CTA */}
                <button
                  onClick={handleNextClick}
                  className="flex-1 sm:flex-initial justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white text-label-md font-label-md font-semibold flex items-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                  <span>{isLastQuestion ? 'Submit [S]' : 'Next [N]'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>

              {/* Cyber-Cafe Keyboard Shortcut Strip */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-border-dark flex items-center justify-between text-body-sm font-body-sm text-text-muted-dark">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-secondary-dark font-medium">Shortcuts:</span>
                  <span className="font-mono-data text-[11px] px-1.5 py-0.5 rounded bg-surface-container border border-border-dark text-text-secondary-dark">[A-D] Select Option</span>
                  <span className="font-mono-data text-[11px] px-1.5 py-0.5 rounded bg-surface-container border border-border-dark text-text-secondary-dark">[P] Prev</span>
                  <span className="font-mono-data text-[11px] px-1.5 py-0.5 rounded bg-surface-container border border-border-dark text-text-secondary-dark">[N] Next</span>
                  <span className="font-mono-data text-[11px] px-1.5 py-0.5 rounded bg-surface-container border border-border-dark text-text-secondary-dark">[F] Flag</span>
                  <span className="font-mono-data text-[11px] px-1.5 py-0.5 rounded bg-surface-container border border-border-dark text-text-secondary-dark">[S] Submit</span>
                </div>
                <div className="text-[11px] text-text-muted-dark hidden md:block">
                  Auto-saves instantly upon keypress
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-border-dark bg-bg-card-dark p-12 text-center text-sm text-text-muted-dark">
              No questions mapped to this subject.
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: QUESTION PALETTE (COL 4/3) */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          <div className="bg-bg-card-dark rounded-xl border border-border-dark p-4 shadow-md flex flex-col gap-4">
            {/* Palette Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border-dark">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary-dark">Question Palette</h2>
                <p className="font-body-sm text-body-sm text-text-muted-dark">
                  {getSubjectLabel(activeSubject)} ({currentSubjectQuestions.length} Questions)
                </p>
              </div>
              <span className="material-symbols-outlined text-text-muted-dark text-[22px]">apps</span>
            </div>

            {/* Legend Indicators */}
            <div className="grid grid-cols-2 gap-2 text-label-sm font-label-sm bg-surface-container-low p-2.5 rounded-lg border border-border-dark">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary" />
                <span className="text-text-secondary-dark">Answered (<strong className="text-text-primary-dark">{answeredInActiveSubject}</strong>)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-royal-blue ring-2 ring-accent-royal-blue/40" />
                <span className="text-text-secondary-dark">Current (<strong className="text-text-primary-dark">1</strong>)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning-amber" />
                <span className="text-text-secondary-dark">Flagged (<strong className="text-text-primary-dark">{totalFlagged}</strong>)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-surface-variant border border-border-dark" />
                <span className="text-text-secondary-dark">Left (<strong className="text-text-primary-dark">{currentSubjectQuestions.length - answeredInActiveSubject}</strong>)</span>
              </div>
            </div>

            {/* 4-Column Matrix Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {currentSubjectQuestions.map((q: ExamQuestion, idx: number) => {
                const isSelected = activeQuestionIndex === idx;
                const isAnswered = !!answers[q.questionId];
                const isFlagged = flaggedQuestions.has(q.questionId);

                return (
                  <button
                    key={q.questionId}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-9 rounded-lg font-mono-data text-xs font-bold flex items-center justify-center transition-all relative ${
                      isSelected
                        ? 'bg-accent-royal-blue text-white ring-2 ring-primary glow-active-node z-10 scale-[1.03]'
                        : isFlagged
                        ? 'bg-warning-amber text-white dark:text-slate-950 font-bold'
                        : isAnswered
                        ? 'bg-tertiary/20 text-tertiary border border-tertiary/40 hover:bg-tertiary/30'
                        : 'bg-surface-container text-text-secondary-dark border border-border-dark hover:border-primary/40'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && !isSelected && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam Session Telemetry & Integrity Card */}
          <div className="bg-surface-container-low rounded-xl border border-border-dark p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-text-secondary-dark uppercase tracking-wide">Session Integrity</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono-data bg-tertiary/10 text-tertiary border border-tertiary/20">Secure CBT Lock</span>
            </div>
            <div className="space-y-1.5 text-body-sm font-body-sm">
              <div className="flex justify-between items-center text-text-muted-dark">
                <span>Session ID:</span>
                <span className="font-mono-data text-mono-data text-text-primary-dark">{sessionId?.slice(0, 16) || 'ACTIVE'}</span>
              </div>
              <div className="flex justify-between items-center text-text-muted-dark">
                <span>Anti-Cheat Status:</span>
                <span className="text-tertiary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  Active Pacing
                </span>
              </div>
              <div className="flex justify-between items-center text-text-muted-dark">
                <span>Packet Sync:</span>
                <span className="font-mono-data text-mono-data text-text-secondary-dark">0 ms (Zero loss)</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ========================================================================= */}
      {/* 4. DRAGGABLE FLOATING CALCULATOR MODAL */}
      {/* ========================================================================= */}
      {showCalculator && (
        <div
          style={{ position: 'fixed', left: `${calcPosition.x}px`, top: `${calcPosition.y}px`, zIndex: 60 }}
          className="w-72 bg-bg-card-dark border border-border-dark rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Draggable Bar */}
          <div
            onPointerDown={handleCalcPointerDown}
            className="flex items-center justify-between px-3 py-2 bg-surface-container cursor-move select-none border-b border-border-dark"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-text-primary-dark">JAMB Calculator</span>
            </div>
            <button
              onClick={() => setShowCalculator(false)}
              className="p-1 rounded hover:bg-surface-variant text-text-muted-dark hover:text-text-primary-dark"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Calculator Screen */}
          <div className="p-3 bg-surface-container-low border-b border-border-dark text-right">
            <div className="text-xs text-text-muted-dark font-mono-data min-h-[16px]">{calcInput || '0'}</div>
            <div className="text-lg font-bold text-text-primary-dark font-mono-data truncate">{calcResult || '0'}</div>
          </div>

          {/* Keypad Grid */}
          <div className="p-2.5 grid grid-cols-4 gap-1.5 text-xs font-mono-data">
            {['C', 'Back', '√', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '%', '='].map((key) => (
              <button
                key={key}
                onClick={() => handleCalcBtnClick(key)}
                className={`h-9 rounded-lg font-semibold transition-all ${
                  key === '='
                    ? 'bg-accent-royal-blue text-white hover:bg-primary-container'
                    : ['C', 'Back'].includes(key)
                    ? 'bg-surface-variant text-accent-streak-rose hover:bg-surface-container-highest'
                    : ['÷', '×', '-', '+', '%', '√'].includes(key)
                    ? 'bg-surface-container text-primary hover:bg-surface-variant'
                    : 'bg-surface-container-low text-text-primary-dark hover:bg-surface-variant'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUBMISSION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary-dark/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-bg-card-dark border border-border-dark p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-streak-rose/20 text-accent-streak-rose flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-headline-sm font-headline-sm text-text-primary-dark">Submit Examination?</h4>
                <p className="text-xs text-text-muted-dark font-mono-data">Final Grade &amp; Triage Computation</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-border-dark space-y-2 text-xs">
              <div className="flex justify-between text-text-secondary-dark">
                <span>Total Questions:</span>
                <span className="font-mono-data text-text-primary-dark font-bold">{totalQuestionsCount}</span>
              </div>
              <div className="flex justify-between text-tertiary">
                <span>Answered:</span>
                <span className="font-mono-data font-bold">{totalAnswered}</span>
              </div>
              <div className="flex justify-between text-accent-streak-rose">
                <span>Unanswered:</span>
                <span className="font-mono-data font-bold">{totalUnanswered}</span>
              </div>
              <div className="flex justify-between text-warning-amber">
                <span>Flagged for Review:</span>
                <span className="font-mono-data font-bold">{totalFlagged}</span>
              </div>
            </div>

            {submitError && (
              <p className="text-xs text-accent-streak-rose bg-accent-streak-rose/10 p-2.5 rounded-lg border border-accent-streak-rose/30">
                {submitError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-variant text-text-secondary-dark hover:text-text-primary-dark border border-border-dark font-label-md text-label-md font-semibold transition-all"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={executeSubmit}
                className="flex-1 py-3 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Alert Dialog */}
      {alertConfig?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary-dark/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-bg-card-dark border border-border-dark p-6 shadow-2xl space-y-4">
            <h4 className="text-headline-sm font-headline-sm text-text-primary-dark">{alertConfig.title}</h4>
            <p className="text-body-sm font-body-sm text-text-secondary-dark">{alertConfig.message}</p>
            <button
              onClick={() => {
                alertConfig.onConfirm?.();
                setAlertConfig(null);
              }}
              className="w-full py-2.5 rounded-xl bg-accent-royal-blue text-white font-semibold shadow"
            >
              Okay
            </button>
          </div>
        </div>
      )}
      {/* Mobile Expandable Question Palette Drawer (Stitch Mobile Spec) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden bg-bg-primary-dark/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="flex-1" onClick={() => setIsSidebarOpen(false)} aria-label="Close palette overlay" />
          <div className="bg-bg-secondary-dark border-t border-border-dark rounded-t-2xl p-4 w-full max-h-[82vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border-dark">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-text-primary-dark">
                  Question Palette Matrix
                </h3>
                <p className="text-xs text-text-muted-dark">
                  {getSubjectLabel(activeSubject)} · {answeredInActiveSubject}/{currentSubjectQuestions.length} answered
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-text-muted-dark hover:text-text-primary-dark hover:bg-surface-container transition-colors"
                aria-label="Close question palette"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-label-sm py-2.5 border-b border-border-dark text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                <span className="text-text-secondary-dark">Answered ({answeredInActiveSubject})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-royal-blue ring-1 ring-accent-royal-blue/40" />
                <span className="text-text-secondary-dark">Current (Q{activeQuestionIndex + 1})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-warning-amber" />
                <span className="text-text-secondary-dark">Flagged ({totalFlagged})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-variant border border-border-dark" />
                <span className="text-text-secondary-dark">Left ({currentSubjectQuestions.length - answeredInActiveSubject})</span>
              </div>
            </div>

            <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 gap-2 py-3 overflow-y-auto max-h-[50vh] pr-1">
              {currentSubjectQuestions.map((q: ExamQuestion, idx: number) => {
                const isSelected = activeQuestionIndex === idx;
                const isAnswered = !!answers[q.questionId];
                const isFlagged = flaggedQuestions.has(q.questionId);

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => {
                      setActiveQuestionIndex(idx);
                      setIsSidebarOpen(false);
                    }}
                    className={`h-10 rounded-lg font-mono-data text-xs font-bold flex items-center justify-center transition-all relative ${
                      isSelected
                        ? 'bg-accent-royal-blue text-white ring-2 ring-primary scale-[1.03]'
                        : isFlagged
                        ? 'bg-warning-amber text-slate-950 font-bold'
                        : isAnswered
                        ? 'bg-tertiary/20 text-tertiary border border-tertiary/40'
                        : 'bg-surface-container text-text-secondary-dark border border-border-dark hover:border-primary/40'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && !isSelected && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Miniature Floating Webcam Preview for Candidate Awareness */}
      {cameraActive && (
        <div className="fixed bottom-3 right-3 z-30 pointer-events-none rounded-xl overflow-hidden border border-emerald-500/40 bg-black/80 shadow-2xl flex flex-col items-center">
          <video
            ref={(node) => {
              if (node && streamRef.current && node.srcObject !== streamRef.current) {
                node.srcObject = streamRef.current;
                node.play().catch(() => {});
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-24 h-18 sm:w-28 sm:h-20 object-cover scale-x-[-1]"
          />
          <div className="w-full bg-emerald-950/80 px-1 py-0.5 text-center text-[9px] font-mono font-semibold text-emerald-300 uppercase tracking-wider">
            Live AI Proctor
          </div>
        </div>
      )}

      {/* Proctoring Violation Strike Modal (Warnings 1 and 2) */}
      {proctorWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`max-w-md w-full rounded-2xl p-6 sm:p-7 border shadow-2xl ${
              proctorWarningModal.strike >= 2
                ? 'bg-red-950/95 border-red-500/60 text-white ring-2 ring-red-500/40'
                : 'bg-amber-950/95 border-amber-500/60 text-white ring-2 ring-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  proctorWarningModal.strike >= 2 ? 'bg-red-500/25 text-red-400' : 'bg-amber-500/25 text-amber-400'
                }`}
              >
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg font-headline-sm">{proctorWarningModal.title}</h3>
                <p className="text-xs text-white/70">Anti-Malpractice Security Detection</p>
              </div>
            </div>
            <p className="text-sm text-white/90 mb-4 leading-relaxed font-body-sm">
              {proctorWarningModal.message}
            </p>
            {proctorWarningModal.reasons && proctorWarningModal.reasons.length > 0 && (
              <div className="mb-5 p-3 rounded-xl bg-black/50 border border-white/10">
                <p className="text-xs font-semibold text-white/80 mb-1">Detected Violation Factors:</p>
                <ul className="text-xs text-white/70 list-disc list-inside space-y-0.5">
                  {proctorWarningModal.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setProctorWarningModal(null)}
              className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg text-sm ${
                proctorWarningModal.strike >= 2
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/50'
              }`}
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
