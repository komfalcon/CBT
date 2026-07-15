import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Globe, MapPin, Send, ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '../components';

export default function ContactUs() {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            addToast({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Please fill in all fields before submitting.',
            });
            return;
        }

        try {
            setLoading(true);
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const response = await fetch(`${apiBase}/contact/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            addToast({
                type: 'success',
                title: 'Message Sent',
                message: 'Thank you! We\'ll get back to you within 24 hours.',
            });

            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error: any) {
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to send message. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            {/* Header */}
            <header className="border-b border-border/60 sticky top-0 z-40 backdrop-blur-md bg-bg-primary/80">
                <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-semibold">Back</span>
                    </Link>
                    <h1 className="text-xl font-bold">Contact Us</h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-5xl px-6 py-16">
                {/* Hero Section */}
                <div className="mb-16 text-center space-y-4">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Get In Touch
                    </h2>
                    <p className="text-text-muted max-w-2xl mx-auto">
                        Have questions or feedback? We'd love to hear from you. Reach out and we'll respond as quickly as we can.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {/* Contact Info Cards */}
                    <div className="md:col-span-1 space-y-4">
                        {/* Email */}
                        <div className="p-6 rounded-xl border border-border bg-bg-secondary/30 hover:border-primary/40 transition-all space-y-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Email</h3>
                                <a href="mailto:info@aurikex.tech" className="text-text-muted hover:text-primary transition-colors break-all">
                                    info@aurikex.tech
                                </a>
                                <p className="text-xs text-text-muted mt-2">Response time: Within 24 hours</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="p-6 rounded-xl border border-border bg-bg-secondary/30 hover:border-primary/40 transition-all space-y-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Phone</h3>
                                <a href="tel:+2349113683395" className="text-text-muted hover:text-primary transition-colors">
                                    +234 911 368 3395
                                </a>
                                <p className="text-xs text-text-muted mt-2">Available Mon-Fri, 9AM-5PM WAT</p>
                            </div>
                        </div>

                        {/* Website */}
                        <div className="p-6 rounded-xl border border-border bg-bg-secondary/30 hover:border-primary/40 transition-all space-y-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Globe className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Website</h3>
                                <a
                                    href="https://www.aurikex.tech"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-text-muted hover:text-primary transition-colors"
                                >
                                    www.aurikex.tech
                                </a>
                                <p className="text-xs text-text-muted mt-2">Visit our main site</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-secondary/50 text-white placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your.email@example.com"
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-secondary/50 text-white placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Subject</label>
                            <select
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-secondary/50 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                <option value="">Select a subject</option>
                                <option value="general">General Inquiry</option>
                                <option value="technical">Technical Support</option>
                                <option value="billing">Billing Question</option>
                                <option value="feedback">Feedback</option>
                                <option value="partnership">Partnership Opportunity</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us more about your inquiry..."
                                rows={6}
                                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg-secondary/50 text-white placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-blue-400 hover:shadow-lg hover:shadow-primary/20 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border border-border bg-bg-secondary/30 space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-white">Response Time</h3>
                        </div>
                        <p className="text-text-muted text-sm">
                            We typically respond to all inquiries within 24 hours. During peak hours, it may take up to 48 hours.
                        </p>
                    </div>

                    <div className="p-6 rounded-xl border border-border bg-bg-secondary/30 space-y-3">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-white">Quick Support</h3>
                        </div>
                        <p className="text-text-muted text-sm">
                            For urgent technical issues, use the help icon in your dashboard or check our Help Center for instant answers.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
