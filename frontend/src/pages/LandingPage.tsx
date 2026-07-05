import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Award, Zap, Shield, ArrowRight, UserCheck, Layers,
  BarChart3, Brain, Clock, MessageSquare, Check, X, Star,
  ChevronDown, Globe, Sparkles, Target, TrendingUp, Users,
  Instagram, Twitter, Linkedin, Youtube, Mail, Phone,
  CreditCard, Play, Monitor,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Intersection Observer hook for scroll reveals
   ───────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────────
   Animated counter component
   ───────────────────────── */
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ────────────────────────
   Floating particle system
   ──────────────────────── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-indigo-400/20"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────
   Orbiting ring decoration
   ───────────────────────── */
function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer ring */}
      <div className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full border border-indigo-500/10 animate-spin-slow" />
      {/* Inner ring */}
      <div className="absolute w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full border border-violet-500/10 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />
      {/* Orbiting dots */}
      <div className="absolute animate-orbit">
        <div className="w-3 h-3 rounded-full bg-indigo-500/60 shadow-lg shadow-indigo-500/50" />
      </div>
      <div className="absolute animate-orbit" style={{ animationDelay: '-7s', animationDuration: '18s' }}>
        <div className="w-2 h-2 rounded-full bg-violet-400/60 shadow-lg shadow-violet-400/50" />
      </div>
      <div className="absolute animate-orbit" style={{ animationDelay: '-14s', animationDuration: '25s' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40 shadow-lg shadow-emerald-400/40" />
      </div>
    </div>
  );
}

/* ──────────────────────
   Subject data (all 17)
   ────────────────────── */
const ALL_SUBJECTS = [
  { name: 'Use of English', topics: 'Comprehension, Lexis, Oral Forms', icon: '📝', compulsory: true },
  { name: 'Mathematics', topics: 'Algebra, Calculus, Statistics', icon: '📐', compulsory: false },
  { name: 'Physics', topics: 'Mechanics, Waves, Electromagnetism', icon: '⚡', compulsory: false },
  { name: 'Chemistry', topics: 'Organic, Inorganic, Physical', icon: '🧪', compulsory: false },
  { name: 'Biology', topics: 'Anatomy, Ecology, Genetics', icon: '🧬', compulsory: false },
  { name: 'Geography', topics: 'Physical, Human, Map Reading', icon: '🌍', compulsory: false },
  { name: 'Economics', topics: 'Micro, Macro, Development', icon: '📊', compulsory: false },
  { name: 'Government', topics: 'Constitution, Political Theory', icon: '🏛️', compulsory: false },
  { name: 'Literature in English', topics: 'Drama, Prose, Poetry', icon: '📖', compulsory: false },
  { name: 'Commerce', topics: 'Trade, Banking, Insurance', icon: '💼', compulsory: false },
  { name: 'Accounting', topics: 'Bookkeeping, Financial Statements', icon: '📒', compulsory: false },
  { name: 'Agricultural Science', topics: 'Agronomy, Livestock, Forestry', icon: '🌾', compulsory: false },
  { name: 'Civic Education', topics: 'Values, Rights, Governance', icon: '🤝', compulsory: false },
  { name: 'Christian Religious Knowledge', topics: 'Themes, Epistles, Gospels', icon: '✝️', compulsory: false },
  { name: 'Islamic Religious Knowledge', topics: 'Quran, Hadith, Fiqh', icon: '☪️', compulsory: false },
  { name: 'History', topics: 'Pre-Colonial, Colonial, Modern', icon: '📜', compulsory: false },
  { name: 'Further Mathematics', topics: 'Mechanics, Pure Maths, Stats', icon: '∑', compulsory: false },
];

/* ──────────
   MAIN PAGE
   ────────── */
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden relative">
      {/* ──────── Background Gradients ──────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-indigo-900/15 blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-violet-900/15 blur-[160px]" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-emerald-900/10 blur-[120px]" />
      </div>

      {/* ══════════════════════════════════════
          HEADER
          ══════════════════════════════════════ */}
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-display font-bold text-[13px] text-white shadow-lg shadow-indigo-500/30 tracking-tight">
              CBT
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-display font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight">
                JAMB UTME Prep
              </span>
              <span className="text-[10px] text-indigo-400 font-medium tracking-widest uppercase leading-tight">
                by Aurikex
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#subjects" className="hover:text-white transition-colors duration-200">Subjects</a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="hidden sm:inline-flex text-[13px] font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/auth?mode=register"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-95"
            >
              Get Started
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-xl px-6 py-4 space-y-3 animate-slide-up">
            <a href="#features" className="block text-[13px] text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#subjects" className="block text-[13px] text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Subjects</a>
            <a href="#how-it-works" className="block text-[13px] text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" className="block text-[13px] text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <Link to="/auth?mode=login" className="block text-[13px] text-slate-300 hover:text-white py-2">Sign In</Link>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════ */}
      <section className="relative pt-16 pb-12 md:pt-28 md:pb-20 overflow-hidden">
        <OrbitRings />
        <FloatingParticles />

        <div ref={heroRef.ref} className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div className={`space-y-8 ${heroRef.visible ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-semibold text-indigo-300 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                Nigeria's #1 UTME Exam Simulator
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-display font-extrabold tracking-tight leading-[1.05]">
                <span className="bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent">
                  Ace Your JAMB
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  UTME Exam
                </span>
              </h1>

              <p className="max-w-lg text-[15px] sm:text-[17px] text-slate-400 leading-relaxed">
                Experience the exact JAMB exam environment. Practice with <strong className="text-slate-200">50,000+ curated questions</strong> across all 17 subjects, get AI-powered explanations, and track your progress to exam day.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/auth?mode=register"
                  className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:from-indigo-500 hover:to-violet-500 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  Start Practicing
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#how-it-works"
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm px-8 py-4 text-[15px] font-bold text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-600 transition-all transform hover:-translate-y-0.5"
                >
                  <Play className="h-4 w-4" />
                  See How It Works
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span>100K+ Students</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span>4.9 Rating</span>
                </div>
              </div>
            </div>

            {/* Right — hero image with glow effects */}
            <div className={`relative ${heroRef.visible ? 'animate-slide-in-right' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              {/* Glow behind image */}
              <div className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 blur-3xl animate-glow-pulse" />
              
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-indigo-500/10">
                <img
                  src="/images/hero-illustration.png"
                  alt="JAMB CBT Exam Interface"
                  className="w-full h-auto animate-float-slow"
                />
                {/* Floating UI elements over image */}
                <div className="absolute top-4 right-4 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-2 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-300">Live Exam Mode</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-2 animate-float" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    <span className="text-[11px] font-semibold text-slate-300">02:00:00 Timer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BANNER
          ══════════════════════════════════════ */}
      <section className="relative z-10 border-y border-slate-800/60 bg-slate-900/30 backdrop-blur-md">
        <div ref={statsRef.ref} className="mx-auto max-w-7xl px-6 py-12">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 ${statsRef.visible ? 'animate-slide-up' : 'opacity-0'}`}>
            {[
              { value: 50000, suffix: '+', label: 'Practice Questions', icon: <BookOpen className="h-5 w-5" /> },
              { value: 17, suffix: '', label: 'JAMB Subjects', icon: <Layers className="h-5 w-5" /> },
              { value: 100000, suffix: '+', label: 'Students Enrolled', icon: <Users className="h-5 w-5" /> },
              { value: 300, suffix: '+', label: 'Avg. Score Boost', icon: <TrendingUp className="h-5 w-5" /> },
            ].map((stat, idx) => (
              <div key={idx} className="text-center space-y-2">
                <div className="flex justify-center text-indigo-400 mb-2">{stat.icon}</div>
                <div className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[12px] text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES GRID
          ══════════════════════════════════════ */}
      <section id="features" className="relative py-24 z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div ref={featuresRef.ref} className={`text-center max-w-3xl mx-auto mb-20 space-y-4 ${featuresRef.visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[11px] font-semibold text-indigo-400 mb-4">
              POWERFUL FEATURES
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Engineered for Score Excellence
            </h2>
            <p className="text-[15px] text-slate-400 max-w-2xl mx-auto">
              Every tool you need to dominate the JAMB UTME, built by engineers who understand the Nigerian education system.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Monitor className="h-6 w-6" />,
                title: 'Realistic Exam Simulator',
                description: 'A pixel-perfect replica of the JAMB CBT interface. Same layout, same timer, same navigation — zero surprises on exam day.',
                color: 'indigo',
                delay: '0s',
              },
              {
                icon: <BookOpen className="h-6 w-6" />,
                title: 'Step-by-Step Explanations',
                description: 'Every question includes detailed solutions with LaTeX-formatted math, diagrams, and reasoning pathways. Learn, don\'t just memorize.',
                color: 'violet',
                delay: '0.1s',
              },
              {
                icon: <Layers className="h-6 w-6" />,
                title: 'Smart Duplicate Detection',
                description: 'Our TF-IDF vector engine ensures every mock exam is unique. No repeated questions — ever. Fresh challenges on every attempt.',
                color: 'purple',
                delay: '0.2s',
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: 'Performance Analytics',
                description: 'Detailed breakdowns by subject, topic, and difficulty. See your weak areas, track your improvement, and predict your real score.',
                color: 'emerald',
                delay: '0.3s',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'CBT Key Access',
                description: 'Get a unique CBT key for your account. Walk into any cyber cafe, enter your key, and continue right where you left off.',
                color: 'amber',
                delay: '0.4s',
              },
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'AI Study Assistant',
                description: 'Stuck on a concept? Chat with our AI tutor that explains topics in simple language. Available 24/7 on the Max plan.',
                color: 'pink',
                delay: '0.5s',
              },
            ].map((feature, idx) => {
              const colorMap: Record<string, string> = {
                indigo: 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5 text-indigo-400',
                violet: 'border-violet-500/30 hover:border-violet-500/60 bg-violet-500/5 text-violet-400',
                purple: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 text-purple-400',
                emerald: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 text-emerald-400',
                amber: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 text-amber-400',
                pink: 'border-pink-500/30 hover:border-pink-500/60 bg-pink-500/5 text-pink-400',
              };
              const colors = colorMap[feature.color] || colorMap.indigo;
              const [borderColor, hoverBorder, bgColor, textColor] = colors.split(' ');

              return (
                <div
                  key={idx}
                  className={`group rounded-2xl border ${borderColor} ${hoverBorder} bg-slate-900/20 p-8 transition-all duration-500 hover:bg-slate-900/40 hover:-translate-y-1 hover:shadow-xl`}
                  style={{ animationDelay: feature.delay }}
                >
                  <div className={`h-12 w-12 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${textColor}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-[18px] font-display font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          AI ASSISTANT SHOWCASE
          ══════════════════════════════════════ */}
      <section className="relative py-24 z-10 border-y border-slate-800/40">
        <div className="mx-auto max-w-7xl px-6">
          <div ref={aiRef.ref} className={`grid md:grid-cols-2 gap-16 items-center ${aiRef.visible ? '' : 'opacity-0'}`}>
            {/* Left — image */}
            <div className={`relative ${aiRef.visible ? 'animate-slide-in-left' : ''}`}>
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 blur-2xl animate-glow-pulse" />
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/40 shadow-2xl">
                <img
                  src="/images/ai-chat-feature.png"
                  alt="AI Study Assistant"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Right — copy */}
            <div className={`space-y-6 ${aiRef.visible ? 'animate-slide-in-right' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/5 px-4 py-1.5 text-[11px] font-semibold text-pink-400">
                <Brain className="h-3 w-3" />
                MAX PLAN EXCLUSIVE
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                Your Personal <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">AI Study Partner</span>
              </h2>
              <p className="text-[15px] text-slate-400 leading-relaxed">
                Don't just practice — <strong className="text-slate-200">understand</strong>. Our AI tutor engages you in real conversations about JAMB topics. Ask it anything — from photosynthesis to quadratic equations — and get clear, curriculum-aligned explanations instantly.
              </p>
              <ul className="space-y-4">
                {[
                  'Conversational tutoring in simple English / Pidgin',
                  'Explains any JAMB topic across all 17 subjects',
                  'Identifies your weak areas and creates targeted drills',
                  'Available 24/7 — study at your own pace',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-slate-300">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 text-[14px] font-bold text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all active:scale-95"
              >
                Try AI Assistant <MessageSquare className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ALL 17 SUBJECTS
          ══════════════════════════════════════ */}
      <section id="subjects" className="relative py-24 z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div ref={subjectsRef.ref} className={`text-center max-w-3xl mx-auto mb-16 space-y-4 ${subjectsRef.visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[11px] font-semibold text-emerald-400 mb-4">
              FULL JAMB SYLLABUS
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              All 17 JAMB Subjects Covered
            </h2>
            <p className="text-[15px] text-slate-400 max-w-2xl mx-auto">
              From Use of English to Further Mathematics — every official JAMB subject with thousands of updated, curriculum-aligned questions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ALL_SUBJECTS.map((sub, idx) => (
              <div
                key={idx}
                className={`group rounded-xl border bg-slate-900/20 p-5 hover:bg-slate-900/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  sub.compulsory
                    ? 'border-indigo-500/40 hover:border-indigo-500/60 shadow-indigo-500/5'
                    : 'border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{sub.icon}</span>
                  {sub.compulsory && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      Compulsory
                    </span>
                  )}
                </div>
                <div className="text-[14px] font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">{sub.name}</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">{sub.topics}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-24 z-10 border-y border-slate-800/40 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-6">
          <div ref={howItWorksRef.ref} className={`text-center max-w-3xl mx-auto mb-20 space-y-4 ${howItWorksRef.visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-[11px] font-semibold text-violet-400 mb-4">
              SIMPLE STEPS
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-[15px] text-slate-400">
              From registration to your first 300+ score — it takes less than 5 minutes to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Account', description: 'Sign up with email, Google, or get a CBT Key from any partner center near you.', icon: <UserCheck className="h-6 w-6" /> },
              { step: '02', title: 'Pick Your Subjects', description: 'Choose your 4-subject UTME combination (Use of English is auto-included).', icon: <Target className="h-6 w-6" /> },
              { step: '03', title: 'Start Practicing', description: 'Take full mock exams or quick drills. Get instant scores with detailed explanations.', icon: <Zap className="h-6 w-6" /> },
              { step: '04', title: 'Track & Improve', description: 'Monitor your progress with analytics, fix weak spots, and watch your score climb.', icon: <TrendingUp className="h-6 w-6" /> },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center space-y-4 group">
                {/* Connector line */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-indigo-500/40 to-transparent" />
                )}
                <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-[16px] font-display font-bold text-white">{item.title}</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ANALYTICS PREVIEW
          ══════════════════════════════════════ */}
      <section className="relative py-24 z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[11px] font-semibold text-emerald-400">
                <BarChart3 className="h-3 w-3" />
                PERFORMANCE INSIGHTS
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                Know Exactly Where <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">You Stand</span>
              </h2>
              <p className="text-[15px] text-slate-400 leading-relaxed">
                Our analytics dashboard breaks down your performance by subject, topic, and difficulty level. See detailed statistics after every test — identify weak spots and focus your revision where it matters most.
              </p>
              <ul className="space-y-3">
                {[
                  'Per-subject score breakdowns',
                  'Time-per-question analysis',
                  'Difficulty-based performance trends',
                  'Progress tracking over time',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dashboard image */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-emerald-600/15 to-cyan-600/15 blur-2xl animate-glow-pulse" />
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/40 shadow-2xl">
                <img
                  src="/images/stats-dashboard.png"
                  alt="Performance Analytics Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PRICING SECTION
          ══════════════════════════════════════ */}
      <section id="pricing" className="relative py-24 z-10 border-t border-slate-800/40 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-6">
          <div ref={pricingRef.ref} className={`text-center max-w-3xl mx-auto mb-16 space-y-4 ${pricingRef.visible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-[11px] font-semibold text-amber-400 mb-4">
              TRANSPARENT PRICING
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Plans for Every Student
            </h2>
            <p className="text-[15px] text-slate-400 max-w-2xl mx-auto">
              Choose a monthly plan or pay per test. No hidden fees, no surprises — just results.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">

            {/* ── PLUS ── */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-8 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 group">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-[18px] font-display font-bold text-white">Plus</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-display font-extrabold text-white tracking-tight">₦3,500</span>
                  <span className="text-[13px] text-slate-400">/ month</span>
                </div>
                <p className="text-[12px] text-indigo-400 font-medium mb-6">1 test daily</p>

                <ul className="space-y-3.5 text-[13px] text-slate-300">
                  {[
                    { text: 'Full mock exam (4 subjects)', included: true },
                    { text: 'Detailed score reviews', included: true },
                    { text: 'Performance statistics', included: true },
                    { text: 'Step-by-step explanations', included: true },
                    { text: 'CBT Key access', included: true },
                    { text: 'AI conversational tutor', included: false },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      {item.included ? (
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      )}
                      <span className={item.included ? '' : 'text-slate-500'}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/auth?mode=register"
                className="mt-8 block w-full text-center rounded-xl border border-indigo-500/30 bg-indigo-500/5 py-3.5 text-[14px] font-bold text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all active:scale-95"
              >
                Get Plus
              </Link>
            </div>

            {/* ── PRO (Recommended) ── */}
            <div className="rounded-2xl border-2 border-violet-500/60 bg-slate-900/40 p-8 flex flex-col justify-between relative hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-violet-500/10">
              {/* Badge */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-lg shadow-violet-500/30">
                  ⭐ Most Popular
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6 mt-2">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-violet-400" />
                  </div>
                  <h3 className="text-[18px] font-display font-bold text-white">Pro</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-display font-extrabold text-white tracking-tight">₦6,000</span>
                  <span className="text-[13px] text-slate-400">/ month</span>
                </div>
                <p className="text-[12px] text-violet-400 font-medium mb-6">2 tests daily</p>

                <ul className="space-y-3.5 text-[13px] text-slate-300">
                  {[
                    { text: 'Full mock exams (4 subjects)', included: true },
                    { text: 'Detailed score reviews', included: true },
                    { text: 'Advanced performance statistics', included: true },
                    { text: 'Step-by-step explanations', included: true },
                    { text: 'CBT Key access', included: true },
                    { text: 'Subject-specific drills', included: true },
                    { text: 'AI conversational tutor', included: false },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      {item.included ? (
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-slate-600 flex-shrink-0" />
                      )}
                      <span className={item.included ? '' : 'text-slate-500'}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/auth?mode=register"
                className="mt-8 block w-full text-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-600/40 transition-all active:scale-95"
              >
                Get Pro
              </Link>
            </div>

            {/* ── MAX ── */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-8 flex flex-col justify-between hover:border-pink-500/30 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/20 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-display font-bold text-white">Max</h3>
                    <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider">+ AI Tutor</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-display font-extrabold text-white tracking-tight">₦14,000</span>
                  <span className="text-[13px] text-slate-400">/ month</span>
                </div>
                <p className="text-[12px] text-pink-400 font-medium mb-6">5 tests daily + AI Chat</p>

                <ul className="space-y-3.5 text-[13px] text-slate-300">
                  {[
                    'Full mock exams (4 subjects)',
                    'Detailed score reviews',
                    'Advanced performance statistics',
                    'Step-by-step explanations',
                    'CBT Key access',
                    'Subject-specific drills',
                    'AI conversational tutor ✨',
                    'Personalized study plans',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className={i === 6 ? 'text-pink-300 font-semibold' : ''}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/auth?mode=register"
                className="relative mt-8 block w-full text-center rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-pink-600/20 hover:from-pink-500 hover:to-violet-500 hover:shadow-pink-600/40 transition-all active:scale-95"
              >
                Get Max
              </Link>
            </div>
          </div>

          {/* Per-test pricing */}
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/20 p-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/50 px-4 py-1.5 text-[11px] font-semibold text-slate-300">
                <CreditCard className="h-3 w-3 text-slate-400" />
                PAY PER TEST
              </div>
              <h3 className="text-[22px] font-display font-bold text-white">
                No subscription? No problem.
              </h3>
              <p className="text-[14px] text-slate-400 max-w-md mx-auto">
                Pay only when you practice. Buy individual tests without any monthly commitment.
              </p>
              <div className="flex justify-center gap-6 pt-2">
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 px-6 py-4 text-center">
                  <div className="text-2xl font-display font-extrabold text-white">₦300</div>
                  <div className="text-[11px] text-slate-400 mt-1">per drill test</div>
                </div>
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 px-6 py-4 text-center">
                  <div className="text-2xl font-display font-extrabold text-white">₦500</div>
                  <div className="text-[11px] text-slate-400 mt-1">per mock exam</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA SECTION
          ══════════════════════════════════════ */}
      <section className="relative py-24 z-10">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white leading-tight">
            Ready to Score <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">300+</span> in JAMB?
          </h2>
          <p className="text-[16px] text-slate-400 max-w-xl mx-auto">
            Join over 100,000 Nigerian students already using the most advanced UTME preparation platform. Your journey to university starts here.
          </p>
          <Link
            to="/auth?mode=register"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-10 py-5 text-[16px] font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-600/50 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            Start Practicing Now — It's Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
          ══════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">

            {/* Brand column */}
            <div className="md:col-span-1 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-display font-bold text-[13px] text-white shadow-lg shadow-indigo-500/20">
                  CBT
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-display font-bold text-white leading-tight">JAMB UTME Prep</span>
                  <span className="text-[10px] text-slate-500 leading-tight">by Aurikex</span>
                </div>
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Nigeria's most advanced Computer-Based Test simulator, built to help every student achieve their dream UTME score.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { icon: <Twitter className="h-4 w-4" />, href: 'https://x.com/aurikrex', label: 'Twitter / X' },
                  { icon: <Instagram className="h-4 w-4" />, href: 'https://www.instagram.com/falcon.omotosho', label: 'Instagram' },
                  { icon: <Linkedin className="h-4 w-4" />, href: 'https://linkedin.com/in/falcon-omotosho', label: 'LinkedIn' },
                  { icon: <Youtube className="h-4 w-4" />, href: 'https://www.youtube.com/@aurikrex', label: 'YouTube' },
                  { icon: <Globe className="h-4 w-4" />, href: 'https://www.tiktok.com/@aurikrexacademy', label: 'TikTok' },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-500 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all duration-200"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Product links */}
            <div className="space-y-4">
              <h4 className="text-[13px] font-display font-bold text-white uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-[12px] text-slate-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#subjects" className="hover:text-white transition-colors">Subjects</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Support links */}
            <div className="space-y-4">
              <h4 className="text-[13px] font-display font-bold text-white uppercase tracking-wider">Support</h4>
              <ul className="space-y-3 text-[12px] text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            {/* Contact info */}
            <div className="space-y-4">
              <h4 className="text-[13px] font-display font-bold text-white uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-[12px] text-slate-500">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-600" />
                  <a href="mailto:hello@aurikex.com" className="hover:text-white transition-colors">hello@aurikex.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-600" />
                  <a href="tel:+2348000000000" className="hover:text-white transition-colors">+234 800 000 0000</a>
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-slate-600" />
                  <a href="#" className="hover:text-white transition-colors">www.aurikex.com</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[11px] text-slate-600 text-center md:text-left space-y-1">
              <p>© {new Date().getFullYear()} JAMB CBT Prep. All rights reserved.</p>
              <p>
                Founded by <span className="text-slate-400 font-medium">Omotosho Korede Samuel</span> · A product of <span className="text-slate-400 font-medium">Aurikex</span>
              </p>
            </div>
            <div className="flex items-center gap-6 text-[11px] text-slate-600">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
