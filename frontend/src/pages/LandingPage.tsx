import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlignLeft, ArrowRight, Award, BarChart3, BookOpen, Brain, BriefcaseBusiness, Calculator,
  Check, ChevronDown, Clock, CreditCard, Dna, FlaskConical, Globe, Handshake,
  Instagram, Landmark, Layers, Linkedin, Mail, Map, Menu, MessageSquare, Monitor,
  NotebookTabs, Phone, Play, Plus, ScrollText, Shield, Sparkles, Sprout, Star,
  Target, TrendingUp, Twitter, UserCheck, Users, X, Youtube, Zap,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

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

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <img src="/favicon.svg" alt="" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl object-cover shadow-[0_8px_20px_rgba(74,91,255,0.25)]" />
      {!compact && (
        <div className="flex flex-col">
          <span className="brand-name font-display text-[13px] sm:text-[15px] font-semibold leading-tight tracking-[-0.02em] text-white">Aurikrex Exam Arena</span>
          <span className="brand-kicker mt-0.5 text-[9px] sm:text-[11px] font-medium uppercase leading-none tracking-[0.16em] text-blue-300">by Aurikrex</span>
        </div>
      )}
    </div>
  );
}

function ExamInterfaceVisual() {
  const questionNumbers = Array.from({ length: 12 }, (_, index) => index + 1);
  return (
    <div className="landing-preview exam-preview relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-10 rounded-[40px] bg-[radial-gradient(circle_at_50%_50%,rgba(77,91,255,0.3),transparent_65%)] blur-3xl" />
      <div className="relative min-w-0 rounded-[28px] border border-white/10 bg-[#11172a] p-2 shadow-[0_32px_90px_rgba(0,0,0,0.48)]">
        <div className="overflow-hidden rounded-[21px] border border-white/[0.08] bg-[#f8faff]">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#17213b] px-4 py-3 text-white sm:flex-nowrap sm:px-5">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
              <div>
                <p className="text-xs font-semibold tracking-wide text-white">JAMB UTME Mock Exam</p>
                <p className="text-[12px] text-blue-200/70">Use of English · Question 12 of 60</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-blue-300" />
              <span className="font-mono text-xs font-semibold tracking-wide">01:42:18</span>
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-0 sm:grid-cols-[minmax(0,1fr)_154px]">
            <div className="min-w-0 p-4 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Comprehension</span>
                <span className="text-xs font-medium text-slate-400">1 mark</span>
              </div>
              <h3 className="max-w-[360px] text-[17px] font-semibold leading-[1.45] tracking-[-0.02em] text-slate-900">
                Choose the option that best completes the sentence below.
              </h3>
              <p className="mt-5 max-w-[370px] text-[14px] leading-7 text-slate-500">
                The principal commended the students for their ______ approach to the science project.
              </p>
              <div className="mt-6 space-y-2.5">
                {['methodical', 'methodic', 'methodically', 'methodism'].map((option, index) => (
                  <div key={option} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-[14px] ${index === 0 ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${index === 0 ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    {index === 0 && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-5">
                <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500">Previous</button>
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]">Next question <span className="ml-1">→</span></button>
              </div>
            </div>
            <div className="hidden border-l border-slate-200 bg-slate-50 p-4 sm:block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Questions</span>
                <span className="text-[12px] text-slate-400">12/60</span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {questionNumbers.map((number) => (
                  <div key={number} className={`flex h-7 items-center justify-center rounded-md text-[12px] font-semibold ${number === 12 ? 'bg-blue-600 text-white' : number < 10 ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-200 bg-white text-slate-400'}`}>
                    {number}
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 border-t border-slate-200 pt-4 text-[12px] text-slate-500">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Answered</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" /> Current</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-300" /> Unanswered</div>
              </div>
              <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-800"><Shield className="h-3.5 w-3.5" /> Exam integrity</div>
                <p className="mt-1.5 text-[12px] leading-5 text-blue-700/70">Your progress is saved automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-5 top-10 hidden rounded-2xl border border-white/10 bg-[#19223a]/90 px-3.5 py-3 shadow-xl backdrop-blur md:block">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs font-semibold text-emerald-200">Live exam mode</span></div>
      </div>
    </div>
  );
}

function AssistantPanel() {
  return (
    <div className="landing-preview assistant-preview relative mx-auto w-full max-w-[540px]">
      <div className="absolute -inset-12 rounded-full bg-[radial-gradient(circle,rgba(119,86,255,0.22),transparent_65%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#11172a] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
        <div className="rounded-[19px] border border-white/[0.07] bg-[#171e34] p-5">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white"><Brain className="h-4 w-4" /></div>
              <div><p className="text-[14px] font-semibold text-white">Study assistant</p><p className="mt-0.5 text-xs text-slate-400">Curriculum-aligned guidance</p></div>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[12px] font-semibold text-emerald-300">Online</span>
          </div>
          <div className="space-y-4 py-5">
            <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-md bg-blue-600/90 px-4 py-3 text-[14px] leading-6 text-white">Can you explain why the answer is methodical?</div>
            <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.045] px-4 py-3 text-[14px] leading-6 text-slate-300">
              <p>“Methodical” describes an approach that is careful, organized, and systematic. It is the adjective that correctly modifies <span className="font-semibold text-blue-200">approach</span>.</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-violet-300"><Sparkles className="h-3.5 w-3.5" /> JAMB Use of English · Vocabulary</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0f1527] px-3 py-2.5"><span className="flex-1 text-[14px] text-slate-500">Ask a follow-up question...</span><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 text-white"><ArrowIcon /></div></div>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function AnalyticsPanel() {
  return (
    <div className="landing-preview analytics-preview relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(25,191,154,0.16),transparent_65%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#11172a] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
        <div className="rounded-[19px] border border-white/[0.07] bg-[#171e34] p-5">
          <div className="flex items-center justify-between"><div><p className="text-[14px] font-semibold text-white">Performance overview</p><p className="mt-1 text-xs text-slate-400">Your last 30 days of practice</p></div><div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">Last 30 days <ChevronDown className="ml-1 inline h-3 w-3" /></div></div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[['Average score', '78%', '+12.4%', 'text-emerald-300'], ['Questions solved', '486', '+86 this week', 'text-blue-300'], ['Time accuracy', '92%', '+4.2%', 'text-violet-300']].map(([label, value, change, color]) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</p><p className={`mt-1 text-[12px] font-medium ${color}`}>{change}</p></div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-300">Score trend</p><p className="text-[12px] text-emerald-300">+18 points</p></div>
            <svg viewBox="0 0 500 155" className="mt-4 h-auto w-full" role="img" aria-label="Rising score trend chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4f6cff" stopOpacity=".32" /><stop offset="1" stopColor="#4f6cff" stopOpacity="0" /></linearGradient></defs><path d="M0 130H500M0 90H500M0 50H500" stroke="rgba(148,163,184,.12)" strokeDasharray="4 6" /><path d="M0 125 C55 120, 70 112, 110 115 S170 105, 210 93 S255 102, 295 78 S350 90, 390 65 S440 63, 500 22 V155 H0Z" fill="url(#area)" /><path d="M0 125 C55 120, 70 112, 110 115 S170 105, 210 93 S255 102, 295 78 S350 90, 390 65 S440 63, 500 22" fill="none" stroke="#6b7dff" strokeLinecap="round" strokeWidth="3" /><circle cx="500" cy="22" r="5" fill="#9aa6ff" stroke="#171e34" strokeWidth="3" /></svg>
            <div className="mt-1 flex justify-between text-[12px] text-slate-500"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ALL_SUBJECTS = [
  { name: 'Use of English', topics: 'Comprehension, Lexis, Oral Forms', icon: AlignLeft, compulsory: true },
  { name: 'Mathematics', topics: 'Algebra, Calculus, Statistics', icon: Calculator },
  { name: 'Physics', topics: 'Mechanics, Waves, Electromagnetism', icon: Zap },
  { name: 'Chemistry', topics: 'Organic, Inorganic, Physical', icon: FlaskConical },
  { name: 'Biology', topics: 'Anatomy, Ecology, Genetics', icon: Dna },
  { name: 'Geography', topics: 'Physical, Human, Map Reading', icon: Map },
  { name: 'Economics', topics: 'Micro, Macro, Development', icon: BarChart3 },
  { name: 'Government', topics: 'Constitution, Political Theory', icon: Landmark },
  { name: 'Literature in English', topics: 'Drama, Prose, Poetry', icon: BookOpen },
  { name: 'Commerce', topics: 'Trade, Banking, Insurance', icon: BriefcaseBusiness },
  { name: 'Accounting', topics: 'Bookkeeping, Financial Statements', icon: NotebookTabs },
  { name: 'Agricultural Science', topics: 'Agronomy, Livestock, Forestry', icon: Sprout },
  { name: 'Civic Education', topics: 'Values, Rights, Governance', icon: Handshake },
  { name: 'Christian Religious Knowledge', topics: 'Themes, Epistles, Gospels', icon: Plus },
  { name: 'Islamic Religious Knowledge', topics: 'Quran, Hadith, Fiqh', icon: Globe },
  { name: 'History', topics: 'Pre-Colonial, Colonial, Modern', icon: ScrollText },
  { name: 'Further Mathematics', topics: 'Mechanics, Pure Maths, Stats', icon: Target },
];

const sectionLabel = 'section-kicker text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em]';
const sectionHeading = 'section-heading font-display text-xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-white';

export default function LandingPage() {
  const heroRef = useInView(0.1);
  const featuresRef = useInView();
  const subjectsRef = useInView();
  const pricingRef = useInView();
  const statsRef = useInView();
  const howItWorksRef = useInView();
  const aiRef = useInView();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page landing-shell min-h-screen bg-bg-primary font-body text-text-primary selection:bg-blue-500/30 selection:text-white">
      <header className="site-header fixed top-0 inset-x-0 z-50 border-b border-white/[0.08] bg-[#0a1020]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 sm:h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Aurikrex Exam Arena home"><BrandMark /></Link>
          <nav className="hidden items-center gap-8 text-xs sm:text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#subjects" className="transition-colors hover:text-white">Subjects</a>
            <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <Link to="/auth?mode=login" className="hidden text-xs sm:text-sm font-medium text-slate-300 transition-colors hover:text-white sm:inline-flex">Sign in</Link>
            <Link to="/auth?mode=register" className="hidden min-h-11 items-center rounded-lg bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.08)] transition hover:bg-blue-50 active:scale-[0.98] sm:inline-flex sm:px-4">Get started</Link>
            <button className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white md:hidden" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {mobileMenuOpen && <div id="mobile-navigation" className="mobile-nav border-t border-white/[0.07] bg-[#0a1020] px-4 py-4 sm:px-6 md:hidden"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Menu</span><button type="button" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs sm:text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white" onClick={() => setMobileMenuOpen(false)}><X className="h-4 w-4" />Close</button></div><nav className="grid gap-1 text-xs sm:text-sm font-medium text-slate-300" aria-label="Mobile navigation"><a className="flex min-h-11 items-center rounded-lg px-3 transition hover:bg-white/[0.06] hover:text-white" href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a><a className="flex min-h-11 items-center rounded-lg px-3 transition hover:bg-white/[0.06] hover:text-white" href="#subjects" onClick={() => setMobileMenuOpen(false)}>Subjects</a><a className="flex min-h-11 items-center rounded-lg px-3 transition hover:bg-white/[0.06] hover:text-white" href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a><a className="flex min-h-11 items-center rounded-lg px-3 transition hover:bg-white/[0.06] hover:text-white" href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a><Link className="flex min-h-11 items-center rounded-lg px-3 transition hover:bg-white/[0.06] hover:text-white" to="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>Sign in</Link><Link className="mt-1 flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-3 font-semibold text-white transition hover:bg-blue-500 text-xs sm:text-sm" to="/auth?mode=register" onClick={() => setMobileMenuOpen(false)}>Get started</Link></nav></div>}
      </header>

      <main className="pt-16 sm:pt-[76px]">
        <section className="hero-section relative border-b border-white/[0.06] px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="hero-glow pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_72%_28%,rgba(72,83,255,0.2),transparent_33%),radial-gradient(circle_at_20%_0%,rgba(21,132,255,0.10),transparent_30%)]" />
          <div className="hero-rule pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div ref={heroRef.ref} className="relative z-10 mx-auto grid min-w-0 max-w-7xl grid-cols-1 items-center gap-8 sm:gap-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div className={`${heroRef.visible ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <div className="mb-4 sm:mb-6 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.08] px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-blue-200"><Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-300" /> Nigeria's focused UTME practice platform</div>
              <h1 className="hero-title max-w-2xl font-display text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-[1.15] sm:leading-[1.05] tracking-tight text-white">Practice with purpose. <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">Score with confidence.</span></h1>
              <p className="hero-copy mt-3 sm:mt-6 max-w-xl text-xs sm:text-base leading-5 sm:leading-7 text-slate-400">A realistic JAMB CBT experience with curated questions, clear explanations, and progress insights that help you make every study session count.</p>
              <div className="mt-6 sm:mt-9 flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <Link to="/auth?mode=register" className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-white sm:w-auto shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-500 active:scale-[0.98]">Start practicing <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
                <a href="#how-it-works" className="secondary-cta inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.035] px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-200 sm:w-auto transition hover:border-white/20 hover:bg-white/[0.07]"><Play className="h-4 w-4 text-blue-300" /> See how it works</a>
              </div>
              <div className="mt-5 sm:mt-8 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-[11px] sm:text-xs text-slate-500"><span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-400" /> Secure & private</span><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-blue-300" /> Beta Access</span><span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-300" /> Early Preview</span></div>
            </div>
            <div className={`${heroRef.visible ? 'animate-slide-in-right' : 'opacity-0'}`} style={{ animationDelay: '0.15s' }}><ExamInterfaceVisual /></div>
          </div>
        </section>

        <section className="stats-band border-b border-white/[0.06] bg-[#0d1426]/70 px-4 py-8 sm:py-10 sm:px-6">
          <div ref={statsRef.ref} className={`mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/[0.08] md:grid-cols-4 md:divide-y-0 ${statsRef.visible ? 'animate-slide-up' : 'opacity-0'}`}>
            {[
              { value: 1000000, suffix: '+', label: 'Practice questions', icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" /> },
              { value: 17, label: 'JAMB subjects', icon: <Layers className="h-4 w-4 sm:h-5 sm:w-5" /> },
              { value: 100000, suffix: '+', label: 'Students enrolled', icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" /> },
              { value: 300, suffix: '+', label: 'Average score boost', icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> },
            ].map((stat) => <div key={stat.label} className="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-0 text-center first:border-l-0"><div className="stat-icon text-blue-300">{stat.icon}</div><div className="stat-value font-display text-xl sm:text-3xl font-semibold tracking-[-0.05em] text-white"> <AnimatedCounter target={stat.value} suffix={stat.suffix} /></div><div className="stat-label text-xs sm:text-[13px] font-medium text-slate-500">{stat.label}</div></div>)}
          </div>
        </section>

        <section id="features" className="px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div ref={featuresRef.ref} className={`mx-auto mb-10 sm:mb-14 max-w-2xl text-center ${featuresRef.visible ? 'animate-slide-up' : 'opacity-0'}`}><div className={`${sectionLabel} text-blue-300`}>Everything you need to improve</div><h2 className={`${sectionHeading} mt-3 sm:mt-5`}>Built for the way JAMB is actually taken.</h2><p className="mt-3 sm:mt-5 text-xs sm:text-base leading-5 sm:leading-7 text-slate-400">Focused tools, realistic practice, and feedback that moves you forward — without the noise.</p></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Monitor className="h-5 w-5" />, title: 'Realistic exam simulator', text: 'Practice in a faithful CBT environment with the same pace, navigation, timer, and question flow you will meet on exam day.' },
                { icon: <BookOpen className="h-5 w-5" />, title: 'Step-by-step explanations', text: 'Understand the method behind each answer with clear explanations, diagrams, and curriculum-aligned reasoning.' },
                { icon: <Layers className="h-5 w-5" />, title: 'Fresh practice every time', text: 'Smart question selection keeps your mocks varied, balanced, and focused on the areas that need more work.' },
                { icon: <BarChart3 className="h-5 w-5" />, title: 'Performance analytics', text: 'See how you are doing by subject, topic, and difficulty so revision becomes specific instead of stressful.' },
                { icon: <Shield className="h-5 w-5" />, title: 'CBT key access', text: 'Use a unique access key to resume your preparation from any trusted cyber cafe or shared device.' },
                { icon: <Brain className="h-5 w-5" />, title: 'AI study assistant', text: 'Ask questions in simple English or Pidgin and get useful, focused support when you need another explanation.' },
              ].map((feature) => <div key={feature.title} className="feature-card group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.055]"><div className="mb-4 sm:mb-6 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/[0.09] text-blue-300 transition group-hover:bg-blue-400/[0.15]">{feature.icon}</div><h3 className="feature-title font-display text-sm sm:text-base font-semibold tracking-tight text-white">{feature.title}</h3><p className="feature-copy mt-2 sm:mt-3 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">{feature.text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="section-band ai-band border-y border-white/[0.06] bg-[#0d1426]/60 px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div ref={aiRef.ref} className={`mx-auto grid max-w-7xl items-center gap-10 sm:gap-16 lg:grid-cols-[1.05fr_0.95fr] ${aiRef.visible ? '' : 'opacity-0'}`}><div className={`${aiRef.visible ? 'animate-slide-in-left' : ''}`}><AssistantPanel /></div><div className={`${aiRef.visible ? 'animate-slide-in-right' : ''}`} style={{ animationDelay: '0.15s' }}><div className={`${sectionLabel} text-violet-300`}>A little extra help, right when you need it</div><h2 className={`${sectionHeading} mt-3 sm:mt-5`}>Turn “I don’t get it” into a next step.</h2><p className="mt-3 sm:mt-5 max-w-xl text-xs sm:text-base leading-5 sm:leading-7 text-slate-400">The AI study assistant is designed to help you understand difficult topics in the language and level that works for you — not to overwhelm you with more content.</p><ul className="mt-5 sm:mt-7 space-y-3 sm:space-y-4">{['Conversational tutoring in simple English and Pidgin', 'Explains JAMB topics across all 17 subjects', 'Identifies weak areas and creates targeted drills', 'Available 24/7 on the Max plan'].map((item) => <li key={item} className="feature-list-item flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-300"><span className="mt-0.5 flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></span>{item}</li>)}</ul><Link to="/auth?mode=register" className="ai-cta mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-400/[0.09] px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-violet-200 transition hover:bg-violet-400/[0.15]">Explore the assistant <MessageSquare className="h-4 w-4" /></Link></div></div>
        </section>

        <section id="subjects" className="px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl"><div ref={subjectsRef.ref} className={`mx-auto mb-10 sm:mb-14 max-w-2xl text-center ${subjectsRef.visible ? 'animate-slide-up' : 'opacity-0'}`}><div className={`${sectionLabel} text-emerald-300`}>One platform, the full syllabus</div><h2 className={`${sectionHeading} mt-3 sm:mt-5`}>All 17 JAMB subjects covered.</h2><p className="mt-3 sm:mt-5 text-xs sm:text-base leading-5 sm:leading-7 text-slate-400">From Use of English to Further Mathematics, practice with updated questions mapped to the subjects that matter.</p></div><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{ALL_SUBJECTS.map((subject) => { const Icon = subject.icon; return <div key={subject.name} className={`subject-card group rounded-xl border p-3.5 sm:p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.045] ${subject.compulsory ? 'subject-compulsory border-blue-400/30 bg-blue-400/[0.07] hover:border-blue-300/50' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.16]'}`}><div className="mb-3 sm:mb-4 flex items-start justify-between"><span className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg ${subject.compulsory ? 'bg-blue-400/15 text-blue-200' : 'bg-white/[0.06] text-slate-400'} transition group-hover:text-blue-200`}><Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /></span>{subject.compulsory && <span className="rounded-full bg-blue-400/15 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-blue-200">Required</span>}</div><p className="subject-title text-xs sm:text-sm font-semibold leading-5 text-white">{subject.name}</p><p className="subject-copy mt-1 text-[11px] sm:text-xs leading-4 sm:leading-5 text-slate-500">{subject.topics}</p></div>})}</div></div>
        </section>

        <section id="how-it-works" className="section-band process-band border-y border-white/[0.06] bg-[#0d1426]/60 px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl"><div ref={howItWorksRef.ref} className={`mx-auto mb-10 sm:mb-14 max-w-2xl text-center ${howItWorksRef.visible ? 'animate-slide-up' : 'opacity-0'}`}><div className={`${sectionLabel} text-blue-300`}>Simple, structured progress</div><h2 className={`${sectionHeading} mt-3 sm:mt-5`}>How it works.</h2><p className="mt-3 sm:mt-5 text-xs sm:text-base leading-5 sm:leading-7 text-slate-400">From registration to your first 300+ score, you can start with a clear plan in under five minutes.</p></div><div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-4">{[{ step: '01', title: 'Create your account', text: 'Sign up with email, Google, or a CBT Key from a partner center.', icon: <UserCheck className="h-5 w-5" /> }, { step: '02', title: 'Pick your subjects', text: 'Choose your four-subject UTME combination with English included.', icon: <Target className="h-5 w-5" /> }, { step: '03', title: 'Start practicing', text: 'Take mocks or quick drills and get instant, useful feedback.', icon: <Zap className="h-5 w-5" /> }, { step: '04', title: 'Track and improve', text: 'Use your insights to fix weak spots and watch your score climb.', icon: <TrendingUp className="h-5 w-5" /> }].map((item, index) => <div key={item.step} className="process-card relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5"><div className="flex items-center justify-between"><div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/[0.08] text-blue-200">{item.icon}</div><span className="font-mono text-xs font-semibold tracking-[0.16em] text-blue-300/80">{item.step}</span></div><h3 className="process-title mt-4 sm:mt-6 font-display text-sm sm:text-base font-semibold tracking-tight text-white">{item.title}</h3><p className="process-copy mt-1.5 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">{item.text}</p>{index < 3 && <div className="absolute -right-4 top-10 hidden h-px w-8 bg-gradient-to-r from-blue-400/40 to-transparent md:block" />}</div>)}</div></div>
        </section>

        <section className="performance-section px-4 py-16 sm:px-6 sm:py-24 lg:py-28"><div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-16 lg:grid-cols-[0.85fr_1.15fr]"><div><div className={`${sectionLabel} text-emerald-300`}>Make revision more specific</div><h2 className={`${sectionHeading} mt-3 sm:mt-5`}>Know exactly where you stand.</h2><p className="mt-3 sm:mt-5 max-w-xl text-xs sm:text-base leading-5 sm:leading-7 text-slate-400">See your performance by subject, topic, and difficulty after every test. The goal is not more data — it is knowing what to do next.</p><ul className="mt-5 sm:mt-7 space-y-3 sm:space-y-4">{['Per-subject score breakdowns', 'Time-per-question analysis', 'Difficulty-based performance trends', 'Progress tracking over time'].map((item) => <li key={item} className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-300"><Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-300" />{item}</li>)}</ul></div><AnalyticsPanel /></div></section>

        <section id="pricing" className="section-band pricing-band border-t border-white/[0.06] bg-[#0d1426]/60 px-4 py-16 sm:px-6 sm:py-24 lg:py-28"><div className="mx-auto max-w-7xl"><div ref={pricingRef.ref} className={`mx-auto mb-10 sm:mb-14 max-w-2xl text-center ${pricingRef.visible ? 'animate-slide-up' : 'opacity-0'}`}><div className={`${sectionLabel} text-amber-300`}>Straightforward plans</div><h2 className={`${sectionHeading} mt-3 sm:mt-5`}>Choose your pace.</h2><p className="mt-3 sm:mt-5 text-xs sm:text-base leading-5 sm:leading-7 text-slate-400">Start with a plan that fits your routine. Every option is built around consistent, exam-focused practice.</p></div><div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { name: 'Plus', price: '₦3,500', note: '1 test daily', icon: <Zap className="h-5 w-5" />, tone: 'blue', features: ['Full mock exam (4 subjects)', 'Detailed score reviews', 'Performance statistics', 'Step-by-step explanations', 'CBT Key access'] },
            { name: 'Pro', price: '₦6,000', note: '2 tests daily', icon: <Award className="h-5 w-5" />, tone: 'violet', popular: true, features: ['Full mock exams (4 subjects)', 'Detailed score reviews', 'Advanced performance statistics', 'Step-by-step explanations', 'CBT Key access', 'Subject-specific drills'] },
            { name: 'Max', price: '₦14,000', note: '5 tests daily + AI chat', icon: <Brain className="h-5 w-5" />, tone: 'pink', features: ['Full mock exams (4 subjects)', 'Detailed score reviews', 'Advanced performance statistics', 'Step-by-step explanations', 'CBT Key access', 'Subject-specific drills', 'AI conversational tutor', 'Personalized study plans'] },
          ].map((plan) => <div key={plan.name} className={`pricing-card relative flex min-w-0 flex-col justify-between rounded-2xl p-5 sm:p-6 ${plan.popular ? 'pricing-card-popular border border-blue-400/50 bg-blue-500/[0.08] shadow-[0_22px_60px_rgba(52,75,210,0.18)]' : 'border border-white/[0.08] bg-white/[0.03]'}`}>{plan.popular && <span className="absolute -top-3 left-6 whitespace-nowrap rounded-full bg-blue-500 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)]">Most popular</span>}<div><div className="flex items-center gap-2.5 sm:gap-3"><div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${plan.tone === 'pink' ? 'bg-pink-400/10 text-pink-300' : plan.tone === 'violet' ? 'bg-violet-400/10 text-violet-200' : 'bg-blue-400/10 text-blue-200'}`}>{plan.icon}</div><h3 className="pricing-title font-display text-base sm:text-lg font-semibold tracking-tight text-white">{plan.name}</h3></div><div className="mt-5 sm:mt-7 flex flex-wrap items-end gap-x-2 gap-y-1"><span className="pricing-price font-display text-2xl sm:text-4xl font-semibold tracking-[-0.06em] text-white">{plan.price}</span><span className="pb-1 text-xs sm:text-sm text-slate-500">/ month</span></div><p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium ${plan.tone === 'pink' ? 'text-pink-300' : plan.tone === 'violet' ? 'text-violet-300' : 'text-blue-300'}`}>{plan.note}</p><ul className="mt-5 sm:mt-7 space-y-2.5 sm:space-y-3">{plan.features.map((feature) => <li key={feature} className="pricing-feature flex items-start gap-2 text-xs sm:text-sm leading-5 text-slate-300"><Check className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-emerald-300" />{feature}</li>)}</ul></div><Link to="/auth?mode=register" className={`mt-6 sm:mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition active:scale-[0.98] ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-white/[0.12] bg-white/[0.04] text-slate-200 hover:border-blue-400/30 hover:bg-blue-400/[0.08]'}`}>Get {plan.name}</Link></div>)}
        </div><div className="payg-panel mx-auto mt-5 max-w-3xl rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 text-center"><div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" /> Pay per test</div><h3 className="mt-3 sm:mt-4 font-display text-lg sm:text-2xl font-semibold tracking-tight text-white">No subscription? No problem.</h3><p className="mx-auto mt-1.5 sm:mt-2 max-w-md text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">Pay only when you practice. Buy individual tests without a monthly commitment.</p><div className="mt-4 sm:mt-5 flex flex-wrap justify-center gap-3 sm:flex-nowrap"><div className="payg-item rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 sm:px-6 sm:py-4"><p className="font-display text-lg sm:text-2xl font-semibold tracking-tight text-white">₦300</p><p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">per drill test</p></div><div className="payg-item rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 sm:px-6 sm:py-4"><p className="font-display text-lg sm:text-2xl font-semibold tracking-tight text-white">₦500</p><p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500">per mock exam</p></div></div></div></div></section>

        <section className="cta-section relative px-4 py-16 sm:px-6 sm:py-24 lg:py-28"><div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-64 max-w-3xl -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" /><div className="relative mx-auto max-w-3xl text-center"><div className={`${sectionLabel} text-blue-300`}>Ready when you are</div><h2 className="mt-3 sm:mt-5 font-display text-2xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-white">Build the confidence to score <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">300+.</span></h2><p className="mx-auto mt-3 sm:mt-5 max-w-xl text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">Join more than 100,000 Nigerian students using a calmer, more focused way to prepare for UTME.</p><Link to="/auth?mode=register" className="mt-6 sm:mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-blue-50 active:scale-[0.98]">Start practicing for free <ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>

      <footer className="site-footer border-t border-white/[0.07] bg-[#080d19] px-4 sm:px-6 pb-8 pt-10 sm:pt-14"><div className="mx-auto max-w-7xl"><div className="grid gap-8 sm:gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]"><div><BrandMark /><p className="mt-4 sm:mt-5 max-w-xs text-xs sm:text-sm leading-5 sm:leading-6 text-slate-500">Nigeria's focused Computer-Based Test simulator, built to help every student prepare with clarity.</p><div className="mt-4 sm:mt-5 flex items-center gap-2">{[{ icon: <Twitter className="h-4 w-4" />, href: 'https://x.com/aurikrex', label: 'Twitter / X' }, { icon: <Instagram className="h-4 w-4" />, href: 'https://www.instagram.com/falcon.omotosho', label: 'Instagram' }, { icon: <Linkedin className="h-4 w-4" />, href: 'https://linkedin.com/in/falcon-omotosho', label: 'LinkedIn' }, { icon: <Youtube className="h-4 w-4" />, href: 'https://www.youtube.com/@aurikrex', label: 'YouTube' }, { icon: <Globe className="h-4 w-4" />, href: 'https://www.tiktok.com/@aurikrexacademy', label: 'TikTok' }].map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-500 transition hover:border-blue-400/30 hover:bg-blue-400/[0.08] hover:text-blue-200">{social.icon}</a>)}</div></div><div><h4 className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-300">Product</h4><ul className="mt-3 sm:mt-5 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-500"><li><a href="#features" className="transition hover:text-white">Features</a></li><li><a href="#subjects" className="transition hover:text-white">Subjects</a></li><li><a href="#pricing" className="transition hover:text-white">Pricing</a></li><li><a href="#how-it-works" className="transition hover:text-white">How it works</a></li></ul></div><div><h4 className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-300">Support</h4><ul className="mt-3 sm:mt-5 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-500"><li><Link to="/help" className="transition hover:text-white">Help center</Link></li><li><Link to="/contact" className="transition hover:text-white">Contact us</Link></li><li><Link to="/privacy" className="transition hover:text-white">Privacy policy</Link></li><li><Link to="/terms" className="transition hover:text-white">Terms of service</Link></li></ul></div><div><h4 className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-300">Contact</h4><ul className="mt-3 sm:mt-5 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-500"><li className="flex items-center gap-2"><Mail className="h-4 w-4" /><a href="mailto:info@aurikrex.tech" className="transition hover:text-white">info@aurikrex.tech</a></li><li className="flex items-center gap-2"><Phone className="h-4 w-4" /><a href="tel:+2349113683395" className="transition hover:text-white">+234 911 368 3395</a></li><li className="flex items-center gap-2"><Globe className="h-4 w-4" /><a href="https://www.aurikrex.tech" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">www.aurikrex.tech</a></li></ul></div></div><div className="mt-8 sm:mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-[11px] sm:text-xs text-slate-600 md:flex-row md:items-center md:justify-between"><div><p>© {new Date().getFullYear()} Aurikrex Exam Arena. All rights reserved.</p><p className="mt-1">Founded by <span className="text-slate-400">Omotosho Korede Samuel</span> · A product of <span className="text-slate-400">Aurikrex</span></p></div><div className="flex items-center gap-4 sm:gap-5"><Link to="/privacy" className="transition hover:text-white">Privacy</Link><Link to="/terms" className="transition hover:text-white">Terms</Link><a href="#" className="transition hover:text-white">Cookies</a></div></div></div></footer>
    </div>
  );
}
