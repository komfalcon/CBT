import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, Lock, Gavel } from 'lucide-react';

interface Section {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

export default function TermsOfService() {
    const sections: Section[] = [
        {
            id: 'agreement',
            title: 'Agreement to Terms',
            icon: <Gavel className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        These Terms of Service ("Terms") govern your access to and use of the JAMB CBT Prep platform ("Service"), including our website, mobile applications, and related services provided by Aurikex ("Company," "we," "us," or "our").
                    </p>
                    <p>
                        By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to any part of these Terms, you may not use the Service.
                    </p>
                    <p className="text-sm text-text-muted/70">
                        Last Updated: July 2026
                    </p>
                </div>
            ),
        },
        {
            id: 'access',
            title: 'User Accounts and Access',
            icon: <Lock className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <div>
                        <h4 className="font-semibold text-white mb-2">Account Eligibility</h4>
                        <p>You must be at least 13 years old to create an account. By creating an account, you represent and warrant that all information provided is accurate and truthful.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Account Responsibility</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                            <li>You are liable for all activities conducted through your account</li>
                            <li>You must notify us immediately of any unauthorized access</li>
                            <li>You agree not to share your account with others</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Account Termination</h4>
                        <p>We reserve the right to suspend or terminate your account if you violate these Terms or engage in abusive behavior.</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'usage',
            title: 'Acceptable Use Policy',
            icon: <CheckCircle className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>You agree not to use the Service for:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Any unlawful purpose or in violation of applicable laws</li>
                        <li>Cheating, sharing answers, or using automated tools during exams</li>
                        <li>Attempting to access unauthorized areas or other users' accounts</li>
                        <li>Uploading malware, viruses, or harmful code</li>
                        <li>Engaging in harassment, abuse, or threatening behavior</li>
                        <li>Distributing copyrighted content without authorization</li>
                        <li>Manipulating scores or submitting false exam results</li>
                        <li>Commercial purposes without prior written permission</li>
                        <li>Any activity that disrupts or overloads the Service</li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'intellectual',
            title: 'Intellectual Property Rights',
            icon: <Lock className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        All content on the Service, including questions, answers, explanations, graphics, logos, and software, is the exclusive property of Aurikex or its licensors and is protected by copyright and other intellectual property laws.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-white mb-1">Your License</h4>
                            <p>We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal, educational purposes only.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1">Restrictions</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>You may not reproduce, distribute, or transmit any content</li>
                                <li>You may not create derivative works</li>
                                <li>You may not reverse engineer or decompile the platform</li>
                                <li>You may not remove any copyright or proprietary notices</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1">User Content</h4>
                            <p>By submitting content (feedback, forum posts), you grant Aurikex a worldwide, non-exclusive license to use that content for service improvement.</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'subscriptions',
            title: 'Subscriptions and Billing',
            icon: <CheckCircle className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <div>
                        <h4 className="font-semibold text-white mb-2">Subscription Plans</h4>
                        <p>We offer various subscription tiers with different features and pricing. Free access includes limited features; premium access requires payment.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Billing</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Subscription fees are billed monthly or annually depending on your plan</li>
                            <li>Billing occurs on the same date each billing cycle</li>
                            <li>We use Paystack for secure payment processing</li>
                            <li>You are responsible for maintaining valid payment information</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Cancellation</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>You may cancel your subscription anytime from your account settings</li>
                            <li>Cancellation takes effect at the end of your current billing period</li>
                            <li>No refunds are provided for partial billing periods</li>
                            <li>You retain access until your subscription expires</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Price Changes</h4>
                        <p>We may change subscription prices with 30 days' notice. Continued use after the notice period constitutes acceptance of new pricing.</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'exam-integrity',
            title: 'Exam Integrity and Academic Honesty',
            icon: <AlertCircle className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        We are committed to maintaining academic integrity. You agree to:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Take exams honestly without external assistance or resources</li>
                        <li>Not share your account or exam access with others</li>
                        <li>Not use automated tools, bots, or cheating software</li>
                        <li>Not record or distribute exam questions</li>
                        <li>Not attempt to manipulate scores or submit false results</li>
                    </ul>
                    <p className="pt-3">
                        Violations of these rules may result in account suspension, score invalidation, and legal action.
                    </p>
                </div>
            ),
        },
        {
            id: 'warranty',
            title: 'Disclaimers and Limitations',
            icon: <AlertCircle className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <div>
                        <h4 className="font-semibold text-white mb-2">As-Is Service</h4>
                        <p>
                            The Service is provided "AS IS" without warranties of any kind. We do not warrant that the Service will be uninterrupted, error-free, or meet your specific requirements.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">No Guarantees</h4>
                        <p>
                            We do not guarantee that using our Service will improve your JAMB UTME scores. Results depend on individual effort, study habits, and prior knowledge.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Limitation of Liability</h4>
                        <p>
                            To the fullest extent permitted by law, Aurikex is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'liability',
            title: 'Indemnification',
            icon: <Gavel className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        You agree to indemnify and hold harmless Aurikex, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including attorney's fees) arising from:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Your use of the Service</li>
                        <li>Your violation of these Terms</li>
                        <li>Your violation of any applicable laws or regulations</li>
                        <li>Your infringement of third-party rights</li>
                        <li>Any user-generated content you submit</li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'modifications',
            title: 'Modifications to Terms and Service',
            icon: <CheckCircle className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <div>
                        <h4 className="font-semibold text-white mb-2">Changes to Terms</h4>
                        <p>
                            We reserve the right to modify these Terms at any time. Changes become effective immediately upon posting. Your continued use of the Service constitutes acceptance of modified Terms.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Service Changes</h4>
                        <p>
                            We may modify, suspend, or discontinue the Service with or without notice. We are not liable for any such changes.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'termination',
            title: 'Termination',
            icon: <AlertCircle className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        Either you or Aurikex may terminate your use of the Service at any time. Upon termination:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Your right to use the Service immediately ceases</li>
                        <li>You remain liable for any unpaid fees</li>
                        <li>We may delete your account and data after a grace period</li>
                        <li>Provisions that survive termination will continue to apply</li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'jurisdiction',
            title: 'Governing Law and Jurisdiction',
            icon: <Gavel className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        These Terms are governed by the laws of Nigeria. Any legal action or proceeding shall be exclusively conducted in the courts of Nigeria.
                    </p>
                    <p>
                        You agree to submit to the personal and exclusive jurisdiction of such courts and waive any objections to jurisdiction or venue.
                    </p>
                </div>
            ),
        },
        {
            id: 'contact',
            title: 'Contact Information',
            icon: <CheckCircle className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        For questions about these Terms of Service, please contact us:
                    </p>
                    <div className="space-y-2">
                        <p><span className="font-semibold text-white">Email:</span> info@aurikex.tech</p>
                        <p><span className="font-semibold text-white">Phone:</span> +234 911 368 3395</p>
                        <p><span className="font-semibold text-white">Website:</span> www.aurikex.tech</p>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            {/* Header */}
            <header className="border-b border-border/60 sticky top-0 z-40 backdrop-blur-md bg-bg-primary/80">
                <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-semibold">Back</span>
                    </Link>
                    <h1 className="text-xl font-bold">Terms of Service</h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-4xl px-6 py-16">
                {/* Hero Section */}
                <div className="mb-12 space-y-4">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Terms of Service
                    </h2>
                    <p className="text-text-muted">
                        Please read these terms carefully before using JAMB CBT Prep. By accessing our service, you agree to be bound by these terms.
                    </p>
                </div>

                {/* Table of Contents */}
                <div className="mb-12 p-6 rounded-xl border border-border bg-bg-secondary/30">
                    <h3 className="font-semibold text-white mb-4">Table of Contents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="text-primary hover:text-primary-hover transition-colors text-sm"
                            >
                                → {section.title}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            id={section.id}
                            className="scroll-mt-20"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    {section.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-white">{section.title}</h3>
                            </div>
                            <div className="pl-13 border-l-2 border-primary/20">
                                {section.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <div className="mt-16 p-6 rounded-xl border border-border bg-bg-secondary/30 space-y-3">
                    <h4 className="font-semibold text-white">Agreement Acknowledgment</h4>
                    <p className="text-text-muted text-sm">
                        By clicking "I Agree" during account creation or by continuing to use the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                    </p>
                </div>
            </main>
        </div>
    );
}
