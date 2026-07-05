import React, { useState, useEffect, useRef } from 'react';
import { chatWithTutor } from './api';
import { Bot, X, Send, User as UserIcon, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AiChatWidgetProps {
  contextPayload?: string;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ contextPayload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">Aurikex AI Tutor</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.length === 0 && !error && (
              <div className="text-center text-slate-400 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50 text-indigo-400" />
                <p>Hi! I'm your AI Tutor.</p>
                <p className="text-sm">Ask me to explain concepts, review topics, or help you study!</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
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
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-bl-none p-3 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 pl-4 pr-10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-1 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-lg shadow-indigo-500/20 transition-transform hover:scale-110 flex items-center gap-2"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
