import { AlertTriangle, BadgeCheck, Ban, BookOpenCheck, CreditCard, KeyRound, Scale, ScrollText, ShieldAlert } from 'lucide-react';
import { SupportContents, SupportHero, SupportPageShell, SupportSection, supportChannels } from '../components';

const sections = [
  { id: 'agreement', label: 'Agreement and eligibility' },
  { id: 'account', label: 'Account and CBT key' },
  { id: 'plans', label: 'Plans, billing and cancellation' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'acceptable-use', label: 'Acceptable use and integrity' },
  { id: 'content', label: 'Content and intellectual property' },
  { id: 'availability', label: 'Disclaimers and liability' },
  { id: 'termination', label: 'Suspension and termination' },
  { id: 'legal', label: 'Governing law and contact' },
];

export default function TermsOfService() {
  return (
    <SupportPageShell>
      <SupportHero
        eyebrow="Terms of service"
        title="Clear rules for focused preparation."
        description="These terms set out how candidates may use Aurikrex Exam Arena by Aurikrex, including accounts, CBT keys, paid plans, exam integrity, and the question bank."
        icon={ScrollText}
        meta={
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 font-semibold text-primary">Effective 2 September 2026</span>
            <span>Read with the Privacy Policy before creating an account.</span>
          </div>
        }
      />

      <main className="support-legal-layout mx-auto grid max-w-7xl grid-cols-[230px_minmax(0,1fr)] gap-14 px-8 py-16">
        <div className="support-mobile-toc-wrap"><SupportContents sections={sections} /></div>
        <aside className="self-start sticky top-28 rounded-2xl support-surface-soft p-3">
          <p className="px-3 pb-3 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">On this page</p>
          <nav className="space-y-1" aria-label="Terms of service sections">
            {sections.map((section, index) => (
              <a key={section.id} href={`#${section.id}`} className="support-toc-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors">
                <span className="font-mono text-[11px] text-primary/80">{String(index + 1).padStart(2, '0')}</span>
                <span>{section.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 space-y-14">
          <SupportSection id="agreement" eyebrow="01 — agreement" title="Using Aurikrex Exam Arena means accepting these terms">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>These Terms of Service govern your use of the Aurikrex Exam Arena website, candidate portal, question bank, mock exams, subject drills, performance tools, CBT-key sign-in, and FalkeAI features (the <strong className="font-semibold text-text-primary">“Service”</strong>). The Service is operated by Aurikrex. By creating an account, purchasing a plan or test, or otherwise using the Service, you agree to these Terms and our Privacy Policy.</p>
              <p className="mt-4">You must be at least 13 years old to create an account. If you are under 18, you confirm that a parent or guardian has authorised your use where required. You must provide accurate, current account information and use the Service only for personal, non-commercial UTME preparation.</p>
            </div>
          </SupportSection>

          <SupportSection id="account" eyebrow="02 — access" title="Your account and CBT key are personal to you">
            <div className="grid grid-cols-2 gap-4">
              <div className="support-surface rounded-2xl p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><BadgeCheck className="h-5 w-5" /></div><h3 className="mt-5 font-display text-[17px] font-semibold tracking-[-0.03em] text-text-primary">Keep details accurate</h3><p className="mt-2 text-[13px] leading-6 text-text-secondary">Use an email address you can access. It is used to verify your account and help you recover it. Keep your password and any optional multi-factor authentication code confidential.</p></div>
              <div className="support-surface rounded-2xl p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div><h3 className="mt-5 font-display text-[17px] font-semibold tracking-[-0.03em] text-text-primary">Protect your CBT key</h3><p className="mt-2 text-[13px] leading-6 text-text-secondary">Your CBT key is an alternative sign-in credential for trusted shared devices or cyber-café sessions. Treat it like a password. Do not show, sell, transfer, publish, or share it with anyone.</p></div>
            </div>
            <div className="mt-5 rounded-2xl border border-warning/20 bg-warning/[0.07] p-5 text-[13px] leading-6 text-text-secondary"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><p>You are responsible for activity performed through your account or CBT key. Tell us promptly if you believe either has been compromised. We may reset a key or secure an account to protect you and other candidates.</p></div></div>
          </SupportSection>

          <SupportSection id="plans" eyebrow="03 — payment terms" title="Plans, checkout, billing, and cancellation">
            <div className="overflow-hidden rounded-2xl support-surface">
              <table className="support-table w-full border-collapse text-left text-[13px] leading-6">
                <thead><tr className="border-b border-border"><th className="w-[22%] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em]">Option</th><th className="w-[41%] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em]">Core access</th><th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em]">Billing and cancellation</th></tr></thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border"><td className="px-6 py-4 font-semibold text-text-primary">Plus</td><td className="px-6 py-4">One full mock exam per day, detailed score review, and CBT-key access.</td><td className="px-6 py-4">A monthly paid plan at the price shown during Paystack checkout. Cancel before the next billing date to stop renewal; access continues to the end of the paid period.</td></tr>
                  <tr className="border-b border-border"><td className="px-6 py-4 font-semibold text-text-primary">Pro</td><td className="px-6 py-4">Two full mock exams per day, detailed score review, and subject-specific drills.</td><td className="px-6 py-4">A monthly paid plan at the price shown during Paystack checkout. Cancellation stops the next renewal and does not reduce access already paid for.</td></tr>
                  <tr className="border-b border-border"><td className="px-6 py-4 font-semibold text-text-primary">Max</td><td className="px-6 py-4">Up to five full mock exams per day, advanced performance review, subject drills, and FalkeAI access subject to applicable daily AI limits.</td><td className="px-6 py-4">A monthly paid plan at the price shown during Paystack checkout. Cancel before the next billing date to stop renewal; any applicable daily feature limits continue until the current period ends.</td></tr>
                  <tr><td className="px-6 py-4 font-semibold text-text-primary">Pay per test</td><td className="px-6 py-4">A single drill or mock attempt identified at checkout, with the associated result and review where stated.</td><td className="px-6 py-4">A one-time payment, not a recurring subscription. It is personal, non-transferable, and may not be exchanged for a plan unless we agree otherwise in writing.</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-[13px] leading-6 text-text-secondary">
              <div className="rounded-2xl support-surface-soft p-5"><CreditCard className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold text-text-primary">Checkout and pricing</h3><p className="mt-2">Payments are processed by Paystack. The checkout page presents the amount, currency, plan or test, and any payment terms before you authorise payment. You must use a payment method you are permitted to use.</p></div>
              <div className="rounded-2xl support-surface-soft p-5"><AlertTriangle className="h-5 w-5 text-warning" /><h3 className="mt-3 font-semibold text-text-primary">Cancellation support</h3><p className="mt-2">If no self-service cancellation control is available in your account, email us from the address linked to the subscription before your next billing date. We will confirm the cancellation status and effective date.</p></div>
            </div>
            <p className="mt-5 text-[13px] leading-6 text-text-muted">We may change a future plan price or features by giving reasonable prior notice. A change will not alter a plan or test you have already paid for during its current paid period, except where required for security, law, or a material service error.</p>
          </SupportSection>

          <SupportSection id="refunds" eyebrow="04 — refund policy" title="When a refund may be considered">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>Except where required by applicable law, fees for completed subscription periods and used pay-per-test access are non-refundable. We may consider a refund when Paystack confirms a duplicate charge, an unauthorised charge is reported promptly and verified, or a paid feature remains unavailable because of a confirmed Aurikrex technical error that we cannot resolve within a reasonable time.</p>
              <p className="mt-4">To request a review, email <a className="font-semibold text-primary hover:text-primary-hover" href={`mailto:${supportChannels.email}?subject=Billing%20or%20refund%20request`}>{supportChannels.email}</a> within 7 days of the charge. Include the account email, Paystack reference, date, amount, and a short description. A payment dispute or chargeback should not be opened for a resolved support issue; however, this does not limit rights you have under applicable law.</p>
            </div>
          </SupportSection>

          <SupportSection id="acceptable-use" eyebrow="05 — preparation with integrity" title="What responsible use looks like">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6"><BookOpenCheck className="h-5 w-5 text-emerald-300" /><h3 className="mt-4 font-display text-[17px] font-semibold tracking-[-0.03em] text-text-primary">Use the platform to learn</h3><p className="mt-2 text-[13px] leading-6 text-text-secondary">Take mocks and drills as your own practice, use result reviews to improve, and use FalkeAI for explanations and study guidance. Aurikrex Exam Arena is a preparation tool, not an official JAMB examination service.</p></div>
              <div className="rounded-2xl border border-error/20 bg-error/[0.06] p-6"><Ban className="h-5 w-5 text-error" /><h3 className="mt-4 font-display text-[17px] font-semibold tracking-[-0.03em] text-text-primary">Do not misuse access or content</h3><p className="mt-2 text-[13px] leading-6 text-text-secondary">Do not share CBT keys or accounts, copy or distribute question-bank material, use bots or scripts, manipulate scores or timers, probe the service, interfere with other users, submit harmful content, or use the Service for cheating in any examination.</p></div>
            </div>
            <p className="mt-5 rounded-2xl support-surface-soft p-5 text-[13px] leading-6 text-text-secondary">You must comply with Nigerian law and applicable school or examination rules. You may not represent mock scores, progress, or AI output as an official JAMB result. FalkeAI can make mistakes; you should use it as study support and check important answers against your course materials and the platform’s reviewed explanations.</p>
          </SupportSection>

          <SupportSection id="content" eyebrow="06 — content ownership" title="The question bank and platform belong to Aurikrex">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>The Service, including the interface, software, question bank, answers, explanations, diagrams, branding, text, graphics, data structure, and study materials, is owned by Aurikrex or its licensors and protected by applicable intellectual-property law. We grant you a limited, personal, revocable, non-exclusive, non-transferable licence to access it solely for your own study.</p>
              <p className="mt-4">You may not reproduce, scrape, record, resell, publish, redistribute, create a competing database from, reverse engineer, or remove proprietary notices from the Service or its content. Feedback you send us may be used to improve the Service without compensation to you, but we will not claim ownership of your personal data.</p>
            </div>
          </SupportSection>

          <SupportSection id="availability" eyebrow="07 — service limits" title="Availability, AI output, and limitation of liability">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>We work to keep Aurikrex Exam Arena available and accurate, but the Service is provided on an <strong className="font-semibold text-text-primary">“as available”</strong> basis. We do not guarantee uninterrupted access, a particular UTME score, admission outcome, the accuracy of every question or explanation, or that FalkeAI output will always be correct or complete. Use good academic judgement and verify material that is important to your preparation.</p>
              <p className="mt-4">To the fullest extent allowed by law, Aurikrex is not liable for indirect, incidental, special, consequential, exemplary, or punitive losses arising from use of the Service. Our aggregate liability for a claim relating to a paid Service will not exceed the amount you paid us for that Service in the three months before the event giving rise to the claim. Nothing in these Terms excludes liability that cannot lawfully be excluded or limited.</p>
            </div>
          </SupportSection>

          <SupportSection id="termination" eyebrow="08 — ending access" title="Suspension and termination">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <p>You may stop using the Service at any time. To request account deletion, follow the process in our Privacy Policy. We may suspend, restrict, reset a CBT key, or terminate access if we reasonably believe that you have violated these Terms, compromised account security, engaged in cheating or content theft, made a fraudulent payment claim, or created risk to the Service or other users.</p>
              <p className="mt-4">Where practical, we will explain the reason and give you a chance to resolve a correctable issue. We may act immediately when security, integrity, law, or other users are at risk. Ending access does not remove obligations that by their nature should continue, including payment obligations already due, intellectual-property restrictions, liability limits, and dispute provisions.</p>
            </div>
          </SupportSection>

          <SupportSection id="legal" eyebrow="09 — legal information" title="Nigerian law, changes, and contact">
            <div className="support-surface rounded-2xl p-7 text-[14px] leading-7 text-text-secondary">
              <div className="flex gap-4"><Scale className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute will be subject to the jurisdiction of the Nigerian courts, unless applicable law requires another forum or process.</p><p className="mt-4">We may update these Terms to reflect feature, legal, security, or business changes. Material changes will be posted here with a new effective date and, where appropriate, communicated in the Service or by email. Continuing to use the Service after the effective date means you accept the updated Terms.</p><p className="mt-4">Questions about these Terms, a plan, cancellation, or a refund request can be sent to <a className="font-semibold text-primary hover:text-primary-hover" href={`mailto:${supportChannels.email}`}>{supportChannels.email}</a> or raised by phone at <a className="font-semibold text-primary hover:text-primary-hover" href={`tel:${supportChannels.phoneLink}`}>{supportChannels.phoneDisplay}</a>.</p></div></div>
            </div>
          </SupportSection>
        </article>
      </main>
    </SupportPageShell>
  );
}
