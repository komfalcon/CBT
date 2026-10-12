import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNavbar } from '../components/AppNavbar';
import { getSubjectLabel } from '../constants/subjects';
import { getTopicStats, TopicStatRecord } from '../features/results/api';
import { getMe } from '../features/auth/api';

interface SubTopic {
  id: string;
  name: string;
  status: 'mastered' | 'in_progress' | 'deficit' | 'unattempted';
  accuracy: number;
  drillsCompleted: number;
}

interface SubjectSyllabus {
  subject: string;
  masteryPercent: number;
  topics: SubTopic[];
}

const BASE_CURRICULUM: Record<string, Array<{ id: string; name: string }>> = {
  english: [
    { id: 'eng-1', name: 'Comprehension & Passage Interpretation' },
    { id: 'eng-2', name: 'Lexis & Structure: Synonyms and Antonyms' },
    { id: 'eng-3', name: 'Oral Forms: Vowel and Consonant Phonemes' },
    { id: 'eng-4', name: 'Oral Forms: Stress Patterns and Intonation' },
    { id: 'eng-5', name: 'Sentence Structure, Concord & Modifiers' },
    { id: 'eng-6', name: 'Idioms, Phrasal Verbs & Collocations' },
  ],
  mathematics: [
    { id: 'math-1', name: 'Algebra: Polynomials & Quadratic Equations' },
    { id: 'math-2', name: 'Calculus: Differentiation & Applications' },
    { id: 'math-3', name: 'Calculus: Integration & Definite Integrals' },
    { id: 'math-4', name: 'Trigonometry: Identities & Graphs' },
    { id: 'math-5', name: 'Statistics & Probability Distributions' },
    { id: 'math-6', name: 'Matrices & Determinants in 2x2 and 3x3' },
  ],
  physics: [
    { id: 'phy-1', name: 'Mechanics: Kinematics & Projectile Motion' },
    { id: 'phy-2', name: 'Mechanics: Work, Energy, and Power' },
    { id: 'phy-3', name: 'Electromagnetism: Induction & Alternating Current' },
    { id: 'phy-4', name: 'Waves: Resonance, Optics, and Sound Velocity' },
    { id: 'phy-5', name: 'Thermal Physics: Gas Laws & Thermodynamics' },
    { id: 'phy-6', name: 'Atomic & Nuclear Physics: Radioactivity' },
  ],
  chemistry: [
    { id: 'chm-1', name: 'Atomic Structure & Periodic Classification' },
    { id: 'chm-2', name: 'Chemical Bonding, Shapes & Intermolecular Forces' },
    { id: 'chm-3', name: 'Organic Chemistry: Hydrocarbons & Functional Groups' },
    { id: 'chm-4', name: 'Electrochemistry: Electrolysis & Faraday’s Laws' },
    { id: 'chm-5', name: 'Chemical Equilibrium & Le Chatelier’s Principle' },
    { id: 'chm-6', name: 'Acids, Bases, Salts & Volumetric Analysis' },
  ],
  biology: [
    { id: 'bio-1', name: 'Cell Structure, Organization & Cellular Transport' },
    { id: 'bio-2', name: 'Plant & Animal Physiology (Nutrition, Transport)' },
    { id: 'bio-3', name: 'Genetics: Mendelian Inheritance & Genetic Variation' },
    { id: 'bio-4', name: 'Ecology: Ecosystem Energy Flow, Habitats & Biomes' },
    { id: 'bio-5', name: 'Reproductive Systems in Flowering Plants & Mammals' },
    { id: 'bio-6', name: 'Evolution, Adaptation & Population Dynamics' },
  ],
  economics: [
    { id: 'eco-1', name: 'Theory of Consumer Behavior, Demand & Supply' },
    { id: 'eco-2', name: 'Production Theory & Costs of Production' },
    { id: 'eco-3', name: 'National Income Accounting & Equilibrium Output' },
    { id: 'eco-4', name: 'Money, Commercial Banking & Central Bank Monetary Policy' },
    { id: 'eco-5', name: 'Public Finance: Taxation, Budgets & National Debt' },
    { id: 'eco-6', name: 'International Trade, Tariffs & Exchange Rates' },
  ],
  government: [
    { id: 'gov-1', name: 'Basic Political Concepts: State, Sovereignty, Power' },
    { id: 'gov-2', name: 'Forms and Systems of Government (Federal, Unitary, Parl.)' },
    { id: 'gov-3', name: 'Constitutional Development in Nigeria (1922–1999)' },
    { id: 'gov-4', name: 'Arms of Government: Legislature, Executive & Judiciary' },
    { id: 'gov-5', name: 'Nigerian Federalism: Revenue Allocation & States' },
    { id: 'gov-6', name: 'Nigeria Foreign Policy & International Organizations (ECOWAS, AU)' },
  ],
  literature: [
    { id: 'lit-1', name: 'Literary Devices: Imagery, Metaphor, Irony, Symbolism' },
    { id: 'lit-2', name: 'African Drama: Theatrical Techniques & Thematic Study' },
    { id: 'lit-3', name: 'Non-African Drama: Dramatic Structure & Characterization' },
    { id: 'lit-4', name: 'African Prose: Narrative Voice & Cultural Themes' },
    { id: 'lit-5', name: 'Poetic Analysis: Stanzaic Forms, Rhythm & Rhyme' },
    { id: 'lit-6', name: 'Non-African Poetry: Modernist & Romantic Selected Texts' },
  ],
  commerce: [
    { id: 'com-1', name: 'Home Trade: Wholesale, Retail & Distribution Channels' },
    { id: 'com-2', name: 'Foreign Trade: Export, Import & Balance of Payments' },
    { id: 'com-3', name: 'Banking & Financial Market Instruments' },
    { id: 'com-4', name: 'Insurance Principles & Risk Management' },
    { id: 'com-5', name: 'Business Organizations: Sole Trader, Partnership, Companies' },
    { id: 'com-6', name: 'Consumer Protection & Government Regulatory Bodies (NAFDAC, CPC)' },
  ],
  accounting: [
    { id: 'acc-1', name: 'Principles of Double Entry & Books of Prime Entry' },
    { id: 'acc-2', name: 'Bank Reconciliation Statements & Adjusted Cash Book' },
    { id: 'acc-3', name: 'Correction of Errors & Suspense Account' },
    { id: 'acc-4', name: 'Final Accounts: Sole Proprietor & Adjustments' },
    { id: 'acc-5', name: 'Partnership Accounts: Goodwill, Revaluation, Admission' },
    { id: 'acc-6', name: 'Manufacturing Accounts: Prime Cost & Production Cost' },
  ],
  geography: [
    { id: 'geo-1', name: 'The Earth in the Solar System & Planetary Calculations' },
    { id: 'geo-2', name: 'Map Work: Contours, Gradient & Cross-Section Interpretation' },
    { id: 'geo-3', name: 'Physical Geography: Landforms, Vulcanicity & Weathering' },
    { id: 'geo-4', name: 'Climatology: Koppen Classification & Atmospheric Pressure' },
    { id: 'geo-5', name: 'Human Geography: Settlements, Urbanization & Migration' },
    { id: 'geo-6', name: 'Regional Geography of Nigeria: Agricultural & Mineral Belts' },
  ],
  agriculture: [
    { id: 'agr-1', name: 'Anatomy and Physiology of Farm Animals (Ruminant digestion)' },
    { id: 'agr-2', name: 'Soil Science: Soil Texture, Profile, pH & Fertility' },
    { id: 'agr-3', name: 'Agronomy: Crop Husbandry, Pest Control & Plant Pathology' },
    { id: 'agr-4', name: 'Farm Mechanization & Survey Equipment' },
    { id: 'agr-5', name: 'Livestock Management: Diseases, Vaccination & Biosecurity' },
    { id: 'agr-6', name: 'Agricultural Economics: Demand, Supply, Marketing & Farm Records' },
  ],
  civic_education: [
    { id: 'civ-1', name: 'Values: Honesty, Integrity, Self-Reliance & Patriotism' },
    { id: 'civ-2', name: 'Citizenship, Rights & Duties of the Citizen' },
    { id: 'civ-3', name: 'Democracy, Rule of Law & Electoral Process in Nigeria' },
    { id: 'civ-4', name: 'Human Rights, UDHR & International Humanitarian Law' },
    { id: 'civ-5', name: 'Cultism, Drug Abuse & Trafficking in Persons (NDLEA, NAPTIP)' },
    { id: 'civ-6', name: 'Public Service: Structure, Code of Conduct & Civil Service Reform' },
  ],
  crk: [
    { id: 'crk-1', name: 'Sovereignty of God: Creation, Fall & Divine Covenant with Abraham' },
    { id: 'crk-2', name: 'Leadership in Israel: Moses, Joshua, Deborah & The Monarchy' },
    { id: 'crk-3', name: 'True Religion & Social Justice: Amos, Hosea & Jeremiah' },
    { id: 'crk-4', name: 'The Gospels: Birth, Baptism, Temptation & Parables of Jesus' },
    { id: 'crk-5', name: 'The Passion, Death, Resurrection & Ascension of Jesus Christ' },
    { id: 'crk-6', name: 'The Early Church: Pentecost, Peter, Stephen & Pauline Epistles' },
  ],
  irk: [
    { id: 'irk-1', name: 'Tawhid: Attributes of Allah, Shirk & Articles of Faith' },
    { id: 'irk-2', name: 'The Holy Quran: Revelation, Preservation, Surahs & Tajweed' },
    { id: 'irk-3', name: 'Hadith: Classification (Sahih, Hasan, Da’if) & Selected Arba’un' },
    { id: 'irk-4', name: 'Fiqh: Taharah, Salat, Zakat, Sawm & Hajj Rites' },
    { id: 'irk-5', name: 'Sirah: Life of Prophet Muhammad (SAW) in Makkah & Madinah' },
    { id: 'irk-6', name: 'The Rightly Guided Caliphs (Khulafa ar-Rashidun) & Shura' },
  ],
  history: [
    { id: 'his-1', name: 'Pre-Colonial Kingdoms: Kanem-Borno, Oyo, Benin & Hausa States' },
    { id: 'his-2', name: 'Trans-Saharan & Trans-Atlantic Trade Networks' },
    { id: 'his-3', name: 'British Colonization & The 1914 Amalgamation of Nigeria' },
    { id: 'his-4', name: 'The System of Indirect Rule in Northern & Southern Nigeria' },
    { id: 'his-5', name: 'Nationalist Movements, Decolonization & Independence (1960)' },
    { id: 'his-6', name: 'Post-Independence Crises, Military Rule & The Fourth Republic' },
  ],
  further_mathematics: [
    { id: 'fm-1', name: 'Pure Mathematics: Partial Fractions & Binomial Expansions' },
    { id: 'fm-2', name: 'Vectors in 3D & Vector Equations of Lines and Planes' },
    { id: 'fm-3', name: 'Coordinate Geometry of the Conic Sections (Parabola, Ellipse)' },
    { id: 'fm-4', name: 'Advanced Differential & Integral Calculus (Integration by Parts)' },
    { id: 'fm-5', name: 'Mechanics: Coplanar Forces, Equilibrium, Moments & Projectiles' },
    { id: 'fm-6', name: 'Probability Distributions (Binomial, Poisson, Normal) & Variance' },
  ],
};

export default function SyllabusTrackerPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [activeSubject, setActiveSubject] = useState<string>('english');
  const [topicStats, setTopicStats] = useState<TopicStatRecord[]>([]);

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
  }, []);

  const daysToExam = useMemo(() => {
    const examSeason = new Date('2026-04-18T08:00:00Z');
    const diffTime = examSeason.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, []);

  const enrichedSyllabus = useMemo(() => {
    const result: Record<string, SubjectSyllabus> = {};
    let totalAllTopics = 0;
    let masteredAllTopics = 0;
    let inProgressAllTopics = 0;
    let deficitAllTopics = 0;

    Object.entries(BASE_CURRICULUM).forEach(([subjKey, topicsList]) => {
      let subjectMastered = 0;

      const enrichedTopics: SubTopic[] = topicsList.map((t) => {
        totalAllTopics++;
        const stat = topicStats.find(
          (s) =>
            (s.subject || '').toLowerCase() === subjKey.toLowerCase() &&
            (s.topic || '').toLowerCase() === t.name.toLowerCase()
        );
        if (stat && stat.total > 0) {
          const acc = Math.round(Number(stat.accuracy || 0));
          const status: 'mastered' | 'in_progress' | 'deficit' =
            acc >= 75 ? 'mastered' : acc < 50 ? 'deficit' : 'in_progress';
          if (status === 'mastered') {
            subjectMastered++;
            masteredAllTopics++;
          } else if (status === 'in_progress') {
            inProgressAllTopics++;
          } else {
            deficitAllTopics++;
          }
          return {
            id: t.id,
            name: t.name,
            status,
            accuracy: acc,
            drillsCompleted: stat.total,
          };
        }
        return {
          id: t.id,
          name: t.name,
          status: 'unattempted',
          accuracy: 0,
          drillsCompleted: 0,
        };
      });

      const masteryPercent =
        topicsList.length > 0 ? Math.round((subjectMastered / topicsList.length) * 100) : 0;

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
  }, [topicStats]);

  const currentSyllabus = enrichedSyllabus.syllabusData[activeSubject] || enrichedSyllabus.syllabusData['english'];
  const allSubjectKeys = Object.keys(enrichedSyllabus.syllabusData);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-body selection:bg-accent-royal-blue selection:text-white antialiased">
      {/* Ecosystem Top Bar */}
      <AppNavbar student={student} titleBadge="Official Syllabus" />

      {/* Main Canvas Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6 flex-1">
        {/* Bento Header */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-royal-blue/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-accent-royal-blue/20 text-secondary border border-secondary/30">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Official JAMB e-Syllabus Sync 2025/2026
                </span>
                <span className="text-text-muted text-xs font-mono-data">• 17 Accredited Subjects</span>
              </div>
              <h1 className="text-headline-lg font-headline-lg text-text-primary tracking-tight">
                JAMB UTME 2025/2026 Official Syllabus Tracker & Study Timetable
              </h1>
              <p className="text-text-secondary text-body-md font-body-md mt-2">
                Track your topic mastery across all official sub-skills, isolate specific deficit areas, and launch targeted diagnostic drills directly.
              </p>
            </div>

            {/* Target Exam Date Countdown Badge */}
            <div className="bg-surface-container-low border border-border rounded-2xl p-4 flex items-center gap-4 min-w-[260px] shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-surface-container border border-accent-streak-rose/30 flex items-center justify-center text-accent-streak-rose">
                <span className="material-symbols-outlined text-[26px]">alarm</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-streak-rose font-mono-timer text-[22px] tracking-tight font-bold">
                    {daysToExam > 0 ? `${daysToExam} Days` : 'Exam Active'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-accent-streak-rose animate-ping" />
                </div>
                <p className="text-text-secondary text-label-sm font-label-sm">to Official UTME Examination Window</p>
                <p className="text-[11px] font-mono-data text-text-muted">Target Score: {student?.targetScore || '320+'} Agg.</p>
              </div>
            </div>
          </div>

          {/* Telemetry Progress Overview Bar */}
          <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-low border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-label-sm font-label-sm">
                <span className="text-text-secondary">Global Syllabus Mastery</span>
                <span className="text-tertiary font-mono-data font-bold">{enrichedSyllabus.globalMasteryPercent}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-tertiary h-full rounded-full transition-all duration-500"
                  style={{ width: `${enrichedSyllabus.globalMasteryPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono-data">
                {enrichedSyllabus.masteredAllTopics} of {enrichedSyllabus.totalAllTopics} Sub-topics Mastered
              </span>
            </div>

            <div className="bg-surface-container-low border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-label-sm font-label-sm">
                <span className="text-text-secondary">Active In-Progress</span>
                <span className="text-secondary font-mono-data font-bold">
                  {enrichedSyllabus.inProgressAllTopics} {enrichedSyllabus.inProgressAllTopics === 1 ? 'Topic' : 'Topics'}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      enrichedSyllabus.totalAllTopics > 0
                        ? Math.min(100, Math.round((enrichedSyllabus.inProgressAllTopics / enrichedSyllabus.totalAllTopics) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono-data">
                {enrichedSyllabus.inProgressAllTopics > 0
                  ? `${enrichedSyllabus.inProgressAllTopics} syllabus areas actively drilled`
                  : 'Complete drills to track in-progress areas'}
              </span>
            </div>

            <div className="bg-surface-container-low border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-label-sm font-label-sm">
                <span className="text-text-secondary">Critical Deficits</span>
                <span className="text-accent-streak-rose font-mono-data font-bold">
                  {enrichedSyllabus.deficitAllTopics} Weak
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-accent-streak-rose h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      enrichedSyllabus.totalAllTopics > 0
                        ? Math.min(100, Math.round((enrichedSyllabus.deficitAllTopics / enrichedSyllabus.totalAllTopics) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono-data">
                {enrichedSyllabus.deficitAllTopics > 0
                  ? 'Accuracy < 50% · Needs immediate drill repair'
                  : 'No critical deficits detected'}
              </span>
            </div>

            <div className="bg-surface-container-low border border-border rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-label-sm font-label-sm">
                <span className="text-text-secondary">Curriculum Coverage</span>
                <span className="text-warning-amber font-mono-data font-bold">
                  {enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics} / {enrichedSyllabus.totalAllTopics}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-warning-amber h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      enrichedSyllabus.totalAllTopics > 0
                        ? Math.min(100, Math.round(((enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics) / enrichedSyllabus.totalAllTopics) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-text-muted mt-2 font-mono-data">
                {enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics > 0
                  ? `${enrichedSyllabus.masteredAllTopics + enrichedSyllabus.inProgressAllTopics + enrichedSyllabus.deficitAllTopics} sub-topics tested in practice arena`
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
                  <span className="material-symbols-outlined text-secondary">account_tree</span>
                  <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    17-Subject Syllabus Curriculum Matrix
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-data px-2.5 py-1 rounded bg-surface-container text-text-secondary border border-border">
                    Subject: {getSubjectLabel(activeSubject)}
                  </span>
                </div>
              </div>

              {/* Subject Tabs (Scrollable pill carousel for all 17 subjects) */}
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
                          ? 'border-accent-royal-blue bg-accent-royal-blue/15 text-primary shadow-sm ring-1 ring-primary/30'
                          : 'border-border bg-surface-container-low hover:border-border-hover text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-text-primary whitespace-nowrap">
                          {getSubjectLabel(sub)}
                        </span>
                        {sub === 'english' && (
                          <span className="text-[9px] font-mono-data px-1 py-0.2 rounded bg-accent-royal-blue/20 text-secondary">
                            Compulsory
                          </span>
                        )}
                        <span className="text-xs font-mono-data font-bold text-tertiary">
                          {data?.masteryPercent ?? 0}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sub-Topics Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-label-sm font-label-sm text-text-muted px-1">
                  <span>Accredited Curriculum Sub-Skill ({getSubjectLabel(activeSubject)})</span>
                  <span>Accuracy &amp; Diagnostic Action</span>
                </div>

                {currentSyllabus.topics.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-hover transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.status === 'mastered'
                              ? 'bg-tertiary'
                              : t.status === 'deficit'
                              ? 'bg-accent-streak-rose'
                              : t.status === 'in_progress'
                              ? 'bg-secondary'
                              : 'bg-text-muted/40'
                          }`}
                        />
                        <span className="font-bold text-body-sm text-text-primary">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted font-mono-data pl-4">
                        <span>{t.drillsCompleted > 0 ? `${t.drillsCompleted} Drills Practiced` : 'No drills attempted'}</span>
                        <span>•</span>
                        <span
                          className={
                            t.status === 'mastered'
                              ? 'text-tertiary'
                              : t.status === 'deficit'
                              ? 'text-accent-streak-rose'
                              : t.status === 'in_progress'
                              ? 'text-secondary'
                              : 'text-text-muted'
                          }
                        >
                          {t.status === 'mastered'
                            ? 'Mastered (75%+)'
                            : t.status === 'deficit'
                            ? 'Critical Deficit (<50%)'
                            : t.status === 'in_progress'
                            ? 'In Progress (50-74%)'
                            : 'Not Started'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-mono-data text-body-sm font-bold text-text-primary">
                        {t.accuracy > 0 ? `${t.accuracy}%` : '—'}
                      </span>
                      <button
                        onClick={() => navigate(`/questions?subject=${activeSubject}`)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-variant text-primary text-label-sm font-semibold transition-all active:scale-[0.98]"
                      >
                        Launch Drill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Study Timetable */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-ai-gold">calendar_month</span>
                <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                  Weekly High-Yield Timetable
                </h3>
              </div>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                Algorithmic study schedule designed to repair critical deficits before national test kickoff.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { day: 'Mon', sub: 'Use of English', focus: 'Oral Forms & Stress Patterns', time: '17:00 - 18:30' },
                  { day: 'Tue', sub: 'Mathematics / Technical', focus: 'Calculus Differentiation & Algebra', time: '17:00 - 18:30' },
                  { day: 'Wed', sub: 'Physics / Commercial', focus: 'Electromagnetism / Banking Trade', time: '18:00 - 19:30' },
                  { day: 'Thu', sub: 'Chemistry / Arts', focus: 'Organic Chemistry / Constitutional Law', time: '17:00 - 18:30' },
                  { day: 'Sat', sub: 'Full Mock Sitting', focus: '180Q Standard JAMB Simulation', time: '10:00 - 12:00' },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-surface-container-low border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {slot.day}
                        </span>
                        <span className="font-semibold text-text-primary">{slot.sub}</span>
                      </div>
                      <p className="text-text-muted mt-1">{slot.focus}</p>
                    </div>
                    <span className="font-mono-data text-text-secondary text-[11px]">{slot.time}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/mock-setup')}
                className="w-full py-3 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md font-bold text-sm shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                <span>Launch Weekend 180Q Mock</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-text-muted border-t border-border mt-10">
        Aurikrex Exam Arena · © 2025/2026 Aurikrex. JAMB UTME Curriculum Tracking Engine.
      </footer>
    </div>
  );
}
