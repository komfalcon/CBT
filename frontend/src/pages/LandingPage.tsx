import { Link } from 'react-router-dom';
import { BookOpen, Award, Zap, Shield, HelpCircle, ArrowRight, UserCheck, Layers } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden relative">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              CBT
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              JAMB UTME Prep
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#subjects" className="hover:text-white transition-colors">Subjects</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/auth?mode=register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-600/40 transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-7xl px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md">
            <Zap className="h-3 w-3 text-indigo-400 animate-pulse" />
            Empowering Over 100,000+ Nigerian Students
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent leading-none">
            Master the JAMB UTME <br />
            With Our Premium Simulator
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400">
            Experience a precise replica of the computer-based exam environment. Solve over 50,000+ subject curriculum questions curated by advanced systems with complete explanations.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/auth?mode=register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm px-8 py-4 text-base font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition-all transform hover:-translate-y-0.5"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Engineered for Score Excellence
            </h2>
            <p className="text-slate-400">
              We provide tools designed specifically to help you score above 300+ in your JAMB UTME.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-8 hover:border-indigo-500/40 transition-all duration-300 hover:bg-slate-900/50 group">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Detailed Explanations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every practice question features complete step-by-step solutions, using full LaTeX math formatting to keep formulas clean and readable.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-8 hover:border-violet-500/40 transition-all duration-300 hover:bg-slate-900/50 group">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Vector Duplicate Protection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Advanced tokenized similarity checkers ensure that all practice mock exams contain fresh, unique questions, avoiding boring repeats.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-8 hover:border-pink-500/40 transition-all duration-300 hover:bg-slate-900/50 group">
              <div className="h-12 w-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Device-Roaming CBT Keys</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Access your account at any local cyber cafe or training center using a unique CBT Key. No password required for quick login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subject Section */}
      <section id="subjects" className="py-20 border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              All Major JAMB Subjects Covered
            </h2>
            <p className="text-slate-400">
              Practice questions across the entire official JAMB syllabus with updated topics and subtopics.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Use of English', code: 'Compulsory' },
              { name: 'Mathematics', code: 'Calculus, Algebra' },
              { name: 'Physics', code: 'Mechanics, Waves' },
              { name: 'Chemistry', code: 'Organic, Physical' },
              { name: 'Biology', code: 'Anatomy, Genetics' },
              { name: 'Economics', code: 'Macro, Micro' },
              { name: 'Government', code: 'Politics, History' },
              { name: 'Literature in English', code: 'Drama, Prose' },
              { name: 'Commerce', code: 'Trade, Finance' },
              { name: 'Principles of Accounts', code: 'Bookkeeping' },
              { name: 'Agricultural Science', code: 'Agronomy, Livestock' },
              { name: 'Geography', code: 'Physical, Human' },
            ].map((sub, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 hover:bg-slate-900/50 transition-colors">
                <div className="text-sm font-semibold text-white mb-1">{sub.name}</div>
                <div className="text-xs text-indigo-400">{sub.code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Affordable Plans for Every Student
            </h2>
            <p className="text-slate-400">
              No hidden fees. Pay once and practice with premium features until your exam day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-300">Basic Demo</h3>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-extrabold tracking-tight">₦0</span>
                  <span className="ml-1 text-sm text-slate-400">/ forever</span>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  Try out the CBT platform with limited sample subjects and test formats.
                </p>
                <ul className="mt-6 space-y-4 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Access to 50 sample questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Basic score results</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>MFA & profile setup</span>
                  </li>
                </ul>
              </div>
              <Link to="/auth?mode=register" className="mt-8 block w-full text-center rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors">
                Start Free Practice
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-slate-900/40 p-8 flex flex-col justify-between relative">
              <div className="absolute top-0 right-6 transform -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">UTME Premium Access</h3>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-extrabold tracking-tight">₦3,500</span>
                  <span className="ml-1 text-sm text-indigo-300">/ one-time</span>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  Full, unrestricted access to the entire CBT database, statistics, and simulation modes.
                </p>
                <ul className="mt-6 space-y-4 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <span className="font-semibold text-indigo-200">50,000+ Subject Questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <span>Full 4-Subject Mock Exams with timers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <span>Detailed LaTeX step-by-step answers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <span>Unique CBT Access Key for cafe roaming</span>
                  </li>
                </ul>
              </div>
              <Link to="/auth?mode=register" className="mt-8 block w-full text-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 transition-colors">
                Unlock Premium Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 text-center text-xs text-slate-500 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} JAMB CBT platform. Built for Nigerian UTME success.</p>
          <div className="flex gap-6">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#subjects" className="hover:underline">Subjects</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
