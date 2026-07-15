import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from 'lucide-react';
import { AiChatWidget } from '../ai/AiChatWidget';
import { ExplainButton } from '../ai/ExplainButton';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { QuestionCard } from '../../components';

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

export default function ResultReview() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GradedResultRecord | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  const token = useMemo(() => localStorage.getItem('accessToken') || '', []);

  useEffect(() => {
    if (!resultId) return;
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await getResultDetail(token, resultId);
        setResult(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load graded test result.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId, token]);

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

  const aiContextPayload = useMemo(() => {
    if (!result) return undefined;
    return JSON.stringify({
      examType: result.type,
      totalScore: result.totalScore,
      subjectScores: result.subjectScores.map(sc => ({
        subject: sc.subject,
        score: sc.score,
        correct: sc.correctCount,
        wrong: sc.incorrectCount,
        skipped: sc.unansweredCount
      })),
      incorrectQuestions: result.questionsSnapshot.filter((q) => {
        const userChoice = result.answers?.[q.questionId];
        return userChoice && userChoice.toUpperCase() !== q.correct_option?.toUpperCase();
      }).map(q => ({
        subject: q.subject,
        topic: q.topic,
        question: q.question_text,
        studentAnswer: result.answers?.[q.questionId],
        correctAnswer: q.correct_option
      }))
    });
  }, [result]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-slate-400">Grading mock answers and preparing solution map...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <XCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold mb-2">Error Loading Review</h2>
        <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">{error || 'Result details missing.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-auto">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </button>
          <span className="text-sm font-bold text-slate-350">
            {result.type === 'mock' ? 'Mock Exam Graded Summary' : 'Subject Practice Review'}
          </span>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8 relative z-10">
        {/* Score Visual Block */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Main Score Card */}
          <div className="rounded-2xl border border-primary/20 bg-bg-secondary/20 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-blue-500/5 pointer-events-none" />
            <Award className="h-10 w-10 text-primary mb-3" />
            <div className="text-[10px] uppercase font-bold text-primary-hover tracking-wider">Aggregate Grade</div>
            <div className="mt-2 text-5xl font-black text-white">
              {result.type === 'mock' ? (
                <>
                  {result.totalScore}
                  <span className="text-sm text-slate-400 font-normal"> / 400</span>
                </>
              ) : (
                `${result.totalScore}%`
              )}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              {result.type === 'mock'
                ? result.totalScore >= 300
                  ? 'Fantastic result! You are on track for a top-tier score.'
                  : result.totalScore >= 240
                  ? 'Good foundation. Review corrections to secure a 300+ score.'
                  : 'Needs improvement. Focus drills on weak subjects.'
                : result.totalScore >= 75
                ? 'High accuracy drill. Keep up the good work.'
                : 'Drill result completed. Study solution methods below.'}
            </p>
          </div>

          {/* Timing Stats Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-400" />
                <span className="text-sm font-bold text-white">Solve Speed Overview</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Duration Taken</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">{durationFormatted}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Average Pace</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    {Math.round(result.timeSpentSeconds / result.questionsSnapshot.length)}s/q
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 text-[10px] text-slate-500 leading-normal">
              Managing exam time effectively is key. Aim for an average pace of 40 seconds per question in JAMB UTME.
            </div>
          </div>

          {/* Stats Bar Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-pink-400" />
                <span className="text-sm font-bold text-white">Answer Accuracies</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2">
                  <div className="text-xs font-bold text-emerald-450">
                    {result.subjectScores.reduce((acc, val) => acc + val.correctCount, 0)}
                  </div>
                  <div className="text-[8px] text-slate-500 uppercase mt-0.5">Correct</div>
                </div>
                <div className="rounded-lg bg-rose-500/5 border border-rose-500/10 p-2">
                  <div className="text-xs font-bold text-rose-450">
                    {result.subjectScores.reduce((acc, val) => acc + val.incorrectCount, 0)}
                  </div>
                  <div className="text-[8px] text-slate-500 uppercase mt-0.5">Wrong</div>
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-2">
                  <div className="text-xs font-bold text-slate-400">
                    {result.subjectScores.reduce((acc, val) => acc + val.unansweredCount, 0)}
                  </div>
                  <div className="text-[8px] text-slate-500 uppercase mt-0.5">Skipped</div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                <span>Accuracy Rate</span>
                <span>{accuracyRate}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${accuracyRate}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Subjects Score breakdown list */}
        <section className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-white">Performance Scorecard per Subject</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {result.subjectScores.map((scoreCard) => (
              <div
                key={scoreCard.subject}
                className="rounded-xl border border-slate-850 bg-slate-950 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">{SUBJECT_LABELS[scoreCard.subject] || scoreCard.subject}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {scoreCard.correctCount} correct • {scoreCard.incorrectCount} wrong • {scoreCard.unansweredCount} skipped
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-primary">{scoreCard.score}</span>
                  <span className="text-[10px] text-slate-500 block">/ 100</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filters Controls block */}
        <section className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <ListCollapse className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-white">Correction Map Corrections</h3>
          </div>

          <div className="flex gap-2">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-850 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {result.subjectScores.map((sc) => (
                <option key={sc.subject} value={sc.subject}>
                  {SUBJECT_LABELS[sc.subject] || sc.subject}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg bg-slate-950 border border-slate-850 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="correct">Correct Choices</option>
              <option value="incorrect">Wrong Choices</option>
              <option value="unanswered">Skipped Items</option>
            </select>
          </div>
        </section>

        {/* Graded Question correction map list */}
        <section className="space-y-6">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q, idx) => {
              const userChoice = result.answers?.[q.questionId];
              const isUserCorrect = userChoice?.toUpperCase() === q.correct_option?.toUpperCase();
              const isSkipped = !userChoice;

              return (
                <div
                  key={q.questionId}
                  className={`rounded-2xl border p-6 space-y-4 relative overflow-hidden transition-all ${
                    isSkipped
                      ? 'border-slate-850 bg-slate-900/10'
                      : isUserCorrect
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-rose-500/20 bg-rose-500/5'
                  }`}
                >
                  {/* Status Tag Badge */}
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase mb-4">
                    <span className="text-primary">
                      {SUBJECT_LABELS[q.subject] || q.subject} • {q.topic}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isSkipped
                          ? 'border-slate-800 bg-slate-900 text-slate-400'
                          : isUserCorrect
                          ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400'
                          : 'border-rose-500/20 bg-rose-950/20 text-rose-400'
                      }`}
                    >
                      {isSkipped ? 'Skipped' : isUserCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                    </span>
                  </div>

                  <QuestionCard
                    question={q}
                    index={idx}
                    selectedOption={userChoice}
                    showFeedback={true}
                    correctOption={q.correct_option}
                  />
                  {/* AI Explanation Button */}
                  <ExplainButton
                    questionId={q.questionId}
                    questionText={q.question_text}
                    correctAnswer={q.options.find((o: any) => o.id === q.correct_option)?.text || q.correct_option}
                    studentAnswer={q.options.find((o: any) => o.id === userChoice)?.text || 'Unanswered'}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 rounded-2xl border border-slate-900 bg-slate-900/10">
              <HelpCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No matching correction questions found.</p>
            </div>
          )}
        </section>
      </main>
      <AiChatWidget contextPayload={aiContextPayload} />
    </div>
  );
}
