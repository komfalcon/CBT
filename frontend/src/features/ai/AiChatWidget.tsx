import React, { useEffect, useRef, useState } from 'react';
import { chatWithTutor, createChatSession, deleteChatSession, getChatSession, getChatSessions } from './api';
import {
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  MessageSquare,
  PanelLeft,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
  User as UserIcon,
  Volume2,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AiChatWidgetProps {
  contextPayload?: string;
}

const suggestedPrompts = [
  'Explain this topic simply',
  'Create a 20-minute revision plan',
  'Test me with five questions',
  'Help me understand an incorrect answer',
];

function FalkeMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_28%,#fff1bc_0%,#d7b35c_24%,#9a701b_62%,#4b3510_100%)] shadow-[0_8px_22px_rgba(215,179,92,0.26)] ${sizes[size]}`} aria-hidden="true">
      <span className="absolute inset-[2px] rounded-[13px] border border-white/35" />
      <span className="absolute h-1/2 w-1/2 rounded-full bg-white/30 blur-[2px]" />
      <Sparkles className={size === 'lg' ? 'h-7 w-7 text-[#3f2c0c]' : 'h-4 w-4 text-[#3f2c0c]'} strokeWidth={2.4} />
    </span>
  );
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ contextPayload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [playingMsgIndex, setPlayingMsgIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isNewSessionRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
      const timeout = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(timeout);
    }
    window.speechSynthesis.cancel();
    setPlayingMsgIndex(null);
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (currentSessionId) {
      if (isNewSessionRef.current) {
        isNewSessionRef.current = false;
        return;
      }
      loadSessionMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen, showSidebar]);

  const closePanel = () => {
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const toggleSpeech = (text: string, index: number) => {
    if (playingMsgIndex === index) {
      window.speechSynthesis.cancel();
      setPlayingMsgIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => /Google|Samantha|Siri|Natural/i.test(voice.name));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.pitch = 1;
    utterance.rate = 0.95;
    utterance.onend = () => setPlayingMsgIndex(null);
    utterance.onerror = () => setPlayingMsgIndex(null);
    setPlayingMsgIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (requestError) {
      console.error('Failed to load chat sessions', requestError);
    }
  };

  const loadSessionMessages = async (id: string) => {
    try {
      setIsLoading(true);
      const session = await getChatSession(id);
      setMessages(session.messages || []);
    } catch (requestError) {
      console.error('Failed to load session messages', requestError);
      setError('We could not load this chat. Please try another conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const title = `Chat ${new Date().toLocaleDateString()}`;
      const session = await createChatSession({ title });
      setSessions((previous) => [session, ...previous]);
      isNewSessionRef.current = true;
      setCurrentSessionId(session.id);
      setMessages([]);
      setShowSidebar(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch {
      setError('We could not create a new chat. Please try again.');
    }
  };

  const handleDeleteSession = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Delete this chat history?')) return;
    try {
      await deleteChatSession(id);
      setSessions((previous) => previous.filter((session) => session.id !== id));
      if (currentSessionId === id) setCurrentSessionId(null);
    } catch (requestError) {
      console.error('Failed to delete session', requestError);
      setError('We could not delete that chat. Please try again.');
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSend = async () => {
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      try {
        const title = `${userMessage.substring(0, 30)}${userMessage.length > 30 ? '…' : ''}`;
        const newSession = await createChatSession({ title });
        setSessions((previous) => [newSession, ...previous]);
        isNewSessionRef.current = true;
        setCurrentSessionId(newSession.id);
        targetSessionId = newSession.id;
      } catch {
        setError('We could not start a new chat. Please try again.');
        return;
      }
    }

    setInputValue('');
    setMessages((previous) => [...previous, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.map((message) => ({ role: message.role, content: message.content }));
      const response = await chatWithTutor({ message: userMessage, history, contextPayload, sessionId: targetSessionId || undefined });
      setMessages((previous) => [...previous, { role: 'assistant', content: response.reply }]);
      loadSessions();
    } catch (requestError: any) {
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        setError('FalkeAI is available with the Max plan. Upgrade your plan to start a tutoring chat.');
      } else {
        setError(requestError.response?.data?.message || 'FalkeAI could not respond. Please try again.');
      }
      setMessages((previous) => previous.slice(0, -1));
      setInputValue(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-overlay/90 backdrop-blur-[2px]" role="presentation" onMouseDown={closePanel}>
          <section
            className="flex h-full w-full max-w-[760px] animate-in slide-in-from-right-5 duration-300 ease-out border-l border-border bg-bg-card shadow-[-24px_0_60px_rgba(0,0,0,0.38)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="falke-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <aside className={`${showSidebar ? 'w-[248px] border-r' : 'w-0 border-r-0'} hidden shrink-0 flex-col overflow-hidden border-border bg-bg-secondary transition-[width,border-color] duration-300 ease-out md:flex`} aria-label="FalkeAI chat history">
              <div className="border-b border-border p-3">
                <button onClick={handleNewSession} className="flex w-full items-center justify-center gap-2 rounded-xl border border-ai-flag/30 bg-ai-flag/10 px-3 py-2.5 text-xs font-bold text-ai-flag transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-ai-flag/50 hover:bg-ai-flag/15 active:scale-[0.98]">
                  <Plus className="h-4 w-4" /> New chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <p className="px-2 pb-2 pt-1 text-xs sm:text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Recent chats</p>
                {sessions.length === 0 ? (
                  <div className="mx-2 mt-3 rounded-xl border border-dashed border-border px-3 py-5 text-center">
                    <History className="mx-auto h-4 w-4 text-text-muted" />
                    <p className="mt-2 text-xs font-semibold text-text-secondary">No chat history yet</p>
                    <p className="mt-1 text-xs sm:text-[11px] leading-4 text-text-muted">Your tutoring conversations will be saved here.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sessions.map((session) => (
                      <div key={session.id} className={`group flex items-center gap-1 rounded-xl transition-colors ${currentSessionId === session.id ? 'bg-primary/12 text-primary' : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'}`}>
                        <button
                          type="button"
                          onClick={() => { setCurrentSessionId(session.id); setShowSidebar(false); }}
                          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs focus-visible:outline-none"
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate font-medium">{session.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleDeleteSession(session.id, event)}
                          className="mr-1 rounded-md p-1 text-text-muted opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100 focus:opacity-100"
                          aria-label={`Delete ${session.title}`}
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-bg-primary">
              <header className="flex items-center justify-between border-b border-border bg-bg-card px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSidebar((shown) => !shown)}
                    className="hidden rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary md:inline-flex"
                    aria-label={showSidebar ? 'Hide chat history' : 'Show chat history'}
                    title={showSidebar ? 'Hide chat history' : 'Show chat history'}
                  >
                    {showSidebar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <FalkeMark />
                  <div className="min-w-0">
                    <h2 id="falke-title" className="font-display text-sm font-bold text-text-primary">FalkeAI</h2>
                    <p className="mt-0.5 text-xs sm:text-[11px] text-text-secondary">Your private UTME study partner</p>
                  </div>
                </div>
                <button type="button" onClick={closePanel} className="min-h-11 min-w-11 rounded-xl p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary" aria-label="Close FalkeAI" title="Close">
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(215,179,92,0.06),transparent_34%)] px-5 py-6">
                {messages.length === 0 && !error && !isLoading && (
                  <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center py-8 text-center">
                    <FalkeMark size="lg" />
                    <p className="mt-5 font-display text-xl font-bold tracking-tight text-text-primary">How can I support your study today?</p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">Ask for an explanation, a revision plan, or help understanding a difficult question.</p>
                    <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                      {suggestedPrompts.map((prompt) => (
                        <button key={prompt} type="button" onClick={() => handleSuggestedPrompt(prompt)} className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-left text-xs font-semibold text-text-secondary shadow-sm transition-[background-color,border-color,transform,color] duration-200 hover:-translate-y-0.5 hover:border-ai-flag/40 hover:bg-ai-flag/10 hover:text-text-primary active:scale-[0.98]">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mx-auto max-w-2xl space-y-5">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && <FalkeMark size="sm" />}
                      <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-primary text-text-on-accent' : 'rounded-bl-md border border-border bg-bg-card text-text-primary'}`}>
                        {message.role === 'assistant' ? (
                          <div className="group relative pr-7">
                            <div className="prose prose-sm max-w-none overflow-x-auto text-text-primary dark:prose-invert prose-p:my-0 prose-p:leading-6 prose-pre:bg-bg-secondary"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{message.content.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$$1$$').replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$$$$1$$$$')}</ReactMarkdown></div>
                            <button type="button" onClick={() => toggleSpeech(message.content, index)} className="absolute -right-1 -top-1 rounded-lg p-1.5 text-text-muted opacity-0 transition-all hover:bg-bg-secondary hover:text-ai-flag group-hover:opacity-100 focus:opacity-100" title={playingMsgIndex === index ? 'Stop audio' : 'Play audio'} aria-label={playingMsgIndex === index ? 'Stop reading response' : 'Read response aloud'}>{playingMsgIndex === index ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
                          </div>
                        ) : message.content}
                      </div>
                      {message.role === 'user' && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-secondary"><UserIcon className="h-4 w-4" /></div>}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-3"><FalkeMark size="sm" /><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-bg-card px-4 py-3 text-sm text-text-secondary"><Loader2 className="h-4 w-4 animate-spin text-ai-flag" />Falke is thinking</div></div>
                  )}
                  {error && <div className="rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-center text-xs leading-5 text-error">{error}</div>}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <footer className="border-t border-border bg-bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="mx-auto max-w-2xl">
                  <div className="flex items-end gap-2 rounded-2xl border border-border bg-bg-secondary p-2 shadow-inner transition-colors focus-within:border-ai-flag/45 focus-within:ring-2 focus-within:ring-ai-flag/15">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask FalkeAI about a topic, question, or study plan"
                      disabled={isLoading}
                      rows={1}
                      className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Message FalkeAI"
                    />
                    <button type="button" onClick={handleSend} disabled={!inputValue.trim() || isLoading} className="flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-ai-flag/50 bg-ai-flag text-[#3f2c0c] shadow-[0_6px_14px_rgba(215,179,92,0.22)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-ai-flag-hover hover:shadow-[0_8px_18px_rgba(215,179,92,0.3)] active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none" aria-label="Send message" title="Send message"><Send className="h-4 w-4" /></button>
                  </div>
                  <p className="mt-2 text-center text-xs sm:text-[10px] text-text-muted">FalkeAI can make mistakes. Check important answers with your study materials.</p>
                </div>
              </footer>
            </div>
          </section>
        </div>
      )}

      {!isOpen && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border border-ai-flag/30 bg-bg-card px-3 py-3 shadow-[0_16px_34px_rgba(0,0,0,0.32)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-ai-flag/55 hover:shadow-[0_20px_42px_rgba(215,179,92,0.2)] active:scale-[0.98]"
          aria-label="Open FalkeAI tutor"
        >
          <FalkeMark />
          <span className="hidden text-left sm:block"><span className="block text-xs font-bold text-text-primary">Ask FalkeAI</span><span className="mt-0.5 block text-xs sm:text-[10px] text-text-secondary">Study support</span></span>
        </button>
      )}
    </>
  );
};
