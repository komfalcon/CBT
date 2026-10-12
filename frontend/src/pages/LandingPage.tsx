import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlignLeft, ArrowRight, Award, BarChart3, BookOpen, Brain, BriefcaseBusiness, Calculator,
  Check, ChevronDown, Clock, CreditCard, Dna, FlaskConical, Globe, Handshake,
  Instagram, Landmark, Layers, Linkedin, Mail, Map, Menu, MessageSquare, Monitor,
  NotebookTabs, Phone, Play, Plus, ScrollText, Shield, Sparkles, Sprout, Star,
  Target, TrendingUp, Twitter, UserCheck, Users, X, Youtube, Zap,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { AurikrexAppsSwitcher } from '../components/AurikrexAppsSwitcher';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1600;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const ALL_17_SUBJECTS = [
  { name: 'Use of English', topics: 'Comprehension, Lexis, Structure, Oral Forms', icon: 'record_voice_over', compulsory: true, tag: 'Mandatory · 60 Qs' },
  { name: 'Mathematics', topics: 'Algebra, Calculus, Statistics, Geometry', icon: 'calculate', tag: 'Elective · 40 Qs' },
  { name: 'Physics', topics: 'Mechanics, Waves, Optics, Electromagnetism', icon: 'bolt', tag: 'Elective · 40 Qs' },
  { name: 'Chemistry', topics: 'Organic, Inorganic, Physical, Stoichiometry', icon: 'science', tag: 'Elective · 40 Qs' },
  { name: 'Biology', topics: 'Anatomy, Ecology, Genetics, Physiology', icon: 'eco', tag: 'Elective · 40 Qs' },
  { name: 'Economics', topics: 'Micro, Macro, Public Finance, Development', icon: 'trending_up', tag: 'Elective · 40 Qs' },
  { name: 'Government', topics: 'Constitutional History, Political Thought, Institutions', icon: 'account_balance', tag: 'Elective · 40 Qs' },
  { name: 'Literature in English', topics: 'Drama, African Prose, Poetic Devices', icon: 'auto_stories', tag: 'Elective · 40 Qs' },
  { name: 'Geography', topics: 'Physical Geography, Map Reading, Climatology', icon: 'public', tag: 'Elective · 40 Qs' },
  { name: 'Commerce', topics: 'Trade, Banking, Capital Market, Insurance', icon: 'payments', tag: 'Elective · 40 Qs' },
  { name: 'Principles of Accounts', topics: 'Bookkeeping, Trial Balance, Company Accounts', icon: 'receipt_long', tag: 'Elective · 40 Qs' },
  { name: 'Agricultural Science', topics: 'Agronomy, Animal Science, Soil Science, Forestry', icon: 'agriculture', tag: 'Elective · 40 Qs' },
  { name: 'Civic Education', topics: 'Human Rights, Democratic Governance, Citizenship', icon: 'how_to_vote', tag: 'Elective · 40 Qs' },
  { name: 'Christian Religious Knowledge', topics: 'Old Testament Themes, Epistles, Gospels', icon: 'church', tag: 'Elective · 40 Qs' },
  { name: 'Islamic Religious Knowledge', topics: 'Quranic Exegesis, Hadith, Fiqh, Islamic History', icon: 'mosque', tag: 'Elective · 40 Qs' },
  { name: 'History', topics: 'Pre-Colonial Kingdoms, 1914 Amalgamation, Modern Nigeria', icon: 'history_edu', tag: 'Elective · 40 Qs' },
  { name: 'Further Mathematics', topics: 'Pure Maths, Coordinate Geometry, Mechanics, Vectors', icon: 'functions', tag: 'Elective · 40 Qs' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useInView(0.1);
  const featuresRef = useInView();
  const subjectsRef = useInView();
  const pricingRef = useInView();
  const statsRef = useInView();
  const howItWorksRef = useInView();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cbtKeyModalOpen, setCbtKeyModalOpen] = useState(false);
  const [cbtKeyInput, setCbtKeyInput] = useState('');
  const [falkeDrawerOpen, setFalkeDrawerOpen] = useState(true);
  const [falkeLanguage, setFalkeLanguage] = useState<'english' | 'pidgin'>('english');
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [activeSubjectTab, setActiveSubjectTab] = useState('english');
  const [secondsRemaining, setSecondsRemaining] = useState(108 * 60 + 22); // 01:48:22
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('token')) : null;
    setIsLoggedIn(!!token);
  }, []);

  // Live countdown timer in hero console preview
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCbtKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cbtKeyInput.trim()) {
      setCbtKeyModalOpen(false);
      navigate(`/auth?mode=cbt_key&key=${encodeURIComponent(cbtKeyInput.trim())}`);
    }
  };

  return (
    <div className="landing-page landing-shell min-h-screen w-full max-w-full overflow-x-hidden bg-bg-primary font-body-md text-text-primary antialiased selection:bg-accent-royal-blue selection:text-white">
      {/* ========================================================================= */}
      {/* 1. PUBLIC BETA ANNOUNCEMENT BANNER */}
      {/* ========================================================================= */}
      <div className="w-full bg-surface-container-low/90 border-b border-border-dark py-1.5 px-4 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs text-text-secondary-dark gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary-container/30 text-tertiary border border-tertiary/40">
              Public Beta
            </span>
            <span className="text-text-primary-dark font-medium">100% Free Full Access for Every UTME Candidate.</span>
            <span className="text-text-muted-dark hidden lg:inline">— All 180Q full mocks, topic drills, and Falke AI tutor unlocked.</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-text-muted-dark">
            <span className="flex items-center gap-1.5 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              2025/2026 JAMB Portal Synced
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-bg-secondary-dark/95 border-b border-border-dark shadow-sm backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-[1440px] mx-auto h-16">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-border-dark group-hover:ring-accent-royal-blue/60 transition-all flex items-center justify-center bg-surface-container shrink-0">
                <img
                  src="/favicon.svg"
                  alt="Aurikrex Exam Arena Circular Emblem"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-headline-sm font-headline-sm font-bold text-text-primary-dark tracking-tight">Aurikrex Exam Arena</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/40">BETA</span>
                </div>
                <span className="text-[11px] text-text-muted-dark font-mono-data leading-tight">by Aurikrex</span>
              </div>
            </Link>
          </div>

          {/* Clean Marketing Navigation Links (Scroll Anchors) */}
          <nav className="hidden lg:flex items-center gap-8 text-label-md font-label-md text-text-secondary-dark">
            <a href="#features" className="hover:text-text-primary-dark transition-colors duration-150">Features</a>
            <a href="#subjects" className="hover:text-text-primary-dark transition-colors duration-150">17 Subjects</a>
            <a href="#pricing" className="hover:text-text-primary-dark transition-colors duration-150">Free Beta</a>
            <Link to="/auth?mode=cbt_key" className="hover:text-text-primary-dark transition-colors duration-150 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-accent-ai-gold">vpn_key</span>
              <span>CBT Key</span>
            </Link>
          </nav>

          {/* Trailing Action Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle className="min-h-9 min-w-9" />

            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-variant text-text-primary-dark border border-border-dark text-label-md font-label-md font-semibold transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/auth?mode=login"
                  className="hidden sm:inline-flex px-3.5 py-2 text-label-md font-label-md font-medium text-text-secondary-dark hover:text-text-primary-dark transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/mock-setup"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-royal-blue hover:bg-primary-container text-white text-label-md font-label-md font-semibold shadow-md active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  <span>Start Free Mock</span>
                </Link>
              </>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              className="lg:hidden p-2 rounded-lg text-text-secondary-dark hover:text-text-primary hover:bg-surface-container"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border-dark bg-bg-secondary-dark px-4 py-4 space-y-3">
            <nav className="grid gap-2 text-label-md font-label-md">
              <a href="#features" className="p-2 rounded-lg hover:bg-surface-container text-text-secondary-dark" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#subjects" className="p-2 rounded-lg hover:bg-surface-container text-text-secondary-dark" onClick={() => setMobileMenuOpen(false)}>17 JAMB Subjects</a>
              <a href="#pricing" className="p-2 rounded-lg hover:bg-surface-container text-text-secondary-dark" onClick={() => setMobileMenuOpen(false)}>Free Beta Pricing</a>
              <Link to="/auth?mode=cbt_key" className="p-2 rounded-lg hover:bg-surface-container text-text-secondary-dark flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="material-symbols-outlined text-accent-ai-gold text-[18px]">vpn_key</span>
                <span>CBT Key Access</span>
              </Link>
              {isLoggedIn ? (
                <Link to="/dashboard" className="p-2 rounded-lg bg-surface-container text-text-primary-dark font-semibold flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link to="/auth?mode=login" className="p-2 rounded-lg hover:bg-surface-container text-text-secondary-dark" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  <Link to="/mock-setup" className="mt-2 text-center py-2.5 rounded-lg bg-accent-royal-blue text-white font-semibold" onClick={() => setMobileMenuOpen(false)}>Start Free Mock</Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 px-4 md:px-8 max-w-[1440px] mx-auto hero-glow-radial overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-accent-royal-blue/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
          {/* Kicker Pill */}
          <div className="inline-flex max-w-full items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-surface-container border border-border-dark shadow-sm">
            <span className="material-symbols-outlined text-accent-streak-rose text-[16px] shrink-0">local_fire_department</span>
            <span className="text-xs sm:text-label-sm font-label-sm text-text-secondary-dark text-left truncate sm:overflow-visible">
              <strong className="text-text-primary-dark">Nigeria's UTME Platform</strong><span className="hidden xs:inline"> · Built to guarantee 300+</span>
            </span>
            <span className="material-symbols-outlined text-text-muted-dark text-[14px] shrink-0 hidden xs:inline">arrow_forward</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl xs:text-3xl sm:text-headline-xl font-headline-xl text-text-primary-dark tracking-tight max-w-3xl">
            Practice with Purpose. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
              Score 300+ with Confidence.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-body-lg font-body-lg text-text-secondary-dark max-w-2xl">
            The cyber-precise CBT simulation engine engineered strictly for Nigerian UTME candidates. 1:1 JAMB interface replication, algorithmic deficit triage, and instant AI explanations in English &amp; Nigerian Pidgin.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2 w-full sm:w-auto">
            <Link
              to="/mock-setup"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg shadow-accent-royal-blue/25 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">quiz</span>
              <span>Launch Full 4-Subject Mock (Free)</span>
            </Link>
            <Link
              to="/questions"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-surface-container hover:bg-surface-variant text-text-primary-dark border border-border-dark font-label-md text-label-md font-semibold active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-tertiary text-[20px]">flash_on</span>
              <span>Try 15m Deficit Drill</span>
            </Link>
          </div>

          {/* Trust Micro-Badges */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-label-sm font-label-sm text-text-muted-dark pt-1">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span> Zero credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">offline_bolt</span> Cyber-cafe offline resilience
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-accent-ai-gold text-[18px]">history_edu</span> Complete accredited past questions (1983–2024)
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. HERO INTERACTIVE CONSOLE PREVIEW (Live 1:1 JAMB CBT Replication) */}
        {/* ========================================================================= */}
        <div className="mt-12 rounded-2xl bg-bg-secondary-dark border border-border-dark shadow-2xl overflow-hidden ring-1 ring-border-dark" id="simulator-preview">
          {/* Cockpit Bar */}
          <div className="bg-surface-container-low px-4 py-3 border-b border-border-dark flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-streak-rose/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-warning-amber/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-tertiary/80 inline-block" />
              </div>
              <span className="text-mono-data font-mono-data text-xs text-text-muted-dark hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-label-sm font-label-sm text-text-primary-dark font-semibold">2025 UTME CBT SIMULATOR ENGINE</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-surface-container text-secondary border border-border-dark">EXAM ROOM AKX-702</span>
              </div>
            </div>

            {/* 120-minute Live Countdown timer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-bg-primary-dark border border-border-dark">
                <span className="material-symbols-outlined text-accent-streak-rose text-[18px]">timer</span>
                <span className="text-mono-timer font-mono-timer text-lg text-primary tracking-widest">{formatTimer(secondsRemaining)}</span>
                <span className="text-[10px] text-text-muted-dark font-mono-data uppercase">Remaining</span>
              </div>
              <Link
                to="/mock-setup"
                className="px-3 py-1 text-xs rounded bg-surface-container-high hover:bg-surface-variant text-text-secondary-dark hover:text-text-primary-dark border border-border-dark font-mono-data"
              >
                [S] Submit Exam
              </Link>
            </div>
          </div>

          {/* Subject Tabs (4 Registered JAMB Combination) */}
          <div className="bg-surface-container px-4 flex overflow-x-auto border-b border-border-dark custom-scroll">
            <button
              onClick={() => setActiveSubjectTab('english')}
              className={`flex items-center gap-2 px-4 py-3 text-label-md font-label-md font-semibold whitespace-nowrap transition-colors ${activeSubjectTab === 'english' ? 'text-text-primary-dark border-b-2 border-accent-royal-blue bg-surface-container-high' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
            >
              <span>Use of English</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-tertiary font-mono-data">48/60</span>
            </button>
            <button
              onClick={() => setActiveSubjectTab('maths')}
              className={`flex items-center gap-2 px-4 py-3 text-label-md font-label-md font-semibold whitespace-nowrap transition-colors ${activeSubjectTab === 'maths' ? 'text-text-primary-dark border-b-2 border-accent-royal-blue bg-surface-container-high' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
            >
              <span>Mathematics</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-text-muted-dark font-mono-data">29/40</span>
            </button>
            <button
              onClick={() => setActiveSubjectTab('physics')}
              className={`flex items-center gap-2 px-4 py-3 text-label-md font-label-md font-semibold whitespace-nowrap transition-colors ${activeSubjectTab === 'physics' ? 'text-text-primary-dark border-b-2 border-accent-royal-blue bg-surface-container-high' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
            >
              <span>Physics</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-text-muted-dark font-mono-data">34/40</span>
            </button>
            <button
              onClick={() => setActiveSubjectTab('chemistry')}
              className={`flex items-center gap-2 px-4 py-3 text-label-md font-label-md font-semibold whitespace-nowrap transition-colors ${activeSubjectTab === 'chemistry' ? 'text-text-primary-dark border-b-2 border-accent-royal-blue bg-surface-container-high' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
            >
              <span>Chemistry</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-text-muted-dark font-mono-data">18/40</span>
            </button>
          </div>

          {/* Console Body: 75% Question Canvas + 25% Palette & Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            {/* Left: Question & Options Canvas (Cols 1-9) */}
            <div className="lg:col-span-9 p-6 lg:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border-dark bg-bg-primary-dark">
              <div>
                {/* Question Metadata Strip */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-dark">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-surface-container text-primary text-xs font-mono-data font-semibold border border-border-dark">Question 14 of 60</span>
                    <span className="text-xs text-text-muted-dark font-mono-data">1 Mark · Lexis &amp; Structure</span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded border border-tertiary/30">
                      <span className="material-symbols-outlined text-[13px]">psychology</span> High Yield Deficit Area
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted-dark font-mono-data">
                    <span>Subject Index: ENG-014</span>
                  </div>
                </div>

                {/* Stem Prompt */}
                <div className="space-y-4">
                  <p className="text-text-secondary-dark text-sm italic font-body-sm">
                    In the following question, choose the option opposite in meaning to the word or phrase in bold.
                  </p>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-border-dark text-headline-sm font-headline-sm text-text-primary-dark">
                    The vice-chancellor’s address on financial austerity was greeted with <span className="text-primary underline decoration-accent-royal-blue decoration-2 font-bold">taciturn</span> disdain by the student union executives.
                  </div>
                </div>

                {/* Multiple Choice Option Cards (A, B, C, D) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-6">
                  {/* Option A */}
                  <label
                    onClick={() => setSelectedOption('A')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedOption === 'A' ? 'border-2 border-accent-royal-blue bg-accent-royal-blue/10 shadow-[0_0_16px_rgba(91,114,255,0.22)]' : 'border-border-dark bg-bg-card-dark hover:border-border-hover-dark'}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data text-xs font-bold shrink-0 ${selectedOption === 'A' ? 'bg-accent-royal-blue text-white' : 'bg-surface-container text-text-secondary-dark border border-border-dark'}`}>A</span>
                    <div className="flex flex-col">
                      <span className={`text-body-md font-body-md ${selectedOption === 'A' ? 'text-text-primary-dark font-semibold' : 'text-text-primary-dark'}`}>reticent</span>
                      <span className="text-[11px] font-mono-data text-text-muted-dark">[Key: A]</span>
                    </div>
                  </label>

                  {/* Option B */}
                  <label
                    onClick={() => setSelectedOption('B')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedOption === 'B' ? 'border-2 border-accent-royal-blue bg-accent-royal-blue/10 shadow-[0_0_16px_rgba(91,114,255,0.22)]' : 'border-border-dark bg-bg-card-dark hover:border-border-hover-dark'}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data text-xs font-bold shrink-0 ${selectedOption === 'B' ? 'bg-accent-royal-blue text-white' : 'bg-surface-container text-text-secondary-dark border border-border-dark'}`}>B</span>
                    <div className="flex flex-col">
                      <span className={`text-body-md font-body-md ${selectedOption === 'B' ? 'text-text-primary-dark font-semibold' : 'text-text-primary-dark'}`}>loquacious</span>
                      <span className="text-[11px] font-mono-data text-primary">[Key: B · Selected]</span>
                    </div>
                  </label>

                  {/* Option C */}
                  <label
                    onClick={() => setSelectedOption('C')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedOption === 'C' ? 'border-2 border-accent-royal-blue bg-accent-royal-blue/10 shadow-[0_0_16px_rgba(91,114,255,0.22)]' : 'border-border-dark bg-bg-card-dark hover:border-border-hover-dark'}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data text-xs font-bold shrink-0 ${selectedOption === 'C' ? 'bg-accent-royal-blue text-white' : 'bg-surface-container text-text-secondary-dark border border-border-dark'}`}>C</span>
                    <div className="flex flex-col">
                      <span className={`text-body-md font-body-md ${selectedOption === 'C' ? 'text-text-primary-dark font-semibold' : 'text-text-primary-dark'}`}>indolent</span>
                      <span className="text-[11px] font-mono-data text-text-muted-dark">[Key: C]</span>
                    </div>
                  </label>

                  {/* Option D */}
                  <label
                    onClick={() => setSelectedOption('D')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedOption === 'D' ? 'border-2 border-accent-royal-blue bg-accent-royal-blue/10 shadow-[0_0_16px_rgba(91,114,255,0.22)]' : 'border-border-dark bg-bg-card-dark hover:border-border-hover-dark'}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data text-xs font-bold shrink-0 ${selectedOption === 'D' ? 'bg-accent-royal-blue text-white' : 'bg-surface-container text-text-secondary-dark border border-border-dark'}`}>D</span>
                    <div className="flex flex-col">
                      <span className={`text-body-md font-body-md ${selectedOption === 'D' ? 'text-text-primary-dark font-semibold' : 'text-text-primary-dark'}`}>reclusive</span>
                      <span className="text-[11px] font-mono-data text-text-muted-dark">[Key: D]</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bottom Navigation Controls & Hotkeys */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-6 border-t border-border-dark">
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-variant text-text-secondary-dark hover:text-text-primary-dark border border-border-dark text-label-sm font-label-sm flex items-center gap-1.5 active:scale-[0.98] transition-all">
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>[P] Previous</span>
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-accent-royal-blue hover:bg-primary-container text-white text-label-sm font-label-sm font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-all">
                    <span>[N] Next Question</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>

                {/* Falke AI Drawer Trigger Button */}
                <button
                  onClick={() => setFalkeDrawerOpen(!falkeDrawerOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container border border-accent-ai-gold/40 text-accent-ai-gold hover:bg-accent-ai-gold/10 text-label-sm font-label-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                  <span className="font-semibold">{falkeDrawerOpen ? 'Hide Falke AI Explainer' : 'Ask Falke AI (Instant)'}</span>
                  <span className="text-[10px] font-mono-data bg-accent-ai-gold/20 text-accent-ai-gold px-1.5 py-0.5 rounded">0 Coins Hit</span>
                </button>
              </div>
            </div>

            {/* Right: 4-Column Palette Grid & Live Readiness Telemetry (Cols 10-12) */}
            <div className="lg:col-span-3 p-5 bg-bg-secondary-dark flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-dark">
                  <span className="text-label-sm font-label-sm text-text-primary-dark font-semibold">Question Palette</span>
                  <span className="text-xs font-mono-data text-tertiary">48/60 Done</span>
                </div>

                {/* Mini Legend */}
                <div className="flex items-center justify-between py-2 text-[11px] font-mono-data text-text-muted-dark">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-tertiary" /> Ans</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-accent-royal-blue" /> Current</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-surface-container border border-border-dark" /> Left</span>
                </div>

                {/* 4-Column Matrix Grid (Sample 20 of 60 nodes) */}
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
                    <button key={num} className="h-8 rounded bg-tertiary/20 text-tertiary border border-tertiary/40 font-mono-data text-xs font-semibold">
                      {num}
                    </button>
                  ))}
                  {/* Active Node 14 */}
                  <button className="h-8 rounded bg-accent-royal-blue text-white ring-2 ring-primary font-mono-data text-xs font-bold">
                    14
                  </button>
                  {[15, 16, 17, 18, 19, 20].map((num) => (
                    <button key={num} className="h-8 rounded bg-surface-container text-text-secondary-dark border border-border-dark font-mono-data text-xs hover:border-primary/40">
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Deficit Triage Diagnostic Mini Widget */}
              <div className="mt-6 pt-4 border-t border-border-dark bg-surface-container-low p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono-data mb-2">
                  <span className="text-text-muted-dark">Readiness Velocity Target</span>
                  <span className="text-tertiary font-bold">320+ Target Index</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent-royal-blue to-tertiary w-[80%]" />
                </div>
                <p className="text-[11px] text-text-muted-dark pt-2 leading-relaxed">
                  Calibrated Target: <strong className="text-text-primary-dark">Competitive Merit Faculty</strong> cut-off safe zone.
                </p>
              </div>
            </div>
          </div>

          {/* Live Falke AI Drawer Preview Mock (Toggleable) */}
          {falkeDrawerOpen && (
            <div className="border-t border-border-dark bg-surface-container-high p-5 transition-all">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-dark">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-ai-gold text-[20px]">psychology</span>
                  <span className="text-label-md font-label-md text-text-primary-dark font-semibold">Falke AI Explanation · Topic Breakdown</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary font-mono-data">Instant Cache Hit (0 Coins)</span>
                </div>
                {/* Language Mode Toggle */}
                <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-border-dark text-xs">
                  <button
                    onClick={() => setFalkeLanguage('english')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${falkeLanguage === 'english' ? 'bg-accent-royal-blue text-white' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
                  >
                    Standard Academic English
                  </button>
                  <button
                    onClick={() => setFalkeLanguage('pidgin')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${falkeLanguage === 'pidgin' ? 'bg-accent-royal-blue text-white' : 'text-text-secondary-dark hover:text-text-primary-dark'}`}
                  >
                    Nigerian Pidgin
                  </button>
                </div>
              </div>

              <div className="text-body-sm font-body-sm text-text-secondary-dark space-y-2">
                {falkeLanguage === 'english' ? (
                  <p>
                    <strong className="text-primary">Why (B) "loquacious" is the correct antonym:</strong> The word <em>taciturn</em> describes someone who is habitually reserved, quiet, or uncommunicative in speech. Its direct opposite is <em>loquacious</em>, meaning extremely talkative, garrulous, or expansive with words.
                  </p>
                ) : (
                  <p>
                    <strong className="text-primary">Why (B) "loquacious" na the correct answer:</strong> Person wey be <em>taciturn</em> na quiet person wey no dey like talk at all. The direct opposite na person wey dey talk plenty, mouth no dey stay one place — that na <em>loquacious</em>!
                  </p>
                )}
                <div className="p-2.5 rounded-lg bg-surface-container border border-border-dark text-xs font-mono-data text-accent-ai-gold flex items-center justify-between">
                  <span>Falke Memory Trace: Lexis Antonyms past JAMB patterns (1998, 2004, 2017).</span>
                  <span className="text-text-muted-dark">Inference time: 4ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. QUANTOMETRICS & PROVEN RECORD TICKER */}
      {/* ========================================================================= */}
      <section className="border-y border-border-dark bg-bg-secondary-dark/60 py-10 px-4 md:px-8">
        <div ref={statsRef.ref} className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col p-5 rounded-2xl bg-bg-card-dark border border-border-dark hover:border-border-hover-dark transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-mono-timer font-mono-timer text-2xl lg:text-3xl text-primary font-bold">
                <AnimatedCounter target={1000000} suffix="+" />
              </span>
              <span className="material-symbols-outlined text-primary text-[24px]">dataset</span>
            </div>
            <span className="text-label-md font-label-md text-text-primary-dark font-semibold">Verified Questions</span>
            <span className="text-body-sm font-body-sm text-text-muted-dark mt-1">Authentic 1983–2024 JAMB test stems mapped to the 2025 syllabus.</span>
          </div>

          <div className="flex flex-col p-5 rounded-2xl bg-bg-card-dark border border-border-dark hover:border-border-hover-dark transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-mono-timer font-mono-timer text-2xl lg:text-3xl text-tertiary font-bold">17 Subjects</span>
              <span className="material-symbols-outlined text-tertiary text-[24px]">verified_user</span>
            </div>
            <span className="text-label-md font-label-md text-text-primary-dark font-semibold">Full UTME Accreditation</span>
            <span className="text-body-sm font-body-sm text-text-muted-dark mt-1">Science, Commercial &amp; Arts combinations with accurate formula support.</span>
          </div>

          <div className="flex flex-col p-5 rounded-2xl bg-bg-card-dark border border-border-dark hover:border-border-hover-dark transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-mono-timer font-mono-timer text-2xl lg:text-3xl text-accent-ai-gold font-bold">0ms Latency</span>
              <span className="material-symbols-outlined text-accent-ai-gold text-[24px]">bolt</span>
            </div>
            <span className="text-label-md font-label-md text-text-primary-dark font-semibold">Instant Falke AI Cache</span>
            <span className="text-body-sm font-body-sm text-text-muted-dark mt-1">Zero-wait step-by-step explanations cost 0 coins for all indexed queries.</span>
          </div>

          <div className="flex flex-col p-5 rounded-2xl bg-bg-card-dark border border-border-dark hover:border-border-hover-dark transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-mono-timer font-mono-timer text-2xl lg:text-3xl text-secondary font-bold">382 / 400</span>
              <span className="material-symbols-outlined text-secondary text-[24px]">military_tech</span>
            </div>
            <span className="text-label-md font-label-md text-text-primary-dark font-semibold">Top Scholar Benchmark</span>
            <span className="text-body-sm font-body-sm text-text-muted-dark mt-1">Candidates training with Aurikrex average a +68 point score enhancement.</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CORE PLATFORM CAPABILITIES (BENTO GRID PATTERN) */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto" id="features">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider font-semibold">Architecture &amp; Engineering</span>
          <h2 className="text-headline-lg font-headline-lg text-text-primary-dark">Engineered to Eliminate UTME Exam Day Anxiety</h2>
          <p className="text-body-md font-body-md text-text-secondary-dark">
            High scores don't happen by accident. We built the exact high-stress ergonomics, key bindings, and algorithmic triage needed to reach 300+.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
          {/* Card 1: 1:1 CBT Simulator (Span 7) */}
          <div className="lg:col-span-7 rounded-2xl bg-bg-card-dark border border-border-dark p-7 flex flex-col justify-between hover:border-border-hover-dark transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-accent-royal-blue/20 text-primary flex items-center justify-center border border-accent-royal-blue/30">
                  <span className="material-symbols-outlined text-[22px]">keyboard</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-xs font-mono-data text-primary">Exact JAMB Key Bindings</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary-dark mb-2">1:1 Official 120-Minute Exam Replica</h3>
              <p className="text-body-md font-body-md text-text-secondary-dark mb-6">
                Cyber-cafes often fail candidates with erratic interfaces. Aurikrex maps the authentic Joint Admissions Matriculation Board 8-key system. Train your muscle memory on raw keys:
                {' '}<code className="text-mono-data font-mono-data text-primary bg-surface-container px-1.5 py-0.5 rounded">[A]</code>,
                {' '}<code className="text-mono-data font-mono-data text-primary bg-surface-container px-1.5 py-0.5 rounded">[B]</code>,
                {' '}<code className="text-mono-data font-mono-data text-primary bg-surface-container px-1.5 py-0.5 rounded">[C]</code>,
                {' '}<code className="text-mono-data font-mono-data text-primary bg-surface-container px-1.5 py-0.5 rounded">[D]</code>,
                {' '}<code className="text-mono-data font-mono-data text-primary bg-surface-container px-1.5 py-0.5 rounded">[P] Rev</code>,
                {' '}<code className="text-mono-data font-mono-data text-primary bg-surface-container px-1.5 py-0.5 rounded">[N] Next</code>,
                {' '}<code className="text-mono-data font-mono-data text-accent-streak-rose bg-surface-container px-1.5 py-0.5 rounded">[S] Submit</code>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-border-dark flex items-center justify-between text-xs font-mono-data text-text-muted-dark">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary" /> 180 Questions Mandatory Timer Lockdown
              </span>
              <span className="text-text-primary-dark">Instant Score Generation on 00:00:00</span>
            </div>
          </div>

          {/* Card 2: 300+ Readiness Dial & Deficit Triage (Span 5) */}
          <div className="lg:col-span-5 rounded-2xl bg-bg-card-dark border border-border-dark p-7 flex flex-col justify-between hover:border-border-hover-dark transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center border border-tertiary/40">
                  <span className="material-symbols-outlined text-[22px]">analytics</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-xs font-mono-data text-tertiary">Probability Modeling</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary-dark mb-2">Algorithmic Deficit Triage</h3>
              <p className="text-body-md font-body-md text-text-secondary-dark mb-6">
                Stop practicing questions you already know. The engine flags persistent concept blindspots across mechanics, organic chemistry, or lexis and forces high-yield reps until mastery is locked.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-border-dark space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-label-sm font-label-sm text-text-secondary-dark">UNILAG Medicine &amp; Surgery</span>
                <span className="text-xs font-mono-data text-tertiary font-bold">89% Admission Index</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full w-[89%]" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted-dark font-mono-data">
                <span>Cut-Off: 315</span>
                <span>Current Velocity: 328</span>
              </div>
            </div>
          </div>

          {/* Card 3: Falke AI Dual-Dialect Engine (Span 4) */}
          <div className="lg:col-span-4 rounded-2xl bg-bg-card-dark border border-border-dark p-7 flex flex-col justify-between hover:border-border-hover-dark transition-all">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-accent-ai-gold/20 text-accent-ai-gold flex items-center justify-center border border-accent-ai-gold/30">
                  <span className="material-symbols-outlined text-[22px]">translate</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-xs font-mono-data text-accent-ai-gold">Pidgin &amp; English</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary-dark mb-2">Falke AI Dual-Dialect Tutor</h3>
              <p className="text-body-md font-body-md text-text-secondary-dark mb-4">
                Complex calculus or Shakespearean literature questions decoded in plain Queen's English or authentic Nigerian Pidgin ("Make we break this friction formula down sharp sharp").
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container border border-border-dark text-xs space-y-2">
              <div className="flex items-center justify-between font-mono-data text-text-muted-dark">
                <span>Pidgin Sample:</span>
                <span className="text-accent-ai-gold font-semibold">Active</span>
              </div>
              <p className="text-text-primary-dark italic">
                "You see this Ohm's Law matter? Voltage na the force wey dey push current pass resistor. So if resistance double, current must drop!"
              </p>
            </div>
          </div>

          {/* Card 4: Cyber-Cafe & Lab CBT Key Authentication (Span 4) */}
          <div className="lg:col-span-4 rounded-2xl bg-bg-card-dark border border-border-dark p-7 flex flex-col justify-between hover:border-border-hover-dark transition-all" id="cafe-mode">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center border border-secondary/40">
                  <span className="material-symbols-outlined text-[22px]">pin</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-xs font-mono-data text-secondary">Passwordless Cafe Security</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary-dark mb-2">Disposable CBT Key Login</h3>
              <p className="text-body-md font-body-md text-text-secondary-dark mb-4">
                Never type your private password on infected cyber-cafe computers. Generate a single-use 6-character session key from your mobile phone to begin your mock instantly.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-surface-container-low rounded-xl border border-border-dark font-mono-data text-primary text-base font-bold tracking-widest">
              <span>CBT</span>
              <span>-</span>
              <span>7 4 8 2 9 1</span>
            </div>
          </div>

          {/* Card 5: Complete 17-Subject Curriculum Matrix (Span 4) */}
          <div className="lg:col-span-4 rounded-2xl bg-bg-card-dark border border-border-dark p-7 flex flex-col justify-between hover:border-border-hover-dark transition-all" id="syllabus">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-accent-streak-rose/20 text-accent-streak-rose flex items-center justify-center border border-accent-streak-rose/30">
                  <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-xs font-mono-data text-accent-streak-rose">Official 2025 Syllabus</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary-dark mb-2">17 Accredited Subjects</h3>
              <p className="text-body-md font-body-md text-text-secondary-dark mb-4">
                From the mandatory Use of English to Government, CRK, IRK, Economics, and Further Maths. No missing topics.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="px-2 py-1 rounded bg-surface-container text-text-secondary-dark border border-border-dark">English</span>
              <span className="px-2 py-1 rounded bg-surface-container text-text-secondary-dark border border-border-dark">Maths</span>
              <span className="px-2 py-1 rounded bg-surface-container text-text-secondary-dark border border-border-dark">Physics</span>
              <span className="px-2 py-1 rounded bg-surface-container text-text-secondary-dark border border-border-dark">Chemistry</span>
              <span className="px-2 py-1 rounded bg-surface-container text-text-secondary-dark border border-border-dark">Biology</span>
              <span className="px-2 py-1 rounded bg-surface-container text-text-secondary-dark border border-border-dark">Economics</span>
              <Link to="/syllabus" className="px-2 py-1 rounded bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/30 font-semibold hover:underline">+11 more</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. 17 ACCREDITED SUBJECTS SHOWCASE */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 md:px-8 border-t border-border-dark bg-bg-secondary-dark/40" id="subjects">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-label-sm font-label-sm text-tertiary uppercase tracking-wider font-semibold">Curriculum Coverage</span>
            <h2 className="text-headline-lg font-headline-lg text-text-primary-dark">All 17 JAMB UTME Accredited Subjects</h2>
            <p className="text-body-md font-body-md text-text-secondary-dark">
              Authentic past questions, KaTeX formula rendering, and syllabi from 1983 through 2024.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ALL_17_SUBJECTS.map((sub) => (
              <div
                key={sub.name}
                className={`p-4 rounded-xl border transition-all ${sub.compulsory ? 'bg-surface-container border-accent-royal-blue/40 shadow-sm' : 'bg-bg-card border-border hover:border-border-hover'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="material-symbols-outlined text-primary text-[22px]">{sub.icon}</span>
                  {sub.compulsory ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/30">{sub.tag}</span>
                  ) : (
                    <span className="text-mono-data font-mono-data text-xs text-text-muted">{sub.tag}</span>
                  )}
                </div>
                <h4 className="text-label-md font-label-md font-bold text-text-primary">{sub.name}</h4>
                <p className="text-body-sm font-body-sm text-text-secondary mt-1 text-xs line-clamp-2">{sub.topics}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HEAD-TO-HEAD COMPARISON (Old Past Books vs Aurikrex Arena) */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 md:px-8 border-y border-border-dark bg-surface-container-low/50">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-label-sm font-label-sm text-tertiary uppercase tracking-wider font-semibold">The Preparation Gap</span>
            <h2 className="text-headline-lg font-headline-lg text-text-primary-dark">Why Traditional Past Question Books Fail in 2025</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way: Paper Past Question Packs */}
            <div className="p-7 rounded-2xl bg-bg-card-dark border border-border-dark opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-error-container/30 text-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </span>
                <h3 className="text-headline-sm font-headline-sm text-text-secondary-dark">Old Paper Past Question Booklets</h3>
              </div>
              <ul className="space-y-4 text-body-sm font-body-sm text-text-muted-dark">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">cancel</span>
                  <span>Zero timer pressure; candidate loses track of the 40-seconds-per-question deadline.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">cancel</span>
                  <span>Rife with uncorrected typographical errors and outdated answer keys.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">cancel</span>
                  <span>No feedback on weak areas; you waste hours repeating questions you already mastered.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">cancel</span>
                  <span>No simulation of mouse clicks, cyber-cafe keyboard hotkeys, or auto-submit logic.</span>
                </li>
              </ul>
            </div>

            {/* The Aurikrex Way: Exam Arena */}
            <div className="p-7 rounded-2xl bg-surface-container border-2 border-accent-royal-blue shadow-xl relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-accent-royal-blue/20 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-tertiary-container/40 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-text-primary-dark">Aurikrex Exam Arena Cockpit</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono-data bg-tertiary/10 text-tertiary border border-tertiary/30">Target: 300+</span>
              </div>
              <ul className="space-y-4 text-body-sm font-body-sm text-text-primary-dark">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
                  <span><strong>1:1 Authentic JAMB Timer:</strong> Trains strict pacing with red alert triggers below 5 minutes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
                  <span><strong>Falke AI Tutor in English &amp; Pidgin:</strong> Instant conceptual clarity with zero delay.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
                  <span><strong>Deficit Triage Engine:</strong> Detects topic vulnerabilities in real-time and routes targeted drills.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
                  <span><strong>100% Free Public Beta:</strong> All full mocks, topic drills, and diagnostic modules fully unlocked.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PUBLIC BETA PRICING & GUARANTEE */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto" id="pricing">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
          <span className="text-label-sm font-label-sm text-warning-amber uppercase tracking-wider font-semibold">Public Beta Launch Pricing</span>
          <h2 className="text-headline-lg font-headline-lg text-text-primary-dark">100% Free Full Access for Every Candidate.</h2>
          <p className="text-body-md font-body-md text-text-secondary-dark">
            To celebrate our Public Beta launch, every feature is unlocked with zero charge. All students receive Max tier access with 5,000 complimentary AuriCoins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: 'Practice Drills', price: '₦0', note: 'Free during Public Beta', icon: 'flash_on', features: ['Custom topic & difficulty drills', 'Detailed answer explanations', 'Instant grading & score metrics', 'Full past question bank', 'Zero commitments'] },
            { name: 'UTME Mock Exams', price: '₦0', note: 'Free during Public Beta', icon: 'military_tech', popular: true, features: ['Unlimited full 4-subject mocks', 'Official JAMB 8-key timer & UI', 'Detailed performance analytics', 'Subject accuracy breakdown', 'Cyber-cafe CBT Key access'] },
            { name: 'Falke AI Smart Tutor', price: '₦0', note: 'Free during Public Beta', icon: 'smart_toy', features: ['5,000 free AuriCoins grant', '0 coins for indexed cached queries', 'English & Nigerian Pidgin tabs', 'Concept & formula clarifications', 'Continuous learning support'] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between rounded-2xl p-6 ${plan.popular ? 'border-2 border-accent-royal-blue bg-surface-container shadow-xl' : 'border border-border-dark bg-bg-card-dark'}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 whitespace-nowrap rounded-full bg-accent-royal-blue px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                  Full Beta Access
                </span>
              )}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-accent-royal-blue/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">{plan.icon}</span>
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-text-primary-dark">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-mono-timer font-mono-timer text-3xl font-bold text-text-primary-dark">{plan.price}</span>
                  <span className="text-xs text-tertiary font-semibold">/ free in beta</span>
                </div>
                <p className="text-xs text-text-muted-dark mb-6">{plan.note}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-body-sm font-body-sm text-text-secondary-dark">
                      <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/mock-setup"
                className={`w-full py-3 rounded-xl text-center text-label-md font-label-md font-semibold transition-all active:scale-[0.98] ${plan.popular ? 'bg-accent-royal-blue hover:bg-primary-container text-white shadow-md' : 'bg-surface-container hover:bg-surface-variant text-text-primary-dark border border-border-dark'}`}
              >
                Start Free with {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto text-center relative">
        <div className="max-w-3xl mx-auto space-y-6 p-10 rounded-3xl bg-gradient-to-b from-surface-container to-bg-card-dark border border-border-dark shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-royal-blue/20 text-primary border border-accent-royal-blue/30 text-label-sm font-label-sm">
            <span className="material-symbols-outlined text-[16px]">military_tech</span>
            <span>Join 100,000+ Active Scholars Across Nigeria</span>
          </div>
          <h2 className="text-headline-xl font-headline-xl text-text-primary-dark">
            Build the Confidence to Score 300+ in the 2025/2026 JAMB UTME.
          </h2>
          <p className="text-body-lg font-body-lg text-text-secondary-dark">
            No payment required. No credit cards. No cyber-cafe setup charges. Jump directly into the full 4-subject exam cockpit right now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/mock-setup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg shadow-accent-royal-blue/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              <span>Launch Free CBT Mock Session</span>
            </Link>
            <button
              onClick={() => setCbtKeyModalOpen(true)}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-surface-container-low hover:bg-surface-variant text-text-primary-dark border border-border-dark font-label-md text-label-md font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
              <span>Enter CBT Access Key</span>
            </button>
          </div>
          <p className="text-xs text-text-muted-dark font-mono-data pt-2">
            Instant compatibility with Chrome, Firefox, Safari, Edge &amp; Cyber-Cafe Android Terminals.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. CBT KEY MODAL POPUP */}
      {/* ========================================================================= */}
      {cbtKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary-dark/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-bg-card-dark border border-border-dark p-6 shadow-2xl relative">
            <button
              onClick={() => setCbtKeyModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted-dark hover:text-text-primary-dark"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-royal-blue/20 text-primary flex items-center justify-center border border-accent-royal-blue/30">
                <span className="material-symbols-outlined text-[22px]">vpn_key</span>
              </div>
              <div>
                <h4 className="text-headline-sm font-headline-sm text-text-primary-dark">Enter CBT Key</h4>
                <p className="text-xs text-text-muted-dark font-mono-data">Cyber-Cafe Passwordless Verification</p>
              </div>
            </div>
            <p className="text-body-sm font-body-sm text-text-secondary-dark mb-4">
              Enter your candidate session key generated on your phone or provided by your exam tutor.
            </p>
            <form onSubmit={handleCbtKeySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-data text-text-muted-dark mb-1">CBT KEY CODE</label>
                <input
                  type="text"
                  value={cbtKeyInput}
                  onChange={(e) => setCbtKeyInput(e.target.value)}
                  placeholder="CBT-XXXXXX"
                  className="w-full bg-surface-container-low border border-border-dark rounded-xl px-4 py-3 font-mono-data text-center text-lg tracking-widest text-primary focus:outline-none focus:border-accent-royal-blue uppercase"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-semibold transition-all"
              >
                Authorize Session &amp; Launch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. FOUNDER ATTRIBUTION & ECOSYSTEM FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-border-dark bg-bg-secondary-dark pt-16 pb-12 px-4 md:px-8 text-text-secondary-dark">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-border-dark">
          {/* Brand & Founder Bio (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-border-dark bg-surface-container flex items-center justify-center">
                <img src="/favicon.svg" alt="Aurikrex Circular Emblem" className="w-full h-full object-cover" />
              </div>
              <span className="text-headline-sm font-headline-sm font-bold text-text-primary-dark">Aurikrex Exam Arena</span>
            </div>
            <p className="text-body-sm font-body-sm text-text-muted-dark max-w-sm">
              Nigeria's cyber-precise UTME practice infrastructure. Designed to eliminate candidate score deficits through authentic CBT stress drills and localized AI tutoring.
            </p>
            <div className="pt-2">
              <p className="text-xs font-mono-data text-text-primary-dark font-medium">
                Founded by <span className="text-primary font-bold">Omotosho Korede Samuel</span>
              </p>
              <p className="text-[11px] text-text-muted-dark font-mono-data">
                Built for the Next Generation of Nigerian Scholars.
              </p>
            </div>
          </div>

          {/* Links Column 1: Ecosystem */}
          <div className="space-y-3 text-body-sm font-body-sm">
            <h4 className="text-label-md font-label-md text-text-primary-dark font-semibold">Aurikrex Ecosystem</h4>
            <ul className="space-y-2">
              <li><Link to="/mock-setup" className="hover:text-text-primary-dark transition-colors">Aurikrex CBT Arena</Link></li>
              <li><a href="https://library.aurikrex.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary-dark transition-colors">Aurikrex Library</a></li>
              <li><Link to="/falke-ai" className="hover:text-text-primary-dark transition-colors">Aurikrex Bytes &amp; AI</Link></li>
              <li><Link to="/profile" className="hover:text-text-primary-dark transition-colors">Candidate Vault</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Academics */}
          <div className="space-y-3 text-body-sm font-body-sm">
            <h4 className="text-label-md font-label-md text-text-primary-dark font-semibold">JAMB 2025 Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/syllabus" className="hover:text-text-primary-dark transition-colors">Official Syllabus Tracker</Link></li>
              <li><Link to="/questions" className="hover:text-text-primary-dark transition-colors">17-Subject Question Bank</Link></li>
              <li><Link to="/leaderboard" className="hover:text-text-primary-dark transition-colors">University Cut-Off Modeler</Link></li>
              <li><Link to="/auth?mode=cbt_key" className="hover:text-text-primary-dark transition-colors">Cyber-Cafe Center Bulk Mode</Link></li>
            </ul>
          </div>

          {/* Links Column 3: Support & Contact */}
          <div className="space-y-3 text-body-sm font-body-sm">
            <h4 className="text-label-md font-label-md text-text-primary-dark font-semibold">Candidate Support</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">call</span>
                <a href="tel:+2349113683395" className="text-text-primary-dark font-mono-data text-xs hover:underline">+234 911 368 3395</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[16px]">mail</span>
                <a href="mailto:support@aurikrex.ng" className="font-mono-data text-xs hover:underline">support@aurikrex.ng</a>
              </li>
              <li><Link to="/help" className="hover:text-text-primary-dark transition-colors">System Status &amp; Latency</Link></li>
              <li><Link to="/privacy" className="hover:text-text-primary-dark transition-colors">Privacy Policy &amp; Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright Sub-Footer */}
        <div className="max-w-[1440px] mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted-dark font-mono-data gap-4">
          <div>
            © 2025 Aurikrex Inc. All rights reserved. Not affiliated with or endorsed by JAMB official board.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-tertiary">
              <span className="w-2 h-2 rounded-full bg-tertiary" /> 100% Beta Availability Online
            </span>
            <span>Build AKX-2025.2.14-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
