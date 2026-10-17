import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout';
import {
  Calendar,
  Clock,
  Keyboard,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Folder,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { getMe } from '../features/auth/api';
import { ALL_CANONICAL_SUBJECTS, getSubjectLabel } from '../constants/subjects';
import { useToast } from '../components/ToastProvider';

interface TimetableSession {
  id?: string;
  _id?: string;
  subject: string;
  topic?: string;
  startTime: string;
  endTime: string;
}

export default function ExamHub() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [timetable, setTimetable] = useState<{ sessions?: TimetableSession[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: 'english',
    topic: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    getMe()
      .then((data) => setStudent(data))
      .catch(() => {});
    fetchTimetableData();
  }, []);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
      const timetableRes = await fetch(`${apiBase}/study/timetable`, {
        credentials: 'include',
      });

      if (timetableRes.ok) {
        const contentType = timetableRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setTimetable(await timetableRes.json());
        }
      }
    } catch (err) {
      console.error('Error fetching timetable data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.startTime || !newSession.endTime) {
      addToast({
        type: 'warning',
        title: 'Missing Time Range',
        message: 'Please choose both a start and end time for your revision session.',
      });
      return;
    }

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/study/timetable/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: newSession.subject,
          topic: newSession.topic || 'General Topic Drill',
          startTime: new Date(newSession.startTime).toISOString(),
          endTime: new Date(newSession.endTime).toISOString(),
        }),
      });

      if (res.ok) {
        setIsAddingSession(false);
        setNewSession({ subject: 'english', topic: '', startTime: '', endTime: '' });
        fetchTimetableData();
        addToast({
          type: 'success',
          title: 'Session Scheduled',
          message: 'Your revision session has been logged to your timetable.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Failed to Schedule',
          message: 'Could not log study session. Please try again.',
        });
      }
    } catch (err) {
      console.error('Failed to add study session', err);
    }
  };

  if (loading && !student) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const combination =
    student?.exam_subject_combination && student.exam_subject_combination.length === 4
      ? student.exam_subject_combination
      : ['english', 'mathematics', 'physics', 'chemistry'];

  return (
    <StudentLayout student={student}>
      <div className="space-y-6 pb-12">
        {/* HERO BANNER */}
        <section className="rounded-2xl border border-border bg-bg-card p-6 md:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              <Folder className="w-4 h-4" />
              <span>CBT Exam Hub &amp; High-Yield Resources</span>
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              UTME Examination Guidelines &amp; Study Scheduler
            </h1>
            <p className="text-sm md:text-base text-text-secondary leading-relaxed">
              Master the official JAMB 8-key CBT keyboard interface, review essential exam-day center rules, plan your study blocks, and track your complete syllabus coverage.
            </p>
          </div>
        </section>

        {/* 2-COLUMN MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (7 COLS): KEYBOARD HOTKEYS & EXAM DAY CHECKLIST */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Official 8-Key CBT Hotkeys Cheatsheet */}
            <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-text-primary">
                    Official JAMB 8-Key CBT Navigation System
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    No mouse required during the official examination. Memorize these keys.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'A', desc: 'Select Option A', badge: 'Option' },
                  { key: 'B', desc: 'Select Option B', badge: 'Option' },
                  { key: 'C', desc: 'Select Option C', badge: 'Option' },
                  { key: 'D', desc: 'Select Option D', badge: 'Option' },
                  { key: 'N', desc: 'Next Question Item', badge: 'Nav' },
                  { key: 'P', desc: 'Previous Question', badge: 'Nav' },
                  { key: 'S', desc: 'Submit Examination', badge: 'Final' },
                  { key: 'R', desc: 'Reverse / Unselect', badge: 'Action' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-xl border border-border bg-surface-container flex flex-col items-center justify-between text-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-bg-card border-2 border-primary/40 text-primary font-mono font-black text-lg flex items-center justify-center shadow-xs">
                      {item.key}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-primary block">{item.desc}</span>
                      <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{item.badge}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-high border border-border flex items-start gap-3 text-xs text-text-secondary">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-text-primary">Pro Tip:</strong> Our simulated exam console supports all 8 keys natively. Try taking full-length mock exams without touching your trackpad to build real exam muscle memory!
                </p>
              </div>
            </div>

            {/* 2. Official Center Rules & Requirements */}
            <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-text-primary">
                    Examination Day Rules &amp; Center Requirements
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Standard protocol across all accredited JAMB CBT centers nationwide.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-border bg-surface-container space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mandatory Items to Bring</span>
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>2 original copies of your UTME Exam Slip.</li>
                    <li>Biometric thumbprint verification at the gate.</li>
                    <li>Transparent water bottle without labels (optional).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface-container space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Strictly Prohibited Devices</span>
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Mobile phones, smart bands, or digital wristwatches.</li>
                    <li>External calculators, pens, books, or papers.</li>
                    <li>Bags, earpieces, or recording hardware.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 COLS): STUDY TIMETABLE & SYLLABUS JUMP */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Link to Full Syllabus */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-bg-card to-bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-text-primary">
                      Accredited UTME Syllabus
                    </h3>
                    <p className="text-[11px] text-text-muted">17 Subjects · Topic-by-Topic Mastery</p>
                  </div>
                </div>
                <Link
                  to="/study"
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <span>Open Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Track your retention across all 4 subjects in your combination: <strong className="text-text-primary">{combination.map(getSubjectLabel).join(', ')}</strong>. Automated Falke AI diagnostic grading updates your curriculum checklist after each drill.
              </p>
            </div>

            {/* Study Timetable Manager */}
            <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-text-primary">
                      Revision Timetable
                    </h3>
                    <p className="text-[11px] text-text-muted">Structured blocks for your daily preparation</p>
                  </div>
                </div>
                {!isAddingSession && (
                  <button
                    onClick={() => setIsAddingSession(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Block</span>
                  </button>
                )}
              </div>

              {isAddingSession && (
                <form
                  onSubmit={handleAddSession}
                  className="p-4 rounded-xl border border-border bg-surface-container space-y-3.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Schedule New Study Session
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingSession(false)}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                      Subject
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-bg-card border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={newSession.subject}
                      onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                    >
                      {ALL_CANONICAL_SUBJECTS.map((sub) => (
                        <option key={sub.key} value={sub.key}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                      Topic Focus (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chemical Kinetics, Vectors & Calculus"
                      className="w-full px-3 py-2 rounded-xl bg-bg-card border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                      value={newSession.topic}
                      onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-bg-card border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={newSession.startTime}
                        onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-bg-card border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={newSession.endTime}
                        onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingSession(false)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:text-text-primary"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors"
                    >
                      Save Session
                    </button>
                  </div>
                </form>
              )}

              {/* Sessions List */}
              {timetable?.sessions && timetable.sessions.length > 0 ? (
                <div className="space-y-2.5">
                  {timetable.sessions.map((session, idx) => (
                    <div
                      key={session.id || session._id || idx}
                      className="p-3.5 rounded-xl border border-border bg-surface-container flex items-center justify-between gap-3 hover:border-border-hover transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-xs font-bold text-text-primary truncate block">
                          {getSubjectLabel(session.subject)}
                        </span>
                        <p className="text-[11px] text-text-muted truncate">
                          {session.topic || 'General Practice'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {new Date(session.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted block font-mono">
                          {new Date(session.startTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 px-4 rounded-xl bg-surface-container border border-border text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">No Study Blocks Scheduled</h4>
                  <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                    Stay organized and keep your streak active by scheduling specific revision times for your electives.
                  </p>
                  {!isAddingSession && (
                    <button
                      onClick={() => setIsAddingSession(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors mt-2"
                    >
                      Schedule First Session
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
