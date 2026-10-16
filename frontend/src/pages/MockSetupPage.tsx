import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { getSubjectTopics, getQuestionSubjects } from '../features/questions/api';
import { createExamSession, createMockSession } from '../features/exam/api';
import { getSubjectLabel, normalizeSubjectKey } from '../constants/subjects';
import { StudentLayout } from '../components/StudentLayout';
import { getMe } from '../features/auth/api';

export default function MockSetupPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(true);

  // Default to English + 3 popular technical electives
  const [mockSubjects, setMockSubjects] = useState<string[]>(['english', 'mathematics', 'physics', 'chemistry']);
  const [mockDifficulty, setMockDifficulty] = useState<string>('any');
  const [examMode, setExamMode] = useState<'full_mock' | 'deficit_drill'>('full_mock');
  const [mockSubjectConfig, setMockSubjectConfig] = useState<Record<string, { mode: 'random' | 'specific'; topics: string[] }>>({});
  const [availableMockTopics, setAvailableMockTopics] = useState<Record<string, Array<{ topic: string; count: number }>>>({});
  const [isLoadingMockTopics, setIsLoadingMockTopics] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(2);

  const fallbackSubjects = [
    'english',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'economics',
    'government',
    'literature',
    'commerce',
    'accounting',
    'geography',
    'agriculture',
    'civic_education',
    'crk',
    'irk',
    'history',
    'further_mathematics',
  ];

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data);
        if (Array.isArray(data.exam_subject_combination) && data.exam_subject_combination.length === 4) {
          setMockSubjects(data.exam_subject_combination);
        }
      })
      .catch(() => {});

    getQuestionSubjects()
      .then((rows) => {
        const normalized = rows
          .map((row: any) => normalizeSubjectKey(row.subject))
          .filter(Boolean);
        const unique = [...new Set(normalized)];
        setAllSubjects(unique.length >= 4 ? unique : fallbackSubjects);
        setIsLoadingSubjects(false);
      })
      .catch((err) => {
        console.error(err);
        setAllSubjects(fallbackSubjects);
        setIsLoadingSubjects(false);
      });
  }, []);

  useEffect(() => {
    if (mockSubjects.length === 0) {
      setAvailableMockTopics({});
      setMockSubjectConfig({});
      return;
    }

    setIsLoadingMockTopics(true);
    const newTopicsMap: Record<string, Array<{ topic: string; count: number }>> = {};

    Promise.all(
      mockSubjects.map((subject) =>
        getSubjectTopics(subject)
          .then((topics) => {
            newTopicsMap[subject] = topics;
            if (!mockSubjectConfig[subject]) {
              setMockSubjectConfig((prev) => ({
                ...prev,
                [subject]: { mode: 'random', topics: [] },
              }));
            }
          })
          .catch((err) => console.error(`Failed to load topics for ${subject}`, err))
      )
    ).then(() => {
      setAvailableMockTopics(newTopicsMap);
      setIsLoadingMockTopics(false);
    });
  }, [mockSubjects]);

  const selectCombination = (combo: string[]) => {
    setMockSubjects(combo);
    addToast({
      type: 'info',
      title: 'Combination Applied',
      message: `Configured 4 subjects: ${combo.map(getSubjectLabel).join(', ')}`,
    });
  };

  const toggleSubject = (sub: string) => {
    if (sub === 'english') {
      addToast({
        type: 'info',
        title: 'Compulsory Subject',
        message: 'Use of English is required for all Nigerian UTME candidates.',
      });
      return;
    }

    if (mockSubjects.includes(sub)) {
      setMockSubjects((prev) => prev.filter((s) => s !== sub));
      setMockSubjectConfig((prev) => {
        const next = { ...prev };
        delete next[sub];
        return next;
      });
    } else {
      if (mockSubjects.length < 4) {
        setMockSubjects((prev) => [...prev, sub]);
      } else {
        addToast({
          type: 'warning',
          title: 'Maximum Subjects Reached',
          message: 'The official JAMB UTME allows exactly 4 subjects (Use of English + 3 Electives).',
        });
      }
    }
  };

  const handleStartMock = async () => {
    if (mockSubjects.length !== 4) {
      addToast({
        type: 'error',
        title: 'Invalid Combination',
        message: 'Please select exactly 4 subjects (Use of English + 3 electives) to begin.',
      });
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        type: examMode === 'full_mock' ? 'mock' : 'drill',
        difficultyLevel: mockDifficulty,
        subjects: mockSubjects,
      };

      const subjectConfigs = Object.entries(mockSubjectConfig).filter(
        ([_, config]) => config.mode === 'specific' && config.topics.length > 0
      );
      if (subjectConfigs.length > 0) {
        payload.subjectConfigs = Object.fromEntries(subjectConfigs);
      }

      const session = await createMockSession(payload);
      if (session.warnings && session.warnings.length > 0) {
        session.warnings.forEach((w: string) =>
          addToast({ type: 'info', title: 'Notice', message: w })
        );
      }
      navigate(`/exam/${session.id || session.sessionId}`);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Launch Failed',
        message: err.response?.data?.message || 'Failed to start exam session',
      });
      setLoading(false);
    }
  };

  const subjectsToDisplay = allSubjects.length > 0 ? allSubjects : fallbackSubjects;
  const terminalNodeId = user?.aurikrex_id || (user?.id ? `AKX-${String(user.id).slice(0, 6).toUpperCase()}` : 'CBT-ALLOC-01');

  return (
    <StudentLayout student={user}>
      <div className="w-full space-y-6">
        {/* Top Mission Banner & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-card p-5 rounded-2xl border border-border shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-text-secondary border border-border">
                <span className="material-symbols-outlined text-[14px] text-tertiary" data-weight="fill">
                  verified
                </span>
                Official 2025 JAMB CBT Spec
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-data font-semibold bg-accent-royal-blue/15 text-primary border border-accent-royal-blue/30">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-royal-blue animate-ping" />
                Armed · UTME Kiosk Mode
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-text-primary tracking-tight">
              Configure Your UTME Mock Simulation
            </h1>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Preset your official 4-subject roster, verify syllabus coverage, and launch in distraction-free standardized cafe emulation.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-container-low border border-border p-2.5 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-accent-royal-blue shadow-sm">
              <span className="material-symbols-outlined text-[24px]">terminal</span>
            </div>
            <div className="text-left pr-2">
              <div className="font-mono-data text-[11px] text-text-muted uppercase font-semibold">
                Terminal Token
              </div>
              <div className="font-mono-data text-mono-data text-text-primary font-bold">
                {terminalNodeId}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Step Progress Card (sm:hidden, matches Stitch Mobile Spec) */}
        <section className="sm:hidden bg-bg-card rounded-2xl p-4 border border-border flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/40 font-mono-data text-xs font-bold">
                STEP {wizardStep} OF 4
              </span>
              <span className="font-headline-sm font-semibold text-text-primary text-[14px]">
                {wizardStep === 1 && 'Exam Mode'}
                {wizardStep === 2 && 'Subject Combination'}
                {wizardStep === 3 && 'Timing & Emulation'}
                {wizardStep === 4 && 'Standardized Verification'}
              </span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
              mockSubjects.length === 4
                ? 'bg-tertiary/15 text-tertiary border-tertiary/30'
                : 'bg-warning-amber/15 text-warning-amber border-warning-amber/30'
            }`}>
              <span className="material-symbols-outlined text-[13px]">
                {mockSubjects.length === 4 ? 'check_circle' : 'pending'}
              </span>
              <span>{mockSubjects.length}/4 Valid</span>
            </div>
          </div>
          {/* Progress Track */}
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-full flex-1 rounded-full transition-all ${
                  step <= wizardStep ? 'bg-primary' : 'bg-surface-container'
                }`}
              />
            ))}
          </div>
        </section>

        {/* Desktop 4-Step Wizard Stepper (hidden sm:block) */}
        <div className="hidden sm:block w-full bg-bg-card border border-border p-4 rounded-2xl shadow-sm overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-[640px]">
            {/* Step 1 */}
            <div
              onClick={() => setWizardStep(1)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                wizardStep === 1
                  ? 'bg-accent-royal-blue/15 border border-accent-royal-blue/40'
                  : 'bg-surface-container-low border border-border'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-tertiary-container text-white flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-[18px]">done</span>
              </div>
              <div>
                <div className="font-label-sm text-[11px] uppercase tracking-wider text-text-muted font-bold">
                  Step 1
                </div>
                <div className="font-label-md text-label-md font-semibold text-text-primary">
                  Exam Mode
                </div>
                <div className="font-body-sm text-[11px] text-text-secondary">
                  {examMode === 'full_mock' ? 'Full 4-Subject Mock' : '15m Deficit Drill'}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setWizardStep(2)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                wizardStep === 2
                  ? 'bg-accent-royal-blue/15 border border-accent-royal-blue/40'
                  : 'bg-surface-container-low border border-border'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-accent-royal-blue text-white flex items-center justify-center font-bold text-sm shadow-md">
                2
              </div>
              <div>
                <div className="font-label-sm text-[11px] uppercase tracking-wider text-accent-royal-blue font-bold">
                  Step 2 · Active
                </div>
                <div className="font-label-md text-label-md font-bold text-text-primary">
                  Subject Selection
                </div>
                <div className="font-body-sm text-[11px] text-text-secondary">
                  {mockSubjects.length}/4 Selected
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setWizardStep(3)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                wizardStep === 3
                  ? 'bg-accent-royal-blue/15 border border-accent-royal-blue/40'
                  : 'bg-surface-container-low border border-border'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-text-secondary flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <div className="font-label-sm text-[11px] uppercase tracking-wider text-text-muted font-bold">
                  Step 3
                </div>
                <div className="font-label-md text-label-md font-semibold text-text-primary">
                  Timing & Mode
                </div>
                <div className="font-body-sm text-[11px] text-text-secondary">
                  120m Countdown
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => setWizardStep(4)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                wizardStep === 4
                  ? 'bg-accent-royal-blue/15 border border-accent-royal-blue/40'
                  : 'bg-surface-container-low border border-border'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-text-secondary flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <div className="font-label-sm text-[11px] uppercase tracking-wider text-text-muted font-bold">
                  Step 4
                </div>
                <div className="font-label-md text-label-md font-semibold text-text-primary">
                  Verification
                </div>
                <div className="font-body-sm text-[11px] text-text-secondary">
                  Ready to Launch
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMBINATION QUICK PRESETS */}
        <section className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                Quick Subject Combination Presets
              </h2>
              <p className="text-body-sm text-text-secondary mt-0.5">
                Load official accredited UTME combinations for your targeted university faculty with one click.
              </p>
            </div>
            <span className="text-xs font-mono-data text-tertiary bg-tertiary/10 border border-tertiary/30 px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
              Standard 4-Subject Combinations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => selectCombination(['english', 'mathematics', 'physics', 'chemistry'])}
              className="p-3.5 rounded-xl border border-border bg-surface-container-low hover:border-accent-royal-blue text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-body-sm text-text-primary group-hover:text-primary">
                  Engineering & Physical
                </span>
                <span className="material-symbols-outlined text-sm text-text-muted">bolt</span>
              </div>
              <p className="text-xs text-text-muted font-mono-data">
                Eng · Math · Phy · Chem
              </p>
            </button>

            <button
              onClick={() => selectCombination(['english', 'biology', 'chemistry', 'physics'])}
              className="p-3.5 rounded-xl border border-border bg-surface-container-low hover:border-accent-royal-blue text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-body-sm text-text-primary group-hover:text-primary">
                  Medicine & Health Sciences
                </span>
                <span className="material-symbols-outlined text-sm text-text-muted">medical_services</span>
              </div>
              <p className="text-xs text-text-muted font-mono-data">
                Eng · Bio · Chem · Phy
              </p>
            </button>

            <button
              onClick={() => selectCombination(['english', 'mathematics', 'economics', 'government'])}
              className="p-3.5 rounded-xl border border-border bg-surface-container-low hover:border-accent-royal-blue text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-body-sm text-text-primary group-hover:text-primary">
                  Social Sciences & Admin
                </span>
                <span className="material-symbols-outlined text-sm text-text-muted">account_balance</span>
              </div>
              <p className="text-xs text-text-muted font-mono-data">
                Eng · Math · Econ · Gov
              </p>
            </button>

            <button
              onClick={() => selectCombination(['english', 'literature', 'government', 'crk'])}
              className="p-3.5 rounded-xl border border-border bg-surface-container-low hover:border-accent-royal-blue text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-body-sm text-text-primary group-hover:text-primary">
                  Arts, Law & Humanities
                </span>
                <span className="material-symbols-outlined text-sm text-text-muted">gavel</span>
              </div>
              <p className="text-xs text-text-muted font-mono-data">
                Eng · Lit · Gov · CRK
              </p>
            </button>
          </div>
        </section>

        {/* 17 SUBJECTS ACCREDITED ROSTER */}
        <section className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                Select Your 4 Subjects
              </h2>
              <p className="text-body-sm text-text-secondary mt-0.5">
                Use of English is compulsory (60 questions). Select 3 additional electives (40 questions each) for the 180Q mock.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span
                className={`font-mono-data text-xs px-3 py-1 rounded-full border font-bold ${
                  mockSubjects.length === 4
                    ? 'bg-tertiary/15 border-tertiary text-tertiary'
                    : 'bg-amber-500/15 border-amber-500 text-amber-500'
                }`}
              >
                {mockSubjects.length} of 4 Subjects Selected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {isLoadingSubjects ? (
              <div className="col-span-full py-12 text-center text-text-muted">
                Loading accredited JAMB subjects...
              </div>
            ) : (
              subjectsToDisplay.map((sub) => {
                const isSelected = mockSubjects.includes(sub);
                const isCompulsory = sub === 'english';

                return (
                  <div
                    key={sub}
                    onClick={() => toggleSubject(sub)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-accent-royal-blue bg-accent-royal-blue/10 ring-1 ring-accent-royal-blue/30'
                        : 'border-border bg-surface-container-low hover:border-border-hover'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-accent-royal-blue text-white'
                              : 'bg-surface-container text-text-muted'
                          }`}
                        >
                          {isSelected ? '✓' : '+'}
                        </span>
                        {isCompulsory && (
                          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/30 font-semibold">
                            Compulsory
                          </span>
                        )}
                        {!isCompulsory && isSelected && (
                          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary border border-tertiary/30 font-semibold">
                            Elective
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-body-sm text-text-primary">
                        {getSubjectLabel(sub)}
                      </h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted font-mono-data">
                      <span>{isCompulsory ? '60 Questions' : '40 Questions'}</span>
                      <span>{isSelected ? 'Active' : 'Click to select'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* DIFFICULTY & SIMULATION CONTROLS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-body-sm text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">tune</span>
              Standardized Difficulty Level
            </h3>
            <p className="text-body-sm text-text-secondary">
              Algorithmic distribution calibrated against past JAMB UTME psychometric tables.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {[
                ['any', 'Standard UTME', 'Accredited past questions mix'],
                ['3', 'Foundation', 'Ideal for first-time candidates'],
                ['5', 'Challenge 350+', 'High-cutoff faculties drill'],
              ].map(([val, label, sub]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMockDifficulty(val)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mockDifficulty === val
                      ? 'border-accent-royal-blue bg-accent-royal-blue/15 text-primary font-semibold'
                      : 'border-border bg-surface-container-low text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="font-bold text-xs">{label}</div>
                  <div className="text-[10px] text-text-muted mt-1 leading-tight">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-body-sm text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-ai-gold">timer</span>
              Timing & Standardized Cafe Emulation
            </h3>
            <p className="text-body-sm text-text-secondary">
              Strict 120-minute master clock (<span className="font-mono-data text-primary">02:00:00</span>) with auto-save & auto-submit on expiry.
            </p>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-text-primary block">Full 4-Subject UTME Simulation</span>
                <span className="text-text-muted">180 Questions · 400 Total Marks</span>
              </div>
              <span className="font-mono-timer text-lg font-bold text-secondary">02:00:00</span>
            </div>
          </div>
        </section>

        {/* BOTTOM LAUNCH ACTION BAR */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sticky bottom-4 z-40 backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container border border-border flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            </div>
            <div>
              <div className="font-bold text-body-sm text-text-primary">
                {mockSubjects.length === 4
                  ? 'All 4 Subjects Armed · Ready for Simulation'
                  : `Please select ${4 - mockSubjects.length} more subject${4 - mockSubjects.length === 1 ? '' : 's'}`}
              </div>
              <div className="text-xs text-text-muted font-mono-data">
                {mockSubjects.map(getSubjectLabel).join(' + ')}
              </div>
            </div>
          </div>

          <button
            disabled={loading || mockSubjects.length !== 4}
            onClick={handleStartMock}
            className={`w-full sm:w-auto justify-center flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-xl font-label-md text-label-md font-bold transition-all shadow-lg active:scale-[0.98] ${
              loading || mockSubjects.length !== 4
                ? 'opacity-50 cursor-not-allowed bg-surface-container text-text-muted'
                : 'bg-accent-royal-blue hover:bg-primary-container text-white shadow-accent-royal-blue/25'
            }`}
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            <span>
              {loading ? 'Initializing Simulation Session...' : 'Launch Full 4-Subject Mock (Free)'}
            </span>
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
