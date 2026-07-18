import React, { useState, useEffect, useRef } from 'react';
import { chatWithTutor } from './api';
import { Bot, X, Send, User as UserIcon, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AiChatWidgetProps {
  contextPayload?: string;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ contextPayload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>(() => {
    const saved = localStorage.getItem('falke_ai_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    localStorage.setItem('falke_ai_history', JSON.stringify(messages));
  }, [messages, isOpen]);

  const handleClearHistory = () => {
    if (window.confirm('Clear chat history?')) {
      setMessages([]);
      localStorage.removeItem('falke_ai_history');
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setError(null);

    try {
      // Map frontend messages to format expected by backend (which expects role/content objects)
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await chatWithTutor({ message: userMsg, history, contextPayload });
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('This feature requires the Max subscription plan. Upgrade to access the AI Tutor!');
      } else {
        setError(err.response?.data?.message || 'Failed to connect to the AI Tutor. Please try again.');
      }
      // Remove the user message if it failed
      setMessages((prev) => prev.slice(0, -1));
      setInputValue(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Modal/Widget Container */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[60] flex flex-col sm:items-end">
          <div className="w-full h-full sm:w-96 sm:h-[500px] sm:mb-4 bg-bg-card sm:border border-border sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="bg-bg-secondary border-b border-border p-4 flex justify-between items-center text-text-primary">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-ai-flag animate-pulse" />
                <h3 className="font-semibold text-sm">Falke AI</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleClearHistory} title="Clear History" className="hover:bg-bg-card p-1 rounded-full transition-colors text-text-secondary hover:text-text-primary">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-bg-card p-1 rounded-full transition-colors text-text-secondary hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-secondary/40">
              {messages.length === 0 && !error && (
                <div className="text-center text-text-secondary mt-8 space-y-2">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-ai-flag opacity-80" />
                  <p className="font-bold text-sm text-text-primary">Hi! I'm Falke AI.</p>
                  <p className="text-xs text-text-secondary max-w-[240px] mx-auto leading-relaxed">Built by the Aurikex team to help Nigerian students ace JAMB UTME. Ask me to explain concepts, review topics, or help you study!</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-ai-flag/10 border border-ai-flag/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-ai-flag" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-text-on-accent rounded-br-none font-medium' : 'bg-bg-secondary border border-border text-text-secondary rounded-bl-none'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm overflow-x-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-text-secondary" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-ai-flag/10 border border-ai-flag/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-ai-flag" />
                  </div>
                  <div className="bg-bg-secondary border border-border text-text-secondary rounded-2xl rounded-bl-none p-3 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-ai-flag" /> Thinking...
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-xs text-center">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-bg-card border-t border-border">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="w-full bg-bg-secondary border border-border rounded-full py-2 pl-4 pr-10 text-sm text-text-primary focus:outline-none focus:border-ai-flag focus:ring-1 focus:ring-ai-flag/25 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-1.5 p-1.5 bg-ai-flag text-text-on-accent rounded-full hover:bg-ai-flag-hover disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-ai-flag hover:bg-ai-flag-hover text-text-on-accent rounded-full p-4 shadow-lg shadow-ai-flag/20 transition-all hover:scale-110 flex items-center gap-2 border border-ai-flag/10 active:scale-95"
          >
            <Bot className="w-6 h-6 animate-pulse" />
          </button>
        </div>
      )}
    </>
  );
};
