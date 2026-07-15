import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Users } from 'lucide-react';

interface Section {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

export default function PrivacyPolicy() {
    const sections: Section[] = [
        {
            id: 'introduction',
            title: 'Introduction',
            icon: <Shield className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        At JAMB CBT Prep by Aurikex, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                    </p>
                    <p>
                        Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our service.
                    </p>
                    <p className="text-sm text-text-muted/70">
                        Last Updated: July 2026
                    </p>
                </div>
            ),
        },
        {
            id: 'collection',
            title: 'Information We Collect',
            icon: <Eye className="h-6 w-6" />,
            content: (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-white mb-2">Personal Information</h4>
                        <ul className="list-disc list-inside space-y-1 text-text-muted">
                            <li>Name and email address</li>
                            <li>Account credentials and password</li>
                            <li>Phone number (optional)</li>
                            <li>Educational background and subject preferences</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Academic Performance Data</h4>
                        <ul className="list-disc list-inside space-y-1 text-text-muted">
                            <li>Exam answers and responses</li>
                            <li>Test scores and performance metrics</li>
                            <li>Study history and progress tracking</li>
                            <li>Time spent on questions and sections</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Technical Information</h4>
                        <ul className="list-disc list-inside space-y-1 text-text-muted">
                            <li>IP address and device information</li>
                            <li>Browser type and operating system</li>
                            <li>Pages visited and time spent</li>
                            <li>Cookies and tracking technologies</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Payment Information</h4>
                        <ul className="list-disc list-inside space-y-1 text-text-muted">
                            <li>Billing name and address</li>
                            <li>Payment method (processed securely through Paystack)</li>
                            <li>Transaction history</li>
                        </ul>
                    </div>
                </div>
            ),
        },
        {
            id: 'usage',
            title: 'How We Use Your Information',
            icon: <Users className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>We use the information we collect for various purposes:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold text-white">Service Delivery:</span> To provide, maintain, and improve our platform and services</li>
                        <li><span className="font-semibold text-white">Personalization:</span> To customize your learning experience and recommendations</li>
                        <li><span className="font-semibold text-white">Performance Tracking:</span> To monitor your progress and generate performance analytics</li>
                        <li><span className="font-semibold text-white">Communication:</span> To send you updates, notifications, and support messages</li>
                        <li><span className="font-semibold text-white">Billing:</span> To process payments and manage subscription plans</li>
                        <li><span className="font-semibold text-white">Security:</span> To detect and prevent fraud and protect against unauthorized access</li>
                        <li><span className="font-semibold text-white">Research:</span> To analyze usage patterns and improve our educational content</li>
                        <li><span className="font-semibold text-white">Legal Compliance:</span> To comply with legal obligations and regulations</li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'sharing',
            title: 'Information Sharing',
            icon: <Lock className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        We do not sell, trade, or rent your personal information to third parties. However, we may share information in the following circumstances:
                    </p>
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-white mb-1">Service Providers</h4>
                            <p>We share information with trusted third-party service providers who assist us in operating our website and conducting our business, such as payment processors (Paystack), email services, and analytics platforms.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1">Legal Requirements</h4>
                            <p>We may disclose your information when required by law or when we believe in good faith that disclosure is necessary to comply with a legal obligation, enforce our agreements, or protect the rights and safety of our users.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1">Business Transfers</h4>
                            <p>If we are involved in a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction.</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'security',
            title: 'Data Security',
            icon: <Lock className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        We implement comprehensive security measures to protect your information, including:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>SSL/TLS encryption for data in transit</li>
                        <li>Secure password hashing and storage</li>
                        <li>Regular security audits and penetration testing</li>
                        <li>Access controls and role-based permissions</li>
                        <li>Secure backup and disaster recovery procedures</li>
                        <li>Two-factor authentication options for accounts</li>
                    </ul>
                    <p className="pt-3 text-sm">
                        While we strive to protect your information, no security system is completely secure. We cannot guarantee absolute security of your data.
                    </p>
                </div>
            ),
        },
        {
            id: 'retention',
            title: 'Data Retention',
            icon: <Eye className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        We retain your information for as long as necessary to provide our services and fulfill the purposes described in this policy. Specifically:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Account information is retained while your account is active</li>
                        <li>Academic performance data is retained indefinitely for your records and progress tracking</li>
                        <li>Payment information is retained for billing and tax purposes as required by law</li>
                        <li>Technical logs are typically retained for 90 days for security purposes</li>
                    </ul>
                    <p className="pt-3">
                        You may request deletion of your account and associated data, subject to legal and contractual obligations.
                    </p>
                </div>
            ),
        },
        {
            id: 'rights',
            title: 'Your Privacy Rights',
            icon: <Users className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>Depending on your location, you may have the following rights:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold text-white">Right to Access:</span> Request a copy of your personal information</li>
                        <li><span className="font-semibold text-white">Right to Rectification:</span> Correct inaccurate or incomplete information</li>
                        <li><span className="font-semibold text-white">Right to Erasure:</span> Request deletion of your data (subject to exceptions)</li>
                        <li><span className="font-semibold text-white">Right to Restrict Processing:</span> Limit how we use your information</li>
                        <li><span className="font-semibold text-white">Right to Data Portability:</span> Receive your data in a portable format</li>
                        <li><span className="font-semibold text-white">Right to Withdraw Consent:</span> Opt-out of data processing</li>
                    </ul>
                    <p className="pt-3">
                        To exercise any of these rights, please contact us at info@aurikex.tech.
                    </p>
                </div>
            ),
        },
        {
            id: 'cookies',
            title: 'Cookies and Tracking',
            icon: <Eye className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        We use cookies and similar tracking technologies to enhance your experience. Cookies are small files stored on your device that help us recognize you and remember your preferences.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-white mb-1">Types of Cookies</h4>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><span className="font-semibold">Essential:</span> Required for platform functionality</li>
                                <li><span className="font-semibold">Performance:</span> Help us analyze how you use our service</li>
                                <li><span className="font-semibold">Functional:</span> Remember your preferences</li>
                                <li><span className="font-semibold">Marketing:</span> Track usage for advertising purposes</li>
                            </ul>
                        </div>
                        <p>
                            You can control cookies through your browser settings, though some features may not work properly if cookies are disabled.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'contact',
            title: 'Contact Us',
            icon: <Shield className="h-6 w-6" />,
            content: (
                <div className="space-y-3 text-text-muted">
                    <p>
                        If you have questions about this Privacy Policy or our privacy practices, please contact us:
                    </p>
                    <div className="space-y-2">
                        <p><span className="font-semibold text-white">Email:</span> info@aurikex.tech</p>
                        <p><span className="font-semibold text-white">Phone:</span> +234 911 368 3395</p>
                        <p><span className="font-semibold text-white">Website:</span> www.aurikex.tech</p>
                    </div>
                    <p className="pt-3 text-sm">
                        We will respond to your privacy requests within 30 days.
                    </p>
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
                    <h1 className="text-xl font-bold">Privacy Policy</h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-4xl px-6 py-16">
                {/* Hero Section */}
                <div className="mb-12 space-y-4">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Privacy Policy
                    </h2>
                    <p className="text-text-muted">
                        Your privacy is important to us. This policy explains how we collect, use, and protect your information.
                    </p>
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
                    <h4 className="font-semibold text-white">Policy Updates</h4>
                    <p className="text-text-muted text-sm">
                        We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes by posting the new policy and updating the "Last Updated" date above.
                    </p>
                </div>
            </main>
        </div>
    );
}
