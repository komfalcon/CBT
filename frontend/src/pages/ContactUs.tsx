import { useState } from 'react';
import { CheckCircle2, Clock3, FileWarning, Globe2, Mail, MessageSquareText, Phone, Send, ShieldCheck } from 'lucide-react';
import { SupportHero, SupportPageShell, supportChannels } from '../components';

const subjectOptions = [
  { value: '', label: 'Choose a topic' },
  { value: 'Account access', label: 'Account access or verification' },
  { value: 'CBT key', label: 'CBT key' },
  { value: 'Billing', label: 'Billing, cancellation, or refund' },
  { value: 'Mock exam or drill', label: 'Mock exam or drill' },
  { value: 'FalkeAI', label: 'FalkeAI' },
  { value: 'Technical issue', label: 'Technical issue' },
  { value: 'Other', label: 'Something else' },
];

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedSubject = subjectOptions.find((option) => option.value === formData.subject)?.label || 'Support request';
    const body = [
      `Name: ${formData.name}`,
      `Account email: ${formData.email}`,
      `Topic: ${selectedSubject}`,
      '',
      'Message:',
      formData.message,
      '',
      'Please do not include your password, CBT key, card number, or verification code.',
    ].join('\n');

    window.location.href = `mailto:${supportChannels.email}?subject=${encodeURIComponent(`Aurikrex Exam Arena — ${selectedSubject}`)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <SupportPageShell>
      <SupportHero
        eyebrow="Contact Aurikrex"
        title="Support when your study flow is interrupted."
        description="Tell us what happened with your account, CBT key, payment, mock exam, or FalkeAI. The form below prepares a complete email to our support inbox, so your message reaches the right team with useful context."
        icon={MessageSquareText}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-10 sm:py-16">
        <section className="support-contact-layout grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-8">
          <aside className="space-y-4">
            <div className="support-surface rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-royal-blue dark:text-blue-300">Support channels</p>
              <h2 className="mt-4 font-display text-[25px] font-semibold tracking-[-0.045em] text-text-primary">Reach us directly.</h2>
              <div className="mt-7 space-y-3">
                <a href={`mailto:${supportChannels.email}`} className="group flex items-center gap-4 rounded-xl border border-border bg-bg-primary/35 p-4 transition hover:border-primary/35 hover:bg-primary/[0.06]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Mail className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-text-muted">Email support</span><span className="mt-1 block text-[14px] font-semibold text-text-primary group-hover:text-primary">{supportChannels.email}</span></span>
                </a>
                <a href={`tel:${supportChannels.phoneLink}`} className="group flex items-center gap-4 rounded-xl border border-border bg-bg-primary/35 p-4 transition hover:border-primary/35 hover:bg-primary/[0.06]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Phone className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-text-muted">Call support</span><span className="mt-1 block text-[14px] font-semibold text-text-primary group-hover:text-primary">{supportChannels.phoneDisplay}</span></span>
                </a>
                <a href="https://www.aurikrex.com" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-xl border border-border bg-bg-primary/35 p-4 transition hover:border-primary/35 hover:bg-primary/[0.06]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Globe2 className="h-5 w-5" /></span>
                  <span><span className="block text-xs text-text-muted">Aurikrex website</span><span className="mt-1 block text-[14px] font-semibold text-text-primary group-hover:text-primary">www.aurikrex.com</span></span>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6"><Clock3 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /><h2 className="mt-4 font-display text-[17px] font-semibold tracking-[-0.03em] text-text-primary">A faster answer starts with context.</h2><p className="mt-2 text-[13px] leading-6 text-text-secondary">Include the email linked to your account, the page you were using, the approximate time, your browser or device, and a safe screenshot where relevant.</p></div>
            <div className="rounded-2xl border border-warning/20 bg-warning/[0.06] p-6"><ShieldCheck className="h-5 w-5 text-warning" /><h2 className="mt-4 font-display text-[17px] font-semibold tracking-[-0.03em] text-text-primary">Keep credentials private.</h2><p className="mt-2 text-[13px] leading-6 text-text-secondary">Support will never ask for your password, CBT key, payment card number, CVV, or one-time verification code. Do not send any of them.</p></div>
          </aside>

          <section className="support-surface rounded-[24px] p-5 sm:p-8">
            <div className="flex items-start justify-between gap-6 sm:gap-8 border-b border-border pb-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-royal-blue dark:text-blue-300">Message support</p><h2 className="mt-3 font-display text-2xl sm:text-[30px] font-semibold tracking-[-0.05em] text-text-primary">Describe what you need.</h2><p className="mt-3 max-w-xl text-[13px] leading-6 text-text-secondary">Submitting this form opens your email app with a pre-filled message addressed to {supportChannels.email}. Review it and press send in your email app to contact us.</p></div><Send className="mt-1 h-6 w-6 shrink-0 text-primary" /></div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div className="support-contact-fields grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">Your name</span><input className="support-input h-12 w-full rounded-xl border px-4 text-[14px] outline-none transition" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Chinedu Okafor" autoComplete="name" required /></label>
                <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">Account email</span><input className="support-input h-12 w-full rounded-xl border px-4 text-[14px] outline-none transition" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@email.com" autoComplete="email" required /></label>
              </div>
              <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">What can we help with?</span><select className="support-input h-12 w-full rounded-xl border px-4 text-[14px] outline-none transition" name="subject" value={formData.subject} onChange={handleChange} required>{subjectOptions.map((option) => <option key={option.value} value={option.value} disabled={!option.value}>{option.label}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">Your message</span><textarea className="support-input min-h-40 w-full resize-y rounded-xl border px-4 py-3 text-[14px] leading-6 outline-none transition" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us what you were trying to do, what happened, and any exact error message you saw." required /></label>

              {submitted && <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4 text-[13px] leading-6 text-text-secondary"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" /><p>Your email app should now be open with the prepared support request. If it did not open, email us directly at <a className="font-semibold text-primary hover:text-primary-hover" href={`mailto:${supportChannels.email}`}>{supportChannels.email}</a>.</p></div>}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 border-t border-border pt-6"><p className="flex max-w-sm items-start gap-2 text-xs leading-5 text-text-muted"><FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />Do not include passwords, CBT keys, card details, or verification codes.</p><button type="submit" className="w-full sm:w-auto justify-center inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-text-on-accent shadow-[0_10px_24px_rgba(77,107,255,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-hover"><Send className="h-4 w-4" />Prepare support email</button></div>
            </form>
          </section>
        </section>
      </main>
    </SupportPageShell>
  );
}
