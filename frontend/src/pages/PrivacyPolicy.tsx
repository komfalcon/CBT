import { BrainCircuit, Check, Database, KeyRound, LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { SupportContents, SupportHero, SupportPageShell, SupportSection, supportChannels } from '../components';

const sections = [
  { id: 'scope', label: 'Scope and controller' },
  { id: 'information', label: 'Information we collect' },
  { id: 'use', label: 'Why we use it' },
  { id: 'sharing', label: 'Service providers' },
  { id: 'storage', label: 'Storage and security' },
  { id: 'retention', label: 'Retention' },
  { id: 'rights', label: 'Your privacy rights' },
  { id: 'children', label: 'Young users' },
  { id: 'changes', label: 'Changes and contact' },
];

const listClassName = 'space-y-3 text-[14px] leading-6 text-text-secondary';

export default function PrivacyPolicy() {
  return (
    <SupportPageShell>
      <SupportHero
        eyebrow="Privacy notice"
        title="Privacy that supports your preparation."
        description="This notice explains the candidate information JAMB UTME Prep by Aurikrex uses, why we use it, and the choices you have when you practise with mock exams, drills, performance insights, CBT keys, and Falke AI."
        icon={ShieldCheck}
        meta={
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 font-semibold text-primary">Effective 2 September 2026</span>
            <span>Applies to the website and candidate portal</span>
          </div>
        }
      />

      <main className="support-legal-layout mx-auto grid max-w-7xl grid-cols-[230px_minmax(0,1fr)] gap-14 px-8 py-16">
        <div className="support-mobile-toc-wrap"><SupportContents sections={sections} /></div>
        <aside className="self-start sticky top-28 rounded-2xl support-surface-soft p-3">
          <p className="px-3 pb-3 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">On this page</p>
          <nav className="space-y-1" aria-label="Privacy policy sections">
            {sections.map((section, index) => (
              <a key={section.id} href={`#${section.id}`} className="support-toc-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors">
                <span className="font-mono text-[11px] text-primary/80">{String(index + 1).padStart(2, '0')}</span>
                <span>{section.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 space-y-14">
          <SupportSection id="scope" eyebrow="01 — the essentials" title="Scope and who is responsible">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>
                Aurikrex operates JAMB UTME Prep, a study platform for Nigerian students preparing for the Unified Tertiary Matriculation Examination (UTME). In this notice, <strong className="font-semibold text-text-primary">“Aurikrex,” “we,” “us,”</strong> and <strong className="font-semibold text-text-primary">“our”</strong> mean the team operating this platform. We are responsible for the personal data described below when we decide why and how it is processed.
              </p>
              <p className="mt-4">
                This notice covers the public site, candidate account, mock exams, subject drills, study analytics, CBT-key sign-in, payments, and Falke AI features. It does not govern third-party websites or services that you choose to open, including their own payment or sign-in pages.
              </p>
            </div>
          </SupportSection>

          <SupportSection id="information" eyebrow="02 — what we collect" title="Information connected to your account and study activity">
            <div className="overflow-hidden rounded-2xl support-surface">
              <table className="support-table w-full border-collapse text-left text-[13px] leading-6">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-[31%] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em]">Category</th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em]">What this includes in JAMB UTME Prep</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border">
                    <td className="px-6 py-4 font-semibold text-text-primary">Candidate profile</td>
                    <td className="px-6 py-4">Your full name, email address, phone number when supplied, account password, profile photo when supplied through Google, and the UTME subject combination or profile details you choose to add.</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-6 py-4 font-semibold text-text-primary">Account credentials</td>
                    <td className="px-6 py-4">A securely hashed password, email-verification and password-reset codes, optional multi-factor authentication setup, sign-in timestamps and IP address, device-security signals, and a unique CBT access key.</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-6 py-4 font-semibold text-text-primary">Practice and performance</td>
                    <td className="px-6 py-4">Mock and drill selections, questions served, answer choices, time remaining or time spent, score, subject and topic breakdowns, progress, streaks, and study-plan or syllabus activity.</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-6 py-4 font-semibold text-text-primary">Payments</td>
                    <td className="px-6 py-4">Your email, selected plan or test, payment reference, amount, and verification result. Card, bank, or other payment credentials are collected by Paystack on its checkout page, not stored by Aurikrex.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-semibold text-text-primary">Falke AI interactions</td>
                    <td className="px-6 py-4">Messages you send to Falke AI, chat-session titles and history, and the question or result context you ask it to explain. Please do not put sensitive personal information into an AI prompt.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-[13px] leading-6 text-text-muted">We also receive limited technical information needed to keep the service secure and functional, such as browser requests, error reports, and essential browser storage used to keep you signed in and remember your theme preference.</p>
          </SupportSection>

          <SupportSection id="use" eyebrow="03 — how information is used" title="Why the platform needs this information">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: UserRoundCheck, title: 'Run your account', text: 'Create and verify your candidate profile, authenticate sign-ins, recover access, and show your profile and subject combination.' },
                { icon: Database, title: 'Deliver practice', text: 'Build mock-exam and drill sessions, save answers, calculate results, and show progress, topic weaknesses, and study insights.' },
                { icon: KeyRound, title: 'Protect access', text: 'Issue and validate your CBT key, prevent unauthorised access, investigate suspicious activity, and maintain service reliability.' },
                { icon: BrainCircuit, title: 'Provide AI study help', text: 'Generate Falke AI explanations and tutoring responses when you use an AI feature that is available to your plan.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="support-surface rounded-2xl p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-5 font-display text-[17px] font-semibold tracking-[-0.03em] text-text-primary">{item.title}</h3>
                    <p className="mt-2 text-[13px] leading-6 text-text-secondary">{item.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.07] p-6 text-[14px] leading-7 text-text-secondary">
              <p><strong className="text-text-primary">Our legal bases.</strong> We process information needed to provide your account, practice tools, billing, and support because it is necessary to perform our agreement with you. We also process limited data for legitimate interests such as service security, fraud prevention, and improvement. Where consent is required, including for an optional processing activity, we will ask for it and you may withdraw it.</p>
            </div>
          </SupportSection>

          <SupportSection id="sharing" eyebrow="04 — third parties" title="When information is shared outside Aurikrex">
            <div className="overflow-hidden rounded-2xl support-surface">
              <table className="support-table w-full border-collapse text-left text-[13px] leading-6">
                <thead><tr className="border-b border-border"><th className="w-[30%] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em]">Recipient</th><th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em]">Purpose and information involved</th></tr></thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border"><td className="px-6 py-4 font-semibold text-text-primary">Paystack</td><td className="px-6 py-4">Processes checkout for paid plans and pay-per-test purchases. It receives the payment information you enter, your email, the amount, and a transaction reference under its own privacy terms.</td></tr>
                  <tr className="border-b border-border"><td className="px-6 py-4 font-semibold text-text-primary">Google</td><td className="px-6 py-4">If you select Google sign-in, Google supplies the account identity information needed to create or sign in to your profile, such as your name, email, and profile image where available.</td></tr>
                  <tr className="border-b border-border"><td className="px-6 py-4 font-semibold text-text-primary">SeekAI</td><td className="px-6 py-4">Falke AI sends the prompt, relevant learning context, and chat history needed to generate a response through the AI service provider currently configured for the feature. Do not include financial, health, government-ID, or other highly sensitive information in prompts.</td></tr>
                  <tr><td className="px-6 py-4 font-semibold text-text-primary">Turso, DigitalOcean, and Cloudflare</td><td className="px-6 py-4">The current platform configuration uses these cloud database, application-hosting, and frontend-delivery providers to store account and learning records and maintain availability. They act only to provide those services for us.</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-5 text-[13px] leading-6 text-text-muted">We do not sell candidate personal data. We do not currently use third-party advertising analytics in the CBT application. We may disclose information if required by law, to protect users or the platform, or as part of a legitimate business reorganisation, subject to appropriate safeguards.</p>
          </SupportSection>

          <SupportSection id="storage" eyebrow="05 — keeping information safe" title="Storage, security, and international processing">
            <div className="support-surface rounded-2xl p-7">
              <div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><LockKeyhole className="h-5 w-5" /></div><div className="text-[14px] leading-7 text-text-secondary"><p>Account, learning, and payment-verification records are stored in our managed database and cloud infrastructure. Passwords are stored as a one-way cryptographic hash rather than readable password text. We use access controls and technical safeguards designed to limit access to people and providers who need it to run, secure, or support the platform.</p><p className="mt-4">Our providers may process information outside Nigeria. Where this happens, we take reasonable steps to use a provider and transfer arrangement that provides safeguards appropriate to the information and applicable Nigerian data-protection law.</p></div></div>
            </div>
          </SupportSection>

          <SupportSection id="retention" eyebrow="06 — how long we keep it" title="Retention is tied to a practical purpose">
            <div className="support-surface rounded-2xl p-7">
              <ul className={listClassName}>
                <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span><strong className="font-semibold text-text-primary">Active accounts and performance history:</strong> retained while your account is active so your results, progress, and settings remain available.</span></li>
                <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span><strong className="font-semibold text-text-primary">Deleted accounts:</strong> after identity confirmation, we aim to delete or de-identify account and learning records within 30 days, unless we need a limited record for a lawful purpose.</span></li>
                <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span><strong className="font-semibold text-text-primary">Payments and disputes:</strong> payment references and related records are retained for the period required for financial, tax, fraud-prevention, chargeback, or legal obligations.</span></li>
                <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span><strong className="font-semibold text-text-primary">Falke AI chat:</strong> retained with the relevant chat session until you delete the session or request account deletion, subject to the limits above.</span></li>
              </ul>
            </div>
          </SupportSection>

          <SupportSection id="rights" eyebrow="07 — your choices" title="Your rights under Nigerian data-protection law">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>Nigeria’s principal data-protection framework is the Nigeria Data Protection Act 2023 (NDPA). This notice is designed to support the NDPA and, where still relevant, the earlier Nigeria Data Protection Regulation (NDPR). Subject to applicable law and verification of your identity, you may ask us to:</p>
              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] leading-6">
                {['Know how your data is used and obtain access to it.', 'Correct inaccurate or incomplete account information.', 'Request deletion where information is no longer necessary.', 'Object to or restrict certain processing.', 'Receive a portable copy of data you provided to us.', 'Withdraw consent for a consent-based activity.', 'Ask not to be subject to a solely automated decision where the law gives that protection.', 'Complain to us and, if unresolved, to the Nigeria Data Protection Commission (NDPC).'].map((right) => <p key={right} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{right}</p>)}
              </div>
              <p className="mt-6 border-t border-border pt-5">To make a request, email <a className="font-semibold text-primary hover:text-primary-hover" href={`mailto:${supportChannels.email}?subject=Privacy%20request`}>{supportChannels.email}</a> with the subject <strong className="font-semibold text-text-primary">“Privacy request”</strong>. Tell us which account email and right your request concerns. We may ask for information reasonably necessary to verify that the request is yours. You may also contact the NDPC through its official channels if you believe your rights have not been respected.</p>
            </div>
          </SupportSection>

          <SupportSection id="children" eyebrow="08 — students under 18" title="Young users and parent or guardian involvement">
            <div className="support-surface-soft rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>JAMB UTME Prep is intended for students aged 13 and above. If you are under 18, please use the platform with the knowledge and involvement of a parent or guardian where required by law. We do not knowingly create accounts for children under 13. If you believe a child under 13 has provided personal data, contact us so that we can investigate and take appropriate action.</p>
            </div>
          </SupportSection>

          <SupportSection id="changes" eyebrow="09 — staying current" title="Updates and how to reach us">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>We may update this notice when our features, providers, or legal obligations change. For a material change, we will provide a reasonable notice in the platform or by email where appropriate, and we will update the effective date at the top of this page.</p>
              <p className="mt-4">For a privacy question, deletion request, or concern about this notice, contact Aurikrex at <a className="font-semibold text-primary hover:text-primary-hover" href={`mailto:${supportChannels.email}`}>{supportChannels.email}</a> or call <a className="font-semibold text-primary hover:text-primary-hover" href={`tel:${supportChannels.phoneLink}`}>{supportChannels.phoneDisplay}</a>.</p>
            </div>
          </SupportSection>
        </article>
      </main>
    </SupportPageShell>
  );
}
