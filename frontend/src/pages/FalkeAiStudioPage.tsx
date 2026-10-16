import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatWithTutor, getChatSessions, createChatSession, getChatSession } from '../features/ai/api';
import { StudentLayout } from '../components/StudentLayout';
import { useToast } from '../components/ToastProvider';
import { getMe } from '../features/auth/api';
import { Bot, Send, Sparkles, RefreshCw, AlertCircle, PlusCircle, MessageSquare } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  isCacheHit?: boolean;
  isError?: boolean;
}

export default function FalkeAiStudioPage() {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; createdAt?: string }>>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [dialect, setDialect] = useState<'english' | 'pidgin'>('english');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        'Hello scholar! I am Falke AI, your dedicated curriculum-aligned JAMB UTME tutor. Ask me any question, formula derivation, or comprehension query in Standard Academic English or Nigerian Pidgin.',
      isCacheHit: true,
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial prompt from query params
  useEffect(() => {
    getMe()
      .then((data) => setStudent(data))
      .catch(() => {});

    // Load user chat sessions
    getChatSessions()
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
      })
      .catch(() => {});

    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      handleSendMessage(promptParam);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const data = await getChatSession(sessionId);
      setActiveSessionId(sessionId);
      if (Array.isArray(data?.messages) && data.messages.length > 0) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load session messages', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewSession = async () => {
    try {
      const newSession = await createChatSession({ title: 'New Study Topic' });
      if (newSession?.id) {
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
      }
    } catch {
      // fallback
    }
    setMessages([
      {
        role: 'assistant',
        content: 'New session started. Which JAMB topic or question should we tackle next?',
        isCacheHit: true,
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const dialectInstruction =
        dialect === 'pidgin'
          ? ' [IMPORTANT: Please explain in authentic, friendly Nigerian Pidgin English while retaining rigorous academic accuracy].'
          : ' [Explain in clear Standard Academic English with step-by-step problem breakdown].';

      const response = await chatWithTutor({
        message: text + dialectInstruction,
        history: historyPayload,
        sessionId: activeSessionId || undefined,
      });

      const reply = response?.reply || response?.explanation || response?.message || 'Explanation processed.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          isCacheHit: response?.isCacheHit ?? false,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message ||
        'Unable to connect to Falke AI tutor server. Please verify your connection or remaining AuriCoins and try again.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
          isError: true,
        },
      ]);
      addToast({
        type: 'error',
        title: 'Tutor Query Failed',
        message: 'Could not fetch explanation from AI service.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout student={student}>
      <div className="flex flex-col h-[calc(100vh-140px)] bg-bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-border bg-surface-container flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold font-display text-text-primary">Falke AI Study Assistant</h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  UTME PRO
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                Curriculum-aligned step-by-step tutor for 17 accredited subjects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dialect Switcher */}
            <div className="flex items-center bg-surface-container-high p-1 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setDialect('english')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  dialect === 'english'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Academic EN
              </button>
              <button
                type="button"
                onClick={() => setDialect('pidgin')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  dialect === 'pidgin'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Naija Pidgin
              </button>
            </div>

            <button
              onClick={handleStartNewSession}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface-container-high hover:bg-surface-variant text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">New Session</span>
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar + Chat Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sessions Sidebar */}
          <aside className="w-64 border-r border-border bg-surface-container p-3 space-y-3 hidden md:flex flex-col justify-between shrink-0">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 block">
                Study Sessions
              </span>
              <div className="space-y-1 overflow-y-auto max-h-[300px]">
                {sessions.length === 0 ? (
                  <p className="text-[11px] text-text-muted px-2 py-1">No prior sessions recorded.</p>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 truncate transition-colors ${
                        activeSessionId === s.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text-secondary hover:bg-surface-container-high hover:text-text-primary'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{s.title || 'Study Session'}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Quick High-Yield Prompts */}
              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2 block">
                  High-Yield Prompts
                </span>
                {[
                  { label: 'Explain Oral English /æ/ vs /eɪ/', prompt: 'Explain the difference between vowel sounds /æ/ (as in plait) and /eɪ/ (as in plate) with typical JAMB distractor examples.' },
                  { label: 'Calculus First Principles', prompt: 'Explain Calculus differentiation from first principles for JAMB Mathematics.' },
                  { label: 'Lenz’s Law & Induction', prompt: 'Explain Lenz’s Law and electromagnetic induction with step-by-step exam breakdown for JAMB Physics.' },
                  { label: 'IUPAC Organic Chemistry', prompt: 'Explain IUPAC naming rules for branched alkanes and alkenes in JAMB Chemistry.' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="w-full text-left p-2 rounded-lg bg-surface-container-high hover:bg-surface-variant border border-border text-[11px] text-text-secondary hover:text-text-primary transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-semibold truncate">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-container-high border border-border text-[11px] text-text-muted">
              <span className="font-semibold text-text-primary block mb-0.5">AuriCoins Telemetry</span>
              <span>Each novel AI derivation draws 5 coins. Cached responses consume 0 coins.</span>
            </div>
          </aside>

          {/* Main Chat Canvas */}
          <main className="flex-1 flex flex-col justify-between bg-bg-card relative overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scroll">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.role === 'user'
                        ? 'bg-primary text-white'
                        : m.isError
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                  >
                    {m.role === 'user' ? 'ME' : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                      m.role === 'user'
                        ? 'bg-primary text-white border-primary rounded-tr-sm'
                        : m.isError
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300 rounded-tl-sm'
                        : 'bg-surface-container border-border text-text-primary rounded-tl-sm'
                    }`}
                  >
                    {m.role === 'assistant' && !m.isError && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border/50 text-[10px] text-text-muted">
                        <span className="font-bold text-primary">Falke AI Tutor</span>
                        {m.isCacheHit && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                            0 Coins · Cached
                          </span>
                        )}
                      </div>
                    )}
                    {m.isError && (
                      <div className="flex items-center gap-1.5 mb-1.5 font-bold text-[11px] text-rose-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Query Error</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-text-muted text-xs p-2">
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Falke AI is deriving curriculum solution...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Console */}
            <div className="p-3 border-t border-border bg-surface-container">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    dialect === 'pidgin'
                      ? 'Ask Falke AI in Pidgin... (e.g. wetin be Lenz Law?)'
                      : 'Ask Falke AI any question or formula problem... [Enter to send]'
                  }
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-bg-card text-text-primary text-xs outline-none focus:border-primary placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMsg.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </StudentLayout>
  );
}
