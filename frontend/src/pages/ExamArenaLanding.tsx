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

const subjects = [
  ['English', '78%', 'stable'],
  ['Mathematics', '64%', 'fragile'],
  ['Physics', '52%', 'critical'],
  ['Chemistry', '81%', 'stable'],
];

const missions = [
  { label: 'Repair Mission', title: 'Newton’s Laws', meta: '12 questions · 8 min', tone: 'amber', icon: Crosshair },
  { label: 'Quick Sprint', title: 'Use of English', meta: '5 questions · 3 min', tone: 'blue', icon: Zap },
  { label: 'Live Arena', title: 'Find an opponent', meta: '2,481 learners online', tone: 'violet', icon: Swords },
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
    <div className="min-h-screen overflow-hidden bg-[#07111f] text-slate-100 selection:bg-cyan-300 selection:text-[#07111f]">
      <div className="pointer-events-none fixed inset-0 opacity-60 [background-image:linear-gradient(rgba(148,163,184,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.07) 1px,transparent 1px)] [background-size:54px_54px]" />
      <div className="pointer-events-none fixed left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-cyan-400/15 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-18rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-violet-500/15 blur-[140px]" />

      <header className="relative z-20 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Aurikrex Exam Arena home">
            <img src="/favicon.svg" alt="" className="h-10 w-10 shrink-0 rounded-2xl object-cover shadow-[0_10px_24px_rgba(74,91,255,0.28)]" />
            <span>
              <span className="block text-sm font-black tracking-[.16em] text-white">EXAM ARENA</span>
              <span className="block text-xs font-bold uppercase tracking-[.28em] text-cyan-300/70">by Aurikrex</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-semibold text-slate-400 md:flex">
            <a href="#system" className="transition hover:text-white">How it works</a>
            <a href="#missions" className="transition hover:text-white">Training modes</a>
            <a href="#arena" className="transition hover:text-white">Arena</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth?mode=login" className="hidden text-xs font-bold text-slate-300 transition hover:text-white sm:block">Sign in</Link>
            <Link to="/auth?mode=register" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-[#07111f] shadow-[0_0_28px_rgba(103,232,249,.22)] transition hover:bg-cyan-200">Enter Arena</Link>
            <button
              type="button"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#07111f]/95 px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-2 text-sm text-slate-300">
              <a href="#system" className="rounded-lg px-2 py-2 transition hover:bg-white/5 hover:text-white" onClick={() => setMobileMenuOpen(false)}>How it works</a>
              <a href="#missions" className="rounded-lg px-2 py-2 transition hover:bg-white/5 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Training modes</a>
              <a href="#arena" className="rounded-lg px-2 py-2 transition hover:bg-white/5 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Arena</a>
              <Link to="/auth?mode=login" className="rounded-lg px-2 py-2 transition hover:bg-white/5 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 md:grid-cols-[1.04fr_.96fr] md:pb-28 md:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> The intelligent JAMB training system</div>
            <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] text-white sm:text-6xl lg:text-[76px]">Don’t just take tests.<br /><span className="bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">Train for the moment.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">Aurikrex turns every JAMB attempt into a clear next move. Diagnose the mistake, repair the weak topic, and return stronger—under real exam pressure.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth?mode=register" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black text-[#07111f] transition hover:-translate-y-0.5 hover:bg-cyan-200">Build my readiness map <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
              <a href="#system" className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[.04] px-6 py-4 text-sm font-bold text-slate-200 transition hover:bg-white/[.08]">See the system <ChevronRight className="h-4 w-4" /></a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Secure by design</span><span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-cyan-300" /> 17 JAMB subjects</span><span className="inline-flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-violet-300" /> Falke AI coach</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]" aria-label="Exam Arena readiness map preview">
            <div className="absolute inset-8 rounded-full border border-cyan-200/10 shadow-[0_0_100px_rgba(34,211,238,.12)]" />
            <div className="absolute inset-20 rounded-full border border-dashed border-cyan-200/15" />
            {orbitDots.map((dot) => <span key={dot} className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-cyan-200/60" style={{ transform: `rotate(${dot * 16.36}deg) translateY(-${165 + (dot % 4) * 18}px)` }} />)}
            <div className="relative rounded-[2rem] border border-white/15 bg-[#0c1a2c]/90 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Candidate flight deck</div><div className="mt-1 text-xl font-black text-white">Good evening, David.</div></div><div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-200">ON COURSE</div></div>
              <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-6"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Readiness score</div><div className="mt-1 text-6xl font-black tracking-[-.06em] text-white">68<span className="text-2xl text-slate-500">/100</span></div><div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-300"><TrendingUpIcon /> +12 this month</div></div><div className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: 'conic-gradient(#67e8f9 68%, rgba(148,163,184,.12) 0)' }}><div className="grid h-20 w-20 place-items-center rounded-full bg-[#0c1a2c] text-center"><Gauge className="mx-auto h-5 w-5 text-cyan-200" /><span className="mt-1 block text-xs font-black uppercase tracking-widest text-slate-500">Ready</span></div></div></div>
              <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/[.07] p-4"><div className="flex items-start gap-3"><Crosshair className="mt-0.5 h-4 w-4 text-amber-200" /><div><div className="text-xs font-black uppercase tracking-[.18em] text-amber-200/80">Next best move</div><div className="mt-1 text-sm font-bold text-white">Repair Newton’s Laws</div><div className="mt-1 text-xs text-slate-400">12 questions · estimated +4 readiness points</div></div><ArrowRight className="ml-auto h-4 w-4 text-amber-200" /></div></div>
              <div className="mt-6 grid grid-cols-2 gap-2">{subjects.map(([name, score, tone]) => <div key={name} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center justify-between text-xs font-bold text-slate-400"><span>{name}</span><span className={tone === 'critical' ? 'text-rose-300' : tone === 'fragile' ? 'text-amber-200' : 'text-emerald-300'}>{score}</span></div><div className="mt-2 h-1 rounded-full bg-white/10"><div className={`h-1 rounded-full ${tone === 'critical' ? 'bg-rose-300' : tone === 'fragile' ? 'bg-amber-200' : 'bg-emerald-300'}`} style={{ width: score }} /></div></div>)}</div>
            </div>
          </div>
        </section>

        <section id="system" className="border-y border-white/10 bg-white/[.025] px-5 py-16 sm:px-8 md:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><div className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">The loop that compounds</div><h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Every mistake becomes a route forward.</h2><p className="mt-4 text-sm leading-7 text-slate-400">Most platforms show you a score. Exam Arena shows you what the score means—and what to do next.</p></div><div className="mt-10 grid gap-4 md:grid-cols-4">{loopSteps.map(({ number, title, text, Icon }) => <div key={number} className="rounded-2xl border border-white/10 bg-[#0c1a2c]/70 p-5"><div className="flex items-center justify-between"><span className="text-xs font-black text-cyan-300">{number}</span><Icon className="h-5 w-5 text-slate-500" /></div><h3 className="mt-10 text-lg font-black text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{text}</p></div>)}</div></div></section>

        <section id="missions" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="text-xs font-black uppercase tracking-[.2em] text-violet-300">Choose your pressure</div><h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Three ways to get better.</h2></div><Link to="/auth?mode=register" className="inline-flex items-center gap-2 text-xs font-black text-cyan-200">Start a free session <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{missions.map(({ label, title, meta, tone, icon: Icon }) => <Link to="/auth?mode=register" key={title} className={`group rounded-3xl border p-6 transition hover:-translate-y-1 ${tone === 'amber' ? 'border-amber-200/20 bg-amber-200/[.06]' : tone === 'blue' ? 'border-cyan-200/20 bg-cyan-200/[.05]' : 'border-violet-200/20 bg-violet-200/[.06]'}`}><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{label}</span><Icon className="h-5 w-5 text-slate-300" /></div><h3 className="mt-16 text-xl font-black text-white">{title}</h3><div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" /> {meta}</div><div className="mt-7 flex items-center gap-2 text-xs font-black text-white">Enter mode <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></Link>)}</div></section>

        <section id="arena" className="mx-auto mb-16 max-w-7xl px-5 sm:px-8"><div className="relative overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-gradient-to-br from-cyan-300/10 via-[#0c1a2c] to-violet-400/10 p-7 sm:p-10 md:p-14"><div className="relative z-10 max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-cyan-100"><Trophy className="h-3.5 w-3.5" /> Live Arena</div><h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Your preparation has a pulse.</h2><p className="mt-4 text-sm leading-7 text-slate-300">Compete in short, fair matches when you are ready. Earn confidence from performance—not from a meaningless streak.</p><Link to="/auth?mode=register" className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-xs font-black text-[#07111f]">Enter the Arena <ArrowRight className="h-4 w-4" /></Link></div><div className="pointer-events-none absolute -right-8 -top-12 hidden h-80 w-80 rounded-full border border-cyan-200/15 md:block"><div className="absolute inset-8 rounded-full border border-cyan-200/15" /><div className="absolute inset-20 rounded-full border border-dashed border-cyan-200/20" /><div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_35px_12px_rgba(103,232,249,.45)]" /></div></div></section>
      </main>
      <footer className="border-t border-white/10 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-slate-500 sm:flex-row"><span>© {new Date().getFullYear()} Aurikrex Exam Arena</span><span>Built for the learner behind the score.</span></div></footer>
    </div>
  );
}

function TrendingUpIcon() {
  return <span className="inline-block text-base leading-none">↗</span>;
}
