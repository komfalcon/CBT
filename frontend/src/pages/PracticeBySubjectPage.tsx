import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  Clock,
  Target,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Layers,
  Zap,
  HelpCircle,
  Calculator,
  Atom,
  FlaskConical,
  Scale,
  Landmark,
  Coins,
  Globe2,
  Trees,
  ShieldAlert,
} from 'lucide-react';
import { StudentLayout } from '../components/StudentLayout';
import { getMe } from '../features/auth/api';
import { createDrillSession } from '../features/exam/api';
import { getSubjectTopics, getQuestionSubjects } from '../features/questions/api';
import { useToast } from '../components/ToastProvider';
import { getSubjectLabel, normalizeSubjectKey } from '../constants/subjects';

interface SubjectCardItem {
  id: string;
  name: string;
  category: 'compulsory' | 'sciences' | 'social_sciences' | 'arts_humanities';
  icon: any;
  color: string;
}

const ALL_SUBJECTS: SubjectCardItem[] = [
  { id: 'english', name: 'Use of English', category: 'compulsory', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'mathematics', name: 'Mathematics', category: 'sciences', icon: Calculator, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'physics', name: 'Physics', category: 'sciences', icon: Atom, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'chemistry', name: 'Chemistry', category: 'sciences', icon: FlaskConical, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'biology', name: 'Biology', category: 'sciences', icon: Trees, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  { id: 'economics', name: 'Economics', category: 'social_sciences', icon: Coins, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'government', name: 'Government', category: 'social_sciences', icon: Landmark, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'literature', name: 'Literature in English', category: 'arts_humanities', icon: BookOpen, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { id: 'commerce', name: 'Commerce', category: 'social_sciences', icon: Scale, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { id: 'accounting', name: 'Financial Accounting', category: 'social_sciences', icon: Calculator, color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20' },
  { id: 'geography', name: 'Geography', category: 'social_sciences', icon: Globe2, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  { id: 'agriculture', name: 'Agricultural Science', category: 'sciences', icon: Trees, color: 'text-lime-500 bg-lime-500/10 border-lime-500/20' },
  { id: 'civic_education', name: 'Civic Education', category: 'social_sciences', icon: ShieldAlert, color: 'text-blue-600 bg-blue-600/10 border-blue-600/20' },
  { id: 'crk', name: 'Christian Religious Studies', category: 'arts_humanities', icon: BookOpen, color: 'text-amber-600 bg-amber-600/10 border-amber-600/20' },
  { id: 'irk', name: 'Islamic Religious Studies', category: 'arts_humanities', icon: BookOpen, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'history', name: 'History', category: 'arts_humanities', icon: Landmark, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { id: 'further_mathematics', name: 'Further Mathematics', category: 'sciences', icon: Calculator, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
];

export default function PracticeBySubjectPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('english');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<string>('any');
  const [topicsList, setTopicsList] = useState<Array<{ topic: string; count: number }>>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  useEffect(() => {
    getMe().then((data) => setStudent(data)).catch(() => {});
  }, []);

  // Fetch topics whenever selected subject changes
  useEffect(() => {
    setIsLoadingTopics(true);
    setSelectedTopic('all');
    getSubjectTopics(selectedSubject)
      .then((topics) => {
        setTopicsList(Array.isArray(topics) ? topics : []);
      })
      .catch((err) => {
        console.error('Failed to load topics:', err);
        setTopicsList([]);
      })
      .finally(() => {
        setIsLoadingTopics(false);
      });
  }, [selectedSubject]);

  const handleLaunchDrill = async () => {
    try {
      setIsLaunching(true);
      const payload: any = {
        subject: selectedSubject,
        count: questionCount,
        difficultyLevel: difficulty === 'any' ? undefined : difficulty,
        topics: selectedTopic !== 'all' ? [selectedTopic] : undefined,
      };

      const session = await createDrillSession(payload);
      addToast({
        type: 'success',
        title: 'Drill Initialized',
        message: `Starting ${questionCount}-question drill in ${getSubjectLabel(selectedSubject)}.`,
      });
      navigate(`/exam/${session.id || session.sessionId}`);
    } catch (err: any) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Launch Failed',
        message: err.response?.data?.message || 'Could not start practice drill. Please try again.',
      });
      setIsLaunching(false);
    }
  };

  const activeSubjectData = ALL_SUBJECTS.find((s) => s.id === selectedSubject) || ALL_SUBJECTS[0];

  return (
    <StudentLayout student={student}>
      <div className="space-y-6 pb-12">
        {/* HERO BANNER */}
        <section className="rounded-2xl border border-border bg-bg-card p-6 md:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              <GraduationCap className="w-4 h-4" />
              <span>Targeted Subject &amp; Topic Practice Drills</span>
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              Master JAMB UTME Subject by Subject
            </h1>
            <p className="text-sm md:text-base text-text-secondary leading-relaxed">
              Focus your revision on high-yield curriculum topics. Select a subject below, customize your question count and difficulty, and launch an instant diagnostic sprint with step-by-step Falke AI solutions.
            </p>
          </div>
        </section>

        {/* 2-COLUMN WORKSPACE: LEFT SUBJECT GRID (7 COLS) & RIGHT CONFIGURATION CARD (5 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 17 Subjects Visual Grid */}
          <section className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary">
                1. Select Subject ({ALL_SUBJECTS.length} Accredited)
              </h2>
              <span className="text-xs text-text-muted">
                Active: <strong className="text-primary font-semibold">{activeSubjectData.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_SUBJECTS.map((sub) => {
                const isSelected = sub.id === selectedSubject;
                const Icon = sub.icon;

                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 group ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm'
                        : 'border-border bg-bg-card hover:border-border-hover hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sub.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-xs sm:text-sm text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                        {sub.name}
                      </h3>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider capitalize">
                        {sub.category.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right: Drill Configuration & Launch Card */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-sm sticky top-24 space-y-6">
              <div className="border-b border-border pb-4">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                  2. Configure Drill Parameters
                </span>
                <h3 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
                  <span>{activeSubjectData.name}</span>
                  <span className="text-xs font-normal text-text-muted">Drill Cockpit</span>
                </h3>
              </div>

              {/* Topic Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Syllabus Topic Filter
                </label>
                {isLoadingTopics ? (
                  <div className="p-3 rounded-xl bg-surface-container border border-border text-xs text-text-muted flex items-center gap-2">
                    <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading accredited syllabus topics...</span>
                  </div>
                ) : (
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="all">All Topics (Full Curriculum Stream)</option>
                    {topicsList.map((t) => (
                      <option key={t.topic} value={t.topic}>
                        {t.topic} ({t.count} items)
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-text-muted">
                  Choose a specific syllabus unit to focus your drill, or practise across all topics.
                </p>
              </div>

              {/* Question Count Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Question Count
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 40].map((cnt) => {
                    const isPicked = questionCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                          isPicked
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-container border-border text-text-secondary hover:text-text-primary hover:bg-surface-variant'
                        }`}
                      >
                        {cnt} Qs
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1">
                  <span>Pacing: ~{Math.round(questionCount * 0.75)} mins</span>
                  <span>Target: &lt; 40s/item</span>
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                  Target Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'All Tiers' },
                    { id: 'standard', label: 'Standard' },
                    { id: 'hard', label: 'Challenge' },
                  ].map((tier) => {
                    const isPicked = difficulty === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setDifficulty(tier.id)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                          isPicked
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-container border-border text-text-secondary hover:text-text-primary hover:bg-surface-variant'
                        }`}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary telemetry pill */}
              <div className="p-3 rounded-xl bg-surface-container/60 border border-border space-y-1.5 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Exam Engine:</span>
                  <span className="font-semibold text-text-primary">Standardized Psychometric CBT</span>
                </div>
                <div className="flex justify-between">
                  <span>Falke AI Diagnostic:</span>
                  <span className="font-semibold text-emerald-500">Enabled (0 Coins)</span>
                </div>
                <div className="flex justify-between">
                  <span>Dedicated Endpoint:</span>
                  <span className="font-mono text-[10px] text-text-muted">/api/exam/sessions/drill</span>
                </div>
              </div>

              {/* Big Launch CTA */}
              <button
                type="button"
                disabled={isLaunching}
                onClick={handleLaunchDrill}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLaunching ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Preparing Diagnostic Drill...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch {activeSubjectData.name} Drill</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </StudentLayout>
  );
}
