import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout';
import { getSubjectLabel } from '../constants/subjects';
import { getTopicStats, TopicStatRecord } from '../features/results/api';
import { getMe } from '../features/auth/api';
import { BookOpen, CheckCircle2, Clock, AlertTriangle, ArrowRight, Play, Sparkles } from 'lucide-react';

interface SubTopic {
  id: string;
  name: string;
  status: 'mastered' | 'in_progress' | 'deficit' | 'unattempted';
  accuracy: number;
  drillsCompleted: number;
  isCompletedManually?: boolean;
}

interface SubjectSyllabus {
  subject: string;
  masteryPercent: number;
  topics: SubTopic[];
}

// Canonical syllabus topics exactly matching backend questions dataset topics
const CANONICAL_CURRICULUM: Record<string, string[]> = {
  english: [
    'Lexis and Structure',
    'Oral English',
    'Comprehension and Sentence Interpretation',
  ],
  mathematics: [
    'Number and Algebra',
    'Calculus',
    'Geometry and Trigonometry',
    'Statistics and Probability',
  ],
  physics: [
    'Mechanics',
    'Thermal Physics',
    'Waves and Optics',
    'Electricity and Magnetism',
    'Modern Physics',
  ],
  chemistry: [
    'Atomic Structure and Periodicity',
    'Chemical Bonding',
    'Stoichiometry',
    'Thermochemistry',
    'Electrochemistry',
    'Organic Chemistry',
    'Chemical Kinetics and Equilibrium',
    'States of Matter',
    'Acids, Bases and Salts',
    'Environmental Chemistry',
  ],
  biology: [
    'Cell Biology',
    'Plant Anatomy and Physiology',
    'Human Anatomy and Physiology',
    'Genetics and Evolution',
    'Ecology',
  ],
  economics: [
    'Basic Economic Concepts and Systems',
    'Theory of Production, Cost and Revenue',
    'Market Structures',
    'National Income and Economic Analysis',
    'Money, Banking and Inflation',
    'International Trade and Economic Organizations',
    'Public Finance',
    'Economic Growth and Development',
  ],
  government: [
    'Political Systems and Ideologies',
    'Constitutional Developments in Nigeria',
    'Basic Concepts in Government',
    'Arms of Government and Electoral Processes',
    "Nigeria's Foreign Policy and International Relations",
  ],
  literature: [
    'Drama and Dramatic Techniques',
    'Poetry and Poetic Devices',
    'Prose and Narrative Devices',
    'General Literary Principles',
  ],
  commerce: [
    'Introduction to Commerce and Occupations',
    'Trade (Home and Foreign)',
    'Aids to Trade',
    'Business Units and Finance',
    'Commercial Regulations and Legal Aspects',
  ],
  accounting: [
    'Introduction to Financial Accounting',
    'Double Entry Bookkeeping',
    'Final Accounts of a Sole Trader',
    'Adjustments to Final Accounts',
    'Partnership Accounts',
    'Company Accounts',
  ],
  geography: [
    'Physical Geography',
    'Practical Geography and Map Work',
    'Human and Regional Geography',
    'Introduction to Geographic Information Systems (GIS)',
    'Weather, Climate and Seasons',
  ],
  agriculture: [
    'Agronomy (Crop Production)',
    'Agricultural Economics and Extension',
    'Animal Science and Production',
    'General Agriculture and Ecology',
    'Agricultural Engineering and Technology',
  ],
  civic_education: [
    'Government Systems and Civic Processes',
    'National Values, Rights and Obligations',
    'Emerging Societal Issues',
  ],
  crk: [
    'Old Testament (Creation to Exile)',
    'New Testament (Life and Ministry of Jesus)',
    "The Early Church and Paul's Mission",
  ],
  irk: [
    "The Qur'an (Revelation and Compilation)",
    'Hadith (Study of Prophetic Sayings)',
    'Tawhid and Fiqh (Islamic Law)',
    'Islamic History and Culture in West Africa',
    'Shariah Law (Sources and Applications)',
    'Pillars of Islam (Salat, Zakat, Sawm, Hajj)',
  ],
  history: [
    'Pre-colonial Nigeria',
    'European Contact and British Conquest',
    'Nationalist Movements and Independence',
    'Post-Independence Nigeria and Foreign Relations',
    'The Nigerian Civil War (1967-1970)',
  ],
  further_mathematics: [
    'Pure Mathematics',
    'Calculus',
    'Coordinate Geometry',
    'Vectors and Mechanics',
    'Statistics and Probability',
    'Trigonometry',
  ],
};

export default function SyllabusTrackerPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [activeSubject, setActiveSubject] = useState<string>('english');
  const [topicStats, setTopicStats] = useState<TopicStatRecord[]>([]);
  const [persistedSyllabus, setPersistedSyllabus] = useState<Record<string, string[]>>({});
  const [isUpdatingTopic, setIsUpdatingTopic] = useState<string | null>(null);

  const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

  useEffect(() => {
    getMe()
      .then((data) => {
        setStudent(data);
        if (Array.isArray(data.exam_subject_combination) && data.exam_subject_combination.length > 0) {
          setActiveSubject(data.exam_subject_combination[0]);
        }
      })
      .catch(() => {});

    getTopicStats()
      .then((data) => setTopicStats(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load topic stats', err));

    // Fetch persisted syllabus progress from database
    fetch(`${apiBase}/study/syllabus`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((trackers: Array<{ subject: string; completedTopics: string[] }>) => {
        if (Array.isArray(trackers)) {
          const map: Record<string, string[]> = {};
          trackers.forEach((t) => {
            map[t.subject.toLowerCase()] = Array.isArray(t.completedTopics) ? t.completedTopics : [];
          });
          setPersistedSyllabus(map);
        }
      })
      .catch((err) => console.error('Failed to load syllabus trackers', err));
  }, [apiBase]);

  const daysToExam = useMemo(() => {
    const examSeason = new Date('2026-04-18T08:00:00Z');
    const diffTime = examSeason.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, []);

  const handleToggleManualTopic = async (subject: string, topicName: string, currentCompleted: boolean) => {
    setIsUpdatingTopic(topicName);
    const subKey = subject.toLowerCase();
    try {
      const res = await fetch(`${apiBase}/study/syllabus/${subKey}/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic: topicName,
          completed: !currentCompleted,
        }),
      });

      if (res.ok) {
        setPersistedSyllabus((prev) => {
          const currentList = prev[subKey] || [];
          const nextList = !currentCompleted
            ? [...currentList, topicName]
            : currentList.filter((t) => t !== topicName);
          return { ...prev, [subKey]: nextList };
        });
      }
    } catch (err) {
      console.error('Failed to update topic status', err);
    } finally {
      setIsUpdatingTopic(null);
    }
  };

  const enrichedSyllabus = useMemo(() => {
    const result: Record<string, SubjectSyllabus> = {};
    let totalAllTopics = 0;
    let masteredAllTopics = 0;
    let inProgressAllTopics = 0;
    let deficitAllTopics = 0;

    Object.entries(CANONICAL_CURRICULUM).forEach(([subjKey, topicNames]) => {
      let subjectMastered = 0;
      const completedInDb = persistedSyllabus[subjKey.toLowerCase()] || [];

      const enrichedTopics: SubTopic[] = topicNames.map((name, idx) => {
        totalAllTopics++;
        const isCompletedManually = completedInDb.includes(name);

        const stat = topicStats.find(
          (s) =>
            (s.subject || '').toLowerCase() === subjKey.toLowerCase() &&
            (s.topic || '').toLowerCase() === name.toLowerCase()
        );

        if (stat && stat.total > 0) {
          const acc = Math.round(Number(stat.accuracy || 0));
          const status: 'mastered' | 'in_progress' | 'deficit' =
            acc >= 75 ? 'mastered' : acc < 50 ? 'deficit' : 'in_progress';

          if (status === 'mastered' || isCompletedManually) {
            subjectMastered++;
            masteredAllTopics++;
          } else if (status === 'in_progress') {
            inProgressAllTopics++;
          } else {
            deficitAllTopics++;
          }

          return {
            id: `${subjKey}-${idx}`,
            name,
            status,
            accuracy: acc,
            drillsCompleted: stat.total,
            isCompletedManually,
          };
        }

        if (isCompletedManually) {
          subjectMastered++;
          masteredAllTopics++;
        }

        return {
          id: `${subjKey}-${idx}`,
          name,
          status: isCompletedManually ? 'mastered' : 'unattempted',
          accuracy: 0,
          drillsCompleted: 0,
          isCompletedManually,
        };
      });

      const masteryPercent =
        topicNames.length > 0 ? Math.round((subjectMastered / topicNames.length) * 100) : 0;

      result[subjKey] = {
        subject: subjKey,
        masteryPercent,
        topics: enrichedTopics,
      };
    });

    const globalMasteryPercent =
      totalAllTopics > 0 ? Math.round((masteredAllTopics / totalAllTopics) * 100) : 0;

    return {
      syllabusData: result,
      totalAllTopics,
      masteredAllTopics,
      inProgressAllTopics,
      deficitAllTopics,
      globalMasteryPercent,
    };
  }, [topicStats, persistedSyllabus]);

  const currentSyllabus = enrichedSyllabus.syllabusData[activeSubject] || enrichedSyllabus.syllabusData['english'];
  const allSubjectKeys = Object.keys(CANONICAL_CURRICULUM);

  return (
    <StudentLayout student={student}>
      <div className="space-y-6">
        {/* Bento Header */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <BookOpen className="w-3.5 h-3.5" />
                  Official JAMB e-Syllabus Sync 2025/2026
                </span>
                <span className="text-text-muted text-xs font-mono">• 17 Accredited Subjects</span>
              </div>
              <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
                JAMB UTME Official Syllabus Tracker & Topic Mastery
              </h1>
              <p className="text-text-secondary text-sm mt-1.5">
                Track your topic mastery across official JAMB curriculum areas, check off completed modules, and launch targeted diagnostic drills directly.
              </p>
            </div>

            {/* Target Exam Date Countdown Badge */}
            <div className="bg-surface-container border border-border rounded-2xl p-4 flex items-center gap-4 min-w-[240px] shrink-0">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 font-mono text-xl tracking-tight font-bold">
                    {daysToExam > 0 ? `${daysToExam} Days` : 'Exam Active'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                </div>
                <p className="text-text-secondary text-xs">to UTME Examination Window</p>
                <p className="text-[11px] font-mono text-text-muted">Target: 320+ Agg.</p>
              </div>
            </div>
          </div>

          {/* Telemetry Progress Overview Bar */}
          <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">Global Syllabus Mastery</span>
                <span className="text-emerald-500 font-mono font-bold">{enrichedSyllabus.globalMasteryPercent}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${enrichedSyllabus.globalMasteryPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono">
                {enrichedSyllabus.masteredAllTopics} of {enrichedSyllabus.totalAllTopics} Sub-topics Mastered
              </span>
            </div>

            <div className="bg-surface-container border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">Active In-Progress</span>
                <span className="text-blue-500 font-mono font-bold">
                  {enrichedSyllabus.inProgressAllTopics} Topics
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      enrichedSyllabus.totalAllTopics > 0
                        ? Math.min(100, Math.round((enrichedSyllabus.inProgressAllTopics / enrichedSyllabus.totalAllTopics) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono">50% - 74% Practice Accuracy</span>
            </div>

            <div className="bg-surface-container border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">Critical Deficit Areas</span>
                <span className="text-rose-500 font-mono font-bold">
                  {enrichedSyllabus.deficitAllTopics} Topics
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      enrichedSyllabus.totalAllTopics > 0
                        ? Math.min(100, Math.round((enrichedSyllabus.deficitAllTopics / enrichedSyllabus.totalAllTopics) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono">
                {enrichedSyllabus.deficitAllTopics > 0 ? 'Requires urgent diagnostic drills' : 'No critical deficits detected'}
              </span>
            </div>

            <div className="bg-surface-container border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">Curriculum Exam Coverage</span>
                <span className="text-amber-500 font-mono font-bold">
                  {enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics} / {enrichedSyllabus.totalAllTopics}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      enrichedSyllabus.totalAllTopics > 0
                        ? Math.min(100, Math.round(((enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics) / enrichedSyllabus.totalAllTopics) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono">
                {enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics > 0
                  ? `${enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics} sub-topics tested in arena`
                  : 'Practice topics in arena to track coverage'}
              </span>
            </div>
          </div>
        </section>

        {/* 17-Subject Syllabus Matrix & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold font-display text-text-primary">
                    17-Subject Syllabus Curriculum Matrix
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface-container text-text-secondary border border-border">
                    Active: {getSubjectLabel(activeSubject)}
                  </span>
                </div>
              </div>

              {/* Subject Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 custom-scroll">
                {allSubjectKeys.map((sub) => {
                  const isActive = activeSubject === sub;
                  const data = enrichedSyllabus.syllabusData[sub];
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSubject(sub)}
                      className={`px-3 py-2 rounded-xl border text-left shrink-0 transition-all ${
                        isActive
                          ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                          : 'border-border bg-surface-container hover:border-border-hover text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-text-primary whitespace-nowrap">
                          {getSubjectLabel(sub)}
                        </span>
                        {sub === 'english' && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/20 text-primary">
                            Compulsory
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-emerald-500">
                          {data?.masteryPercent ?? 0}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sub-Topics Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-text-muted px-1">
                  <span>Accredited Curriculum Sub-Skill ({getSubjectLabel(activeSubject)})</span>
                  <span>Accuracy &amp; Actions</span>
                </div>

                {currentSyllabus.topics.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-surface-container border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-hover transition-colors"
                  >
                    <div className="space-y-1.5 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleManualTopic(activeSubject, t.name, Boolean(t.isCompletedManually))}
                        disabled={isUpdatingTopic === t.name}
                        title={t.isCompletedManually ? 'Mark uncompleted' : 'Mark completed'}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          t.isCompletedManually
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-border hover:border-primary text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              t.status === 'mastered'
                                ? 'bg-emerald-500'
                                : t.status === 'deficit'
                                ? 'bg-rose-500'
                                : t.status === 'in_progress'
                                ? 'bg-blue-500'
                                : 'bg-text-muted/40'
                            }`}
                          />
                          <span className="font-bold text-sm text-text-primary">{t.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-muted font-mono mt-1">
                          <span>{t.drillsCompleted > 0 ? `${t.drillsCompleted} questions tested` : 'Untested in drills'}</span>
                          <span>•</span>
                          <span
                            className={
                              t.status === 'mastered'
                                ? 'text-emerald-500 font-medium'
                                : t.status === 'deficit'
                                ? 'text-rose-500 font-medium'
                                : t.status === 'in_progress'
                                ? 'text-blue-500 font-medium'
                                : 'text-text-muted'
                            }
                          >
                            {t.status === 'mastered'
                              ? 'Mastered (75%+)'
                              : t.status === 'deficit'
                              ? 'Deficit (<50%)'
                              : t.status === 'in_progress'
                              ? 'In Progress (50-74%)'
                              : 'Not Started'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-mono text-sm font-bold text-text-primary">
                        {t.accuracy > 0 ? `${t.accuracy}%` : '—'}
                      </span>
                      <button
                        onClick={() => navigate(`/questions?subject=${activeSubject}`)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface-container-high hover:bg-surface-variant text-primary text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98]"
                      >
                        <Play className="w-3 h-3" />
                        <span>Practice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Study Timetable & AI Tutor */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold font-display text-text-primary">
                  Weekly High-Yield Timetable
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Algorithmic study schedule designed to repair critical deficits before national test kickoff.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { day: 'Mon', sub: 'Use of English', focus: 'Oral English & Lexis', time: '17:00 - 18:30' },
                  { day: 'Tue', sub: 'Mathematics', focus: 'Number, Algebra & Calculus', time: '17:00 - 18:30' },
                  { day: 'Wed', sub: 'Physics / Commercial', focus: 'Mechanics & Electricity', time: '18:00 - 19:30' },
                  { day: 'Thu', sub: 'Chemistry / Arts', focus: 'Organic Chemistry & Stoichiometry', time: '17:00 - 18:30' },
                  { day: 'Sat', sub: 'Full Mock Sitting', focus: '180Q Standard JAMB Simulation', time: '10:00 - 12:00' },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-surface-container border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                          {slot.day}
                        </span>
                        <span className="font-semibold text-text-primary">{slot.sub}</span>
                      </div>
                      <p className="text-text-muted mt-1">{slot.focus}</p>
                    </div>
                    <span className="font-mono text-text-secondary text-[11px]">{slot.time}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/mock-setup')}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Launch Weekend 180Q Mock</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
