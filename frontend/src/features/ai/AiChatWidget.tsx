import React, { useState, useEffect, useRef } from 'react';
import { chatWithTutor, getChatSessions, createChatSession, getChatSession, deleteChatSession } from './api';
import { Bot, X, Send, User as UserIcon, Loader2, Trash2, MessageSquare, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AiChatWidgetProps {
  contextPayload?: string;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ contextPayload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions when widget is opened
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Load specific session when currentSessionId changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, showSidebar]);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load chat sessions', err);
    }
  };

  const loadSessionMessages = async (id: string) => {
    try {
      setIsLoading(true);
      const session = await getChatSession(id);
      setMessages(session.messages || []);
    } catch (err) {
      console.error('Failed to load session messages', err);
      setError('Failed to load chat history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const title = `Chat ${new Date().toLocaleDateString()}`;
      const session = await createChatSession({ title });
      setSessions(prev => [session, ...prev]);
      setCurrentSessionId(session._id);
      if (window.innerWidth < 640) setShowSidebar(false);
    } catch (err) {
      setError('Failed to create new session');
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat history?')) return;
    try {
      await deleteChatSession(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      try {
        const title = inputValue.substring(0, 30) + '...';
        const newSession = await createChatSession({ title });
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession._id);
        targetSessionId = newSession._id;
      } catch (err) {
        setError('Failed to create new session for message');
        return;
      }
    }

    const userMsg = inputValue;
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithTutor({ message: userMsg, history, contextPayload, sessionId: targetSessionId });
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('This feature requires the Max subscription plan. Upgrade to access the AI Tutor!');
      } else {
        setError(err.response?.data?.message || 'Failed to connect to the AI Tutor. Please try again.');
      }
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
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[60] flex flex-col sm:flex-row sm:items-end gap-4 pointer-events-none">
          
          <div className="flex w-full h-full sm:w-[600px] sm:h-[500px] bg-bg-card sm:border border-border sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 pointer-events-auto transition-all duration-300">
            
            {/* Sidebar */}
            <div className={`${showSidebar ? 'w-64 sm:w-1/3 border-r' : 'w-0'} bg-bg-secondary flex flex-col border-border transition-all duration-300 overflow-hidden`}>
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm text-text-primary">History</span>
                <button onClick={handleNewSession} className="p-1 hover:bg-bg-primary rounded-lg text-text-secondary hover:text-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 ? (
                  <div className="text-xs text-text-muted text-center p-4">No past chats</div>
                ) : (
                  sessions.map(s => (
                    <div 
                      key={s._id} 
                      onClick={() => { setCurrentSessionId(s._id); if(window.innerWidth < 640) setShowSidebar(false); }}
                      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors ${currentSessionId === s._id ? 'bg-primary/10 text-primary' : 'hover:bg-bg-primary text-text-secondary'}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </div>
                      <button onClick={(e) => handleDeleteSession(s._id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-error hover:bg-error/10 rounded-md transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-bg-primary relative min-w-0">
              {/* Header */}
              <div className="bg-bg-secondary border-b border-border p-4 flex justify-between items-center text-text-primary flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowSidebar(!showSidebar)} className="mr-1 p-1 hover:bg-bg-primary rounded-lg text-text-secondary">
                    {showSidebar ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <Bot className="w-5 h-5 text-ai-flag animate-pulse" />
                  <h3 className="font-semibold text-sm">Falke AI</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsOpen(false)} className="hover:bg-bg-card p-1 rounded-full transition-colors text-text-secondary hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-secondary/40">
                {messages.length === 0 && !error && !isLoading && (
                  <div className="text-center text-text-secondary mt-8 space-y-2">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-ai-flag opacity-80" />
                    <p className="font-bold text-sm text-text-primary">Hi! I'm Falke AI.</p>
                    <p className="text-xs text-text-secondary max-w-[240px] mx-auto leading-relaxed">Ask me to explain concepts, review topics, or help you study!</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-ai-flag/10 border border-ai-flag/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-ai-flag" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-text-on-accent rounded-br-none font-medium' : 'bg-bg-secondary border border-border text-text-primary rounded-bl-none'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
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
              <div className="p-3 border-t border-border bg-bg-primary">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Falke AI..."
                    disabled={isLoading}
                    className="w-full bg-bg-secondary border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-text-primary placeholder:text-text-muted disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 p-1.5 bg-primary text-text-on-accent rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[60] group flex items-center justify-center w-14 h-14 bg-bg-secondary border border-border rounded-full shadow-2xl hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Bot className="w-6 h-6 text-ai-flag group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
    </>
  );
};
