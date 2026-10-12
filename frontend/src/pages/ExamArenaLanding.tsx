import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crosshair,
  Gauge,
  Menu,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const subjects = [
  ['English', '78%', 'stable'],
  ['Mathematics', '64%', 'fragile'],
  ['Physics', '52%', 'critical'],
  ['Chemistry', '81%', 'stable'],
];

const missions = [
  { label: 'Repair Mission', title: 'Newton’s Laws', meta: '12 questions · 8 min', tone: 'amber', icon: Crosshair },
  { label: 'Quick Sprint', title: 'Use of English', meta: '5 questions · 3 min', tone: 'blue', icon: Zap },
  { label: 'Live Arena', title: 'Find an opponent', meta: 'Beta Test Arena', tone: 'violet', icon: Swords },
];

const loopSteps: Array<{ number: string; title: string; text: string; Icon: LucideIcon }> = [
  { number: '01', title: 'Attempt', text: 'Take a realistic mock or a focused sprint.', Icon: Crosshair },
  { number: '02', title: 'Diagnose', text: 'See whether the miss was knowledge, timing, or confidence.', Icon: BrainCircuit },
  { number: '03', title: 'Repair', text: 'Run a small mission built around the exact weakness.', Icon: Zap },
  { number: '04', title: 'Stabilise', text: 'Re-test and watch the weak zone turn reliable.', Icon: CheckCircle2 },
];

export default function ExamArenaLanding() {
  const orbitDots = useMemo(() => Array.from({ length: 22 }, (_, index) => index), []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="exam-arena-landing min-h-screen overflow-hidden bg-bg-primary text-text-primary selection:bg-accent-royal-blue selection:text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40 dark:opacity-60 [background-image:linear-gradient(rgba(148,163,184,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.12) 1px,transparent 1px)] [background-size:54px_54px]" />
      <div className="pointer-events-none fixed left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-accent-royal-blue/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-18rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-tertiary/10 blur-[140px]" />

      <header className="relative z-20 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Aurikrex Exam Arena home">
            <img src="/favicon.svg" alt="" className="h-10 w-10 shrink-0 rounded-2xl object-cover shadow-[0_10px_24px_rgba(74,91,255,0.28)]" />
            <span>
              <span className="block text-sm font-black tracking-[.16em] text-text-primary">Aurikrex Exam Arena</span>
              <span className="block text-xs font-bold uppercase tracking-[.28em] text-secondary">by Aurikrex</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-semibold text-text-secondary md:flex">
            <a href="#system" className="transition hover:text-text-primary">How it works</a>
            <a href="#missions" className="transition hover:text-text-primary">Training modes</a>
            <a href="#arena" className="transition hover:text-text-primary">Arena</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle className="min-h-9 min-w-9" />
            <Link to="/auth?mode=login" className="hidden text-xs font-bold text-text-secondary transition hover:text-text-primary sm:block">Sign in</Link>
            <Link to="/auth?mode=register" className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-primary/90">Enter Arena</Link>
            <button
              type="button"
              className="rounded-lg p-1 text-text-secondary transition hover:bg-surface-container hover:text-text-primary md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-border bg-bg-primary/95 px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-2 text-sm text-text-secondary">
              <a href="#system" className="rounded-lg px-2 py-2 transition hover:bg-surface-container hover:text-text-primary" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a href="#missions" className="rounded-lg px-2 py-2 transition hover:bg-surface-container hover:text-text-primary" onClick={() => setMobileMenuOpen(false)}>Training modes</a>
              <a href="#arena" className="rounded-lg px-2 py-2 transition hover:bg-surface-container hover:text-text-primary" onClick={() => setMobileMenuOpen(false)}>Arena</a>
              <Link to="/auth?mode=login" className="rounded-lg px-2 py-2 transition hover:bg-surface-container hover:text-text-primary" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 md:grid-cols-[1.04fr_.96fr] md:pb-28 md:pt-24">
          <div>
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[.1em] sm:tracking-[.18em] text-secondary"><Sparkles className="h-3.5 w-3.5 shrink-0" /> <span className="truncate sm:overflow-visible">The intelligent JAMB training system</span></div>
            <h1 className="max-w-3xl text-3xl xs:text-4xl sm:text-6xl lg:text-[76px] font-black leading-[1.05] sm:leading-[.98] tracking-[-.055em] text-text-primary">Don’t just take tests.<br /><span className="bg-gradient-to-r from-primary via-accent-royal-blue to-secondary bg-clip-text text-transparent">Train for the moment.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-text-secondary sm:text-lg">Aurikrex turns every JAMB attempt into a clear next move. Diagnose the mistake, repair the weak topic, and return stronger—under real exam pressure.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth?mode=register" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-primary/90">Build my readiness map <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
              <a href="#system" className="inline-flex items-center justify-center gap-3 rounded-2xl border border-border bg-surface-container px-6 py-4 text-sm font-bold text-text-primary transition hover:bg-surface-container-high">See the system <ChevronRight className="h-4 w-4" /></a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-text-muted"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-tertiary" /> Secure by design</span><span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-secondary" /> 17 JAMB subjects</span><span className="inline-flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-accent-ai-gold" /> FalkeAI coach</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]" aria-label="Exam Arena readiness map preview">
            <div className="absolute inset-8 rounded-full border border-secondary/20 shadow-[0_0_100px_rgba(2,132,199,.12)]" />
            <div className="absolute inset-20 rounded-full border border-dashed border-secondary/20" />
            {orbitDots.map((dot) => <span key={dot} className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-secondary/60" style={{ transform: `rotate(${dot * 16.36}deg) translateY(-${165 + (dot % 4) * 18}px)` }} />)}
            <div className="flight-deck-card relative rounded-[2rem] border border-border bg-surface-container/95 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between border-b border-border pb-5"><div><div className="text-xs font-bold uppercase tracking-[.2em] text-text-muted">Candidate flight deck</div><div className="mt-1 text-xl font-black text-text-primary">Good evening, David.</div></div><div className="rounded-full border border-tertiary/30 bg-tertiary/10 px-2.5 py-1 text-xs font-bold text-tertiary">ON COURSE</div></div>
              <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-6"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-text-muted">Readiness score</div><div className="mt-1 text-6xl font-black tracking-[-.06em] text-text-primary">68<span className="text-2xl text-text-muted">/100</span></div><div className="mt-2 flex items-center gap-2 text-xs font-semibold text-tertiary"><TrendingUpIcon /> +12 this month</div></div><div className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: 'conic-gradient(var(--secondary, #7bd0ff) 68%, var(--surface-container-high, rgba(148,163,184,.12)) 0)' }}><div className="grid h-20 w-20 place-items-center rounded-full bg-surface-container text-center"><Gauge className="mx-auto h-5 w-5 text-secondary" /><span className="mt-1 block text-xs font-black uppercase tracking-widest text-text-muted">Ready</span></div></div></div>
              <div className="mt-7 rounded-2xl border border-accent-ai-gold/30 bg-accent-ai-gold/10 p-4"><div className="flex items-start gap-3"><Crosshair className="mt-0.5 h-4 w-4 text-accent-ai-gold" /><div><div className="text-xs font-bold uppercase tracking-[.18em] text-accent-ai-gold">Next best move</div><div className="mt-1 text-sm font-bold text-text-primary">Repair Newton’s Laws</div><div className="mt-1 text-xs text-text-secondary">12 questions · estimated +4 readiness points</div></div><ArrowRight className="ml-auto h-4 w-4 text-accent-ai-gold" /></div></div>
              <div className="mt-6 grid grid-cols-2 gap-2">{subjects.map(([name, score, tone]) => <div key={name} className="rounded-xl border border-border bg-surface-container-low p-3"><div className="flex items-center justify-between text-xs font-bold text-text-secondary"><span>{name}</span><span className={tone === 'critical' ? 'text-accent-streak-rose' : tone === 'fragile' ? 'text-accent-ai-gold' : 'text-tertiary'}>{score}</span></div><div className="mt-2 h-1 rounded-full bg-surface-container-high"><div className={`h-1 rounded-full ${tone === 'critical' ? 'bg-accent-streak-rose' : tone === 'fragile' ? 'bg-accent-ai-gold' : 'bg-tertiary'}`} style={{ width: score }} /></div></div>)}</div>
            </div>
          </div>
        </section>

        <section id="system" className="border-y border-border bg-surface-container-low/50 px-5 py-16 sm:px-8 md:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><div className="text-xs font-bold uppercase tracking-[.2em] text-secondary">The loop that compounds</div><h2 className="mt-3 text-3xl font-black tracking-tight text-text-primary sm:text-4xl">Every mistake becomes a route forward.</h2><p className="mt-4 text-sm leading-7 text-text-secondary">Most platforms show you a score. Exam Arena shows you what the score means—and what to do next.</p></div><div className="mt-10 grid gap-4 md:grid-cols-4">{loopSteps.map(({ number, title, text, Icon }) => <div key={number} className="arena-card rounded-2xl border border-border bg-surface-container p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-secondary">{number}</span><Icon className="h-5 w-5 text-text-muted" /></div><h3 className="mt-10 text-lg font-black text-text-primary">{title}</h3><p className="mt-2 text-xs leading-6 text-text-secondary">{text}</p></div>)}</div></div></section>

        <section id="missions" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="text-xs font-bold uppercase tracking-[.2em] text-primary">Choose your pressure</div><h2 className="mt-3 text-3xl font-black tracking-tight text-text-primary sm:text-4xl">Three ways to get better.</h2></div><Link to="/auth?mode=register" className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:underline">Start a free session <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{missions.map(({ label, title, meta, tone, icon: Icon }) => <Link to="/auth?mode=register" key={title} className={`arena-card group rounded-3xl border border-border bg-surface-container p-6 transition hover:-translate-y-1 hover:border-primary/40 shadow-sm ${tone === 'amber' ? 'hover:shadow-amber-500/10' : tone === 'blue' ? 'hover:shadow-blue-500/10' : 'hover:shadow-purple-500/10'}`}><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.2em] text-text-muted">{label}</span><Icon className="h-5 w-5 text-text-secondary" /></div><h3 className="mt-16 text-xl font-black text-text-primary">{title}</h3><div className="mt-2 flex items-center gap-2 text-xs text-text-secondary"><Clock3 className="h-3.5 w-3.5" /> {meta}</div><div className="mt-7 flex items-center gap-2 text-xs font-bold text-primary">Enter mode <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></Link>)}</div></section>

        <section id="arena" className="mx-auto mb-16 max-w-7xl px-5 sm:px-8"><div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10 p-7 sm:p-10 md:p-14"><div className="relative z-10 max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container-high px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-primary"><Trophy className="h-3.5 w-3.5" /> Live Arena</div><h2 className="mt-5 text-3xl font-black tracking-tight text-text-primary sm:text-4xl">Your preparation has a pulse.</h2><p className="mt-4 text-sm leading-7 text-text-secondary">Compete in short, fair matches when you are ready. Earn confidence from performance—not from a meaningless streak.</p><Link to="/auth?mode=register" className="mt-7 inline-flex items-center gap-3 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-primary/90">Enter the Arena <ArrowRight className="h-4 w-4" /></Link></div><div className="pointer-events-none absolute -right-8 -top-12 hidden h-80 w-80 rounded-full border border-secondary/15 md:block"><div className="absolute inset-8 rounded-full border border-secondary/15" /><div className="absolute inset-20 rounded-full border border-dashed border-secondary/20" /><div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary shadow-[0_0_35px_12px_rgba(2,132,199,.35)]" /></div></div></section>
      </main>
      <footer className="border-t border-border px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-text-muted sm:flex-row"><span>© {new Date().getFullYear()} Aurikrex Exam Arena</span><span>Built for the learner behind the score.</span></div></footer>
    </div>
  );
}

function TrendingUpIcon() {
  return <span className="inline-block text-base leading-none">↗</span>;
}
