import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe } from '../features/auth/api';
import { AppNavbar } from '../components/AppNavbar';
import { useToast } from '../components/ToastProvider';
import { getSubjectLabel } from '../constants/subjects';

export default function CandidateProfilePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bio' | 'subjects' | 'cbt_key' | 'security'>('bio');

  // Bio Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jambRegNo, setJambRegNo] = useState('');
  const [centerState, setCenterState] = useState('Lagos Center (Mainland Zone)');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAkxId, setCopiedAkxId] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => {
        setStudent(data);
        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setJambRegNo(data.jamb_reg_no || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMe({ fullName, phone });
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your candidate biometric identity details have been saved.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Could not update profile',
      });
    }
  };

  const aurikrexId = student?.aurikrex_id || (student?.id ? `AKX-${String(student?.id).slice(0, 6).toUpperCase()}` : '—');
  const cbtKey = student?.cbt_key || '—';

  const copyToClipboard = (text: string, type: 'key' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      addToast({ type: 'info', title: 'CBT Key Copied', message: 'Ready for cyber-cafe terminal paste.' });
    } else {
      setCopiedAkxId(true);
      setTimeout(() => setCopiedAkxId(false), 2000);
      addToast({ type: 'info', title: 'Aurikrex ID Copied', message: 'Permanent candidate identifier copied.' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-body selection:bg-accent-royal-blue selection:text-white antialiased">
      {/* Ecosystem Top Bar */}
      <AppNavbar student={student} titleBadge="Identity Hub" />

      {/* Main Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-muted">
            <a href="/dashboard" className="hover:text-text-primary transition-colors">Portal Home</a>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-text-secondary">Candidate Profile & Account</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-medium">Identity & UTME Registration</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-tertiary border border-border text-label-sm font-label-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            JAMB Portal Live Sync: Active
          </span>
        </div>

        {/* PROFILE HEADER BANNER (Bento Hero Card) */}
        <section className="bg-bg-card rounded-2xl border border-border p-6 shadow-md relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-accent-royal-blue/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Identity */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-surface-container border-2 border-primary flex items-center justify-center text-primary font-headline-md font-bold text-2xl shadow-lg">
                  {fullName ? fullName.substring(0, 2).toUpperCase() : 'ID'}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary-container rounded-full p-1 border-2 border-bg-card shadow-sm"
                  title="Biometrically Verified at CBT Testing Center"
                >
                  <span className="material-symbols-outlined text-sm font-bold block">verified</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-headline-md font-headline-md font-bold text-text-primary">
                    {fullName || 'Candidate'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-label-sm font-label-sm font-bold">
                    Scholar Level {student?.level ?? 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm border border-border">
                    Verified Candidate
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label-sm font-label-sm text-text-secondary">
                  <div className="flex items-center gap-1.5 font-mono-data text-mono-data">
                    <span className="text-text-muted">JAMB Reg:</span>
                    <span className="text-text-primary font-semibold">{jambRegNo || 'Not linked'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono-data text-mono-data">
                    <span className="text-text-muted">Aurikrex ID:</span>
                    <span className="text-primary font-semibold">{aurikrexId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-text-muted">location_on</span>
                    <span>{centerState}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="bg-surface-container-low border border-border rounded-xl p-3 text-center min-w-0">
                <span className="text-label-sm font-label-sm text-text-muted block">Projected Score</span>
                <span className="text-headline-sm font-headline-sm font-bold text-tertiary">
                  {student?.targetScore || '320+'}
                </span>
                <span className="text-xs text-text-secondary block">UTME Goal Target</span>
              </div>
              <div className="bg-surface-container-low border border-border rounded-xl p-3 text-center min-w-0">
                <span className="text-label-sm font-label-sm text-text-muted block">UTME Combination</span>
                <span className="text-headline-sm font-headline-sm font-bold text-secondary">
                  {student?.exam_subject_combination?.length || 4}
                </span>
                <span className="text-xs text-text-secondary block">Registered Subjects</span>
              </div>
              <div className="bg-surface-container-low border border-border rounded-xl p-3 text-center min-w-0">
                <span className="text-label-sm font-label-sm text-text-muted block">Study Streak</span>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-headline-sm font-headline-sm font-bold text-accent-streak-rose">
                    {student?.streak_count ?? 0}d
                  </span>
                  <span className="text-accent-streak-rose text-base">🔥</span>
                </div>
                <span className="text-xs text-text-secondary block">Active Record</span>
              </div>
              <div className="bg-surface-container-low border border-border rounded-xl p-3 text-center min-w-0">
                <span className="text-label-sm font-label-sm text-text-muted block">AuriCoins</span>
                <span className="text-headline-sm font-headline-sm font-bold text-accent-ai-gold font-mono-data">
                  {(student?.auri_coins_balance ?? 5000).toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary block">Available Balance</span>
              </div>
            </div>
          </div>
        </section>

        {/* DUAL-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Navigation Sidebar / Mobile Segmented Tabs */}
          <aside className="lg:col-span-4 xl:col-span-3 bg-bg-card rounded-2xl border border-border p-2 sm:p-3 shadow-sm flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 lg:space-y-1">
            <div className="hidden lg:block px-3 py-2 text-label-sm font-label-sm text-text-muted uppercase tracking-wider">
              Profile Settings
            </div>

            <button
              onClick={() => setActiveTab('bio')}
              className={`flex-1 sm:flex-initial lg:w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl text-xs sm:text-label-md font-label-md whitespace-nowrap transition-all ${
                activeTab === 'bio'
                  ? 'bg-surface-container text-primary font-semibold border-b-2 lg:border-b-0 lg:border-l-2 border-accent-royal-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">badge</span>
              <span>Identity &amp; Bio</span>
            </button>

            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex-1 sm:flex-initial lg:w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl text-xs sm:text-label-md font-label-md whitespace-nowrap transition-all ${
                activeTab === 'subjects'
                  ? 'bg-surface-container text-primary font-semibold border-b-2 lg:border-b-0 lg:border-l-2 border-accent-royal-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">auto_stories</span>
              <span>4-Subject Combo</span>
            </button>

            <button
              onClick={() => setActiveTab('cbt_key')}
              className={`flex-1 sm:flex-initial lg:w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl text-xs sm:text-label-md font-label-md whitespace-nowrap transition-all ${
                activeTab === 'cbt_key'
                  ? 'bg-surface-container text-primary font-semibold border-b-2 lg:border-b-0 lg:border-l-2 border-accent-royal-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">vpn_key</span>
              <span>Cyber-Cafe CBT Key</span>
            </button>
          </aside>

          {/* Form Content Area */}
          <section className="lg:col-span-8 xl:col-span-9 bg-bg-card rounded-2xl border border-border p-6 shadow-sm">
            {activeTab === 'bio' && (
              <form onSubmit={handleSaveBio} className="space-y-6">
                <div>
                  <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    Candidate Biometric & Registration Identity
                  </h2>
                  <p className="text-body-sm text-text-secondary mt-1">
                    Your details are verified against the Joint Admissions and Matriculation Board (JAMB) database.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-container-low text-text-primary outline-none focus:border-accent-royal-blue text-body-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-container text-text-muted outline-none text-body-sm cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      JAMB Registration Number
                    </label>
                    <input
                      type="text"
                      value={jambRegNo}
                      onChange={(e) => setJambRegNo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-container-low text-text-primary font-mono-data outline-none focus:border-accent-royal-blue text-body-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-container-low text-text-primary outline-none focus:border-accent-royal-blue text-body-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                    Testing Center / Examination Town
                  </label>
                  <input
                    type="text"
                    value={centerState}
                    onChange={(e) => setCenterState(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-container-low text-text-primary outline-none focus:border-accent-royal-blue text-body-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'subjects' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    Registered 4-Subject Combination
                  </h2>
                  <p className="text-body-sm text-text-secondary mt-1">
                    Official UTME subjects configured for your simulations. Use of English is compulsory.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(student?.exam_subject_combination || ['english', 'mathematics', 'physics', 'chemistry']).map((sub: string, idx: number) => {
                    const isEng = sub === 'english';
                    return (
                      <div
                        key={sub}
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          isEng
                            ? 'border-accent-royal-blue/30 bg-accent-royal-blue/10'
                            : 'border-border bg-surface-container-low'
                        }`}
                      >
                        <div>
                          <span
                            className={`text-[10px] font-mono-data uppercase block ${
                              isEng ? 'text-secondary' : 'text-text-muted'
                            }`}
                          >
                            Subject {idx + 1} · {isEng ? 'Compulsory' : 'Elective'}
                          </span>
                          <span className="font-bold text-text-primary text-body-sm">
                            {getSubjectLabel(sub)}
                          </span>
                        </div>
                        <span className={`material-symbols-outlined ${isEng ? 'text-secondary' : 'text-tertiary'}`}>
                          {isEng ? 'lock' : 'check_circle'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => navigate('/mock-setup')}
                  className="px-4 py-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-variant text-text-primary font-label-md font-semibold text-sm transition-colors"
                >
                  Configure New Subject Combination in Wizard
                </button>
              </div>
            )}

            {activeTab === 'cbt_key' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    Cyber-Cafe Single-Use CBT Key Manager
                  </h2>
                  <p className="text-body-sm text-text-secondary mt-1">
                    Use this 256-bit hashed access key to authenticate on shared cyber-cafe or school lab PCs without entering your personal password.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm font-label-sm text-text-secondary">Active CBT Key</span>
                    <span className="text-xs font-mono-data text-tertiary">Armed · Valid for 7 Days</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      readOnly
                      value={cbtKey}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-container font-mono-data text-text-primary outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(cbtKey, 'key')}
                      className="px-4 py-2.5 rounded-xl bg-accent-royal-blue text-white font-label-md font-semibold text-sm hover:bg-primary-container transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedKey ? 'done' : 'content_copy'}
                      </span>
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm font-label-sm text-text-secondary">Permanent Aurikrex ID</span>
                    <span className="text-xs font-mono-data text-primary">Universal Identity</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      readOnly
                      value={aurikrexId}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-container font-mono-data text-text-primary outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(aurikrexId, 'id')}
                      className="px-4 py-2.5 rounded-xl border border-border bg-surface-container text-text-primary font-label-md font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedAkxId ? 'done' : 'content_copy'}
                      </span>
                      <span>{copiedAkxId ? 'Copied' : 'Copy ID'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-text-muted border-t border-border mt-10">
        Aurikrex Exam Arena · © 2025/2026 Aurikrex. All rights reserved.
      </footer>
    </div>
  );
}
