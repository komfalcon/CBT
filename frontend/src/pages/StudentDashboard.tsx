import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe } from '../features/auth/api';
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
} from 'lucide-react';

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
};

const AVAILABLE_SUBJECTS = Object.keys(SUBJECT_LABELS).filter((s) => s !== 'english');

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (!savedToken) {
      navigate('/auth?mode=login');
      return;
    }
    setToken(savedToken);
    fetchProfile(savedToken);
  }, [navigate]);

  const fetchProfile = async (authToken: string) => {
    setLoading(true);
    try {
      const data = await getMe(authToken);
      setStudent(data);
      setSelectedSubjects(data.exam_subject_combination || ['english']);
    } catch (err: any) {
      console.error(err);
      setError('Session expired or failed to load profile.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/auth?mode=login');
    } finally {
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
          return prev; // Max 4 subjects (English + 3 choices)
        }
        return [...prev, subject];
      }
    });
  };

  const handleSaveCombination = async () => {
    // English is mandatory
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
          <p className="text-sm text-slate-400">Loading student profile...</p>
        </div>
      </div>
    );
  }

  const combination = student?.exam_subject_combination || [];
  const isCombinationValid = combination.length === 4 && combination.includes('english');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-auto relative">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white">
              CBT
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Student Workspace
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="mx-auto max-w-7xl px-6 py-8 grid gap-8 md:grid-cols-3">
        {/* Left Column: Profile Card & Roaming CBT Key */}
        <div className="space-y-6">
          {/* Student Profile Info */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-indigo-500/20">
                {student?.fullName ? student.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{student?.fullName}</h2>
                <p className="text-xs text-slate-400">{student?.email}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  UTME Candidate
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-900 pt-4 text-center">
              <div>
                <div className="text-xs text-slate-400">Level</div>
                <div className="text-sm font-bold text-indigo-400">{student?.level || 1}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">XP Points</div>
                <div className="text-sm font-bold text-violet-400">{student?.xp_points || 0} XP</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Streak</div>
                <div className="text-sm font-bold text-pink-400">{student?.streak_count || 0} days</div>
              </div>
            </div>
          </div>

          {/* CBT Access Key - Cafe Roaming Code */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Cafe Roaming CBT Access Key</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use this key to sign in quickly at cafe terminals or CBT training halls without inputting your password. Keep this key secure.
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 p-3">
              <span className="font-mono text-sm tracking-wider text-indigo-300 select-all flex-1">
                {student?.cbt_key}
              </span>
              <button
                onClick={handleCopyKey}
                className="p-1 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:text-white transition-colors"
                title="Copy CBT Key"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center/Right Column: Subject Selection & Simulator Launchers */}
        <div className="md:col-span-2 space-y-6">
          {message && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
              {message}
            </div>
          )}

          {/* Combination Warning */}
          {!isCombinationValid && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 flex flex-col sm:flex-row items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="text-sm font-bold text-white">Complete Your Subject Combination First!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  JAMB UTME mandates that you register English Language and 3 elective subjects matching your chosen university course. Set this up to enable practice launchers.
                </p>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  Set Combination Now
                </button>
              </div>
            </div>
          )}

          {/* Subject Combination Showcase */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Your Subject Combination</h3>
              </div>
              {isCombinationValid && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Change
                </button>
              )}
            </div>

            {isCombinationValid ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {combination.map((sub: string) => (
                  <div
                    key={sub}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400">
                      {sub.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{SUBJECT_LABELS[sub] || sub}</div>
                      <div className="text-xs text-slate-500">JAMB UTME Syllabus</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">No subject combination configured.</p>
            )}
          </div>

          {/* Test Launcher Grid */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Play className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">UTME practice Center</h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Launcher Card 1: 4-Subject Mock */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-white mb-2">4-Subject Mock Exam</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Full computer-based simulation mirroring the 180 questions and strict countdown timer of the JAMB UTME exam.
                  </p>
                </div>
                <button
                  disabled={!isCombinationValid}
                  onClick={() => alert('Practice Exam logic will load in the Exam Simulator module.')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  Start Simulation Mock
                </button>
              </div>

              {/* Launcher Card 2: Single Subject Practice */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-white mb-2">Single Subject drills</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Focus on individual areas. Practice 10, 20, or 40 questions at your own speed with instant feedback.
                  </p>
                </div>
                <button
                  disabled={!isCombinationValid}
                  onClick={() => alert('Practice drill will load in the Exam Simulator.')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 py-3 text-sm font-bold text-slate-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  Configure Subject drill
                </button>
              </div>
            </div>
          </div>

          {/* Performance Dashboard Mock charts */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">UTME Performance Overview</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-850 text-center">
                <div className="text-xs text-slate-400">Total Exams Completed</div>
                <div className="text-2xl font-black text-white mt-1">0</div>
                <span className="text-[10px] text-slate-500">Practice makes perfect</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-850 text-center">
                <div className="text-xs text-slate-400">Average UTME Score</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">N/A</div>
                <span className="text-[10px] text-slate-500">Target score is 300+</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-850 text-center">
                <div className="text-xs text-slate-400">Syllabus Completion</div>
                <div className="text-2xl font-black text-violet-400 mt-1">0%</div>
                <span className="text-[10px] text-slate-500">All subjects included</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Subject Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-850 bg-slate-900 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Select Your Subject Combination</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Every candidate must sit for Use of English. You must select **exactly three (3) elective subjects** to complete your JAMB combination.
            </p>

            <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1">
              <div className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 select-none opacity-80">
                <Check className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Use of English (Compulsory)</span>
              </div>

              {AVAILABLE_SUBJECTS.map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleToggleSubject(subject)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded flex items-center justify-center border text-[10px] font-bold ${
                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && '✓'}
                    </span>
                    <span className="text-sm font-medium">{SUBJECT_LABELS[subject]}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-xs text-slate-400">
                Selected: <strong className="text-indigo-400">{selectedSubjects.filter((s) => s !== 'english').length + 1} / 4</strong> (Needs exactly 4)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCombination}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white"
                >
                  Save Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
