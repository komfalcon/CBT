import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, BookOpen, MessageSquare, Zap, Shield, ArrowLeft } from 'lucide-react';

interface FAQItem {
    id: number;
    category: string;
    question: string;
    answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
    {
        id: 1,
        category: 'Getting Started',
        question: 'How do I create an account?',
        answer: 'To create an account, click the "Sign Up" button on the landing page. Fill in your email, create a strong password, and verify your email address. You\'ll immediately get access to free practice questions.',
    },
    {
        id: 2,
        category: 'Getting Started',
        question: 'What subjects are available?',
        answer: 'We cover all 16 JAMB UTME subjects including English, Mathematics, Physics, Chemistry, Biology, Geography, Economics, Government, History, Literature, Commerce, Civic Education, and Religious Studies (CRK/IRK).',
    },
    {
        id: 3,
        category: 'Getting Started',
        question: 'Is there a free trial?',
        answer: 'Yes! All new users get free access to practice questions from each subject. Premium features like unlimited mock exams and detailed analytics are available with our paid plans.',
    },
    {
        id: 4,
        category: 'Mock Exams',
        question: 'How long does a mock exam take?',
        answer: 'Full mock exams follow the actual JAMB format with 180 questions and a 3-hour time limit. You can also take subject-specific drills that are shorter and more flexible.',
    },
    {
        id: 5,
        category: 'Mock Exams',
        question: 'Can I pause and resume an exam?',
        answer: 'Yes! You can pause your exam anytime and resume it later. Your progress and answers are automatically saved. However, the timer continues running when you pause.',
    },
    {
        id: 6,
        category: 'Mock Exams',
        question: 'How are my results calculated?',
        answer: 'Results are calculated using the official JAMB scoring system. Each correct answer earns points, and your score is displayed with detailed analytics showing strengths and weaknesses by subject.',
    },
    {
        id: 7,
        category: 'Subscription',
        question: 'What\'s included in the PRO plan?',
        answer: 'The PRO plan includes unlimited mock exams, detailed performance analytics, priority support, custom study plans, and access to all subjects with no restrictions.',
    },
    {
        id: 8,
        category: 'Subscription',
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription anytime from your account settings. You\'ll retain access until your billing period ends.',
    },
    {
        id: 9,
        category: 'Technical',
        question: 'What devices are supported?',
        answer: 'Our platform works on all modern devices: desktops, laptops, tablets, and smartphones. We recommend using a stable internet connection for the best experience.',
    },
    {
        id: 10,
        category: 'Technical',
        question: 'Do I need an internet connection?',
        answer: 'Yes, an active internet connection is required to take exams and access questions. This ensures your progress is always saved securely.',
    },
];

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', ...new Set(FAQ_ITEMS.map(item => item.category))];

    const filteredItems = FAQ_ITEMS.filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch =
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            {/* Header */}
            <header className="border-b border-border/60 sticky top-0 z-40 backdrop-blur-md bg-bg-primary/80">
                <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-semibold">Back</span>
                    </Link>
                    <h1 className="text-xl font-bold">Help Center</h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-4xl px-6 py-16">
                {/* Hero Section */}
                <div className="mb-12 text-center space-y-4">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        How Can We Help?
                    </h2>
                    <p className="text-text-muted max-w-2xl mx-auto">
                        Find answers to common questions about JAMB CBT Prep, our features, subscription plans, and technical support.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-12">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-bg-secondary/50 text-white placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="mb-8 flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === category
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-bg-secondary border border-border hover:border-primary/40 text-text-muted hover:text-white'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* FAQ Items */}
                <div className="space-y-3">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="border border-border rounded-xl overflow-hidden bg-bg-secondary/30 hover:border-primary/40 transition-all"
                            >
                                <button
                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-secondary/50 transition-colors text-left"
                                >
                                    <div className="flex-1">
                                        <div className="text-xs text-primary font-semibold mb-2">{item.category}</div>
                                        <h3 className="font-semibold text-white">{item.question}</h3>
                                    </div>
                                    <ChevronDown
                                        className={`h-5 w-5 text-primary flex-shrink-0 ml-4 transition-transform ${expandedId === item.id ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {expandedId === item.id && (
                                    <div className="px-6 py-4 border-t border-border bg-bg-secondary/50">
                                        <p className="text-text-muted leading-relaxed">{item.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-text-muted mb-4">No results found for your search.</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('All');
                                }}
                                className="text-primary hover:text-primary-hover transition-colors font-medium"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Contact Support Section */}
                <div className="mt-16 p-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-blue-400/5 space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        Didn't find what you need?
                    </h3>
                    <p className="text-text-muted">
                        Our support team is here to help! Reach out to us via email or contact form and we'll get back to you within 24 hours.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-block px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-all"
                    >
                        Contact Support
                    </Link>
                </div>
            </main>
        </div>
    );
}
