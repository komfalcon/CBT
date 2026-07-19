import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers, Settings, Play } from 'lucide-react';
import { Button } from '../components/Button';
import { useToast } from '../components/ToastProvider';
import { getSubjectTopics, getQuestionSubjects } from '../features/questions/api';
import { createExamSession } from '../features/exam/api';

const SUBJECT_LABELS: Record<string, string> = {
  english: 'English Language',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  economics: 'Economics',
  government: 'Government',
  literature: 'Literature in English',
  crk: 'Christian Religious Knowledge',
  history: 'History',
  commerce: 'Commerce',
  accounting: 'Financial Accounting',
  geography: 'Geography',
  agriculture: 'Agricultural Science',
};

export default function MockSetupPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(true);
  
  const [mockSubjects, setMockSubjects] = useState<string[]>([]);
  const [mockDifficulty, setMockDifficulty] = useState<string>('any');
  const [mockSubjectConfig, setMockSubjectConfig] = useState<Record<string, { mode: 'random' | 'specific'; topics: string[] }>>({});
  const [availableMockTopics, setAvailableMockTopics] = useState<Record<string, Array<{ topic: string, count: number }>>>({});
  const [isLoadingMockTopics, setIsLoadingMockTopics] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    getQuestionSubjects()
      .then(rows => {
        setAllSubjects(rows.map((r: any) => r.subject));
        setIsLoadingSubjects(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingSubjects(false);
      });
  }, []);

  useEffect(() => {
    if (mockSubjects.length === 0) {
      setAvailableMockTopics({});
      setMockSubjectConfig({});
      return;
    }
    
    setIsLoadingMockTopics(true);
    const newTopicsMap: Record<string, Array<{ topic: string, count: number }>> = {};
    
    Promise.all(
      mockSubjects.map(subject =>
        getSubjectTopics(subject)
          .then(topics => {
            newTopicsMap[subject] = topics;
            if (!mockSubjectConfig[subject]) {
              setMockSubjectConfig(prev => ({
                ...prev,
                [subject]: { mode: 'random', topics: [] }
              }));
            }
          })
          .catch(err => console.error(`Failed to load topics for ${subject}`, err))
      )
    ).then(() => {
      setAvailableMockTopics(newTopicsMap);
      setIsLoadingMockTopics(false);
    });
  }, [mockSubjects]);

  const handleStartMock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || '';
      
      const payload: any = { type: 'mock', difficultyLevel: mockDifficulty };
      if (mockSubjects.length > 0) payload.subjects = mockSubjects;
      
      const subjectConfigs = Object.entries(mockSubjectConfig).filter(([_, config]) => config.mode === 'specific' && config.topics.length > 0);
      if (subjectConfigs.length > 0) {
        payload.subjectConfigs = Object.fromEntries(subjectConfigs);
      }
      
      const session = await createExamSession(token, payload);
      if (session.warnings && session.warnings.length > 0) {
        session.warnings.forEach(w => addToast({ type: 'info', title: 'Notice', message: w }));
      }
      navigate(`/exam/${session.sessionId}`);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to start exam session',
      });
      setLoading(false);
    }
  };

  const mockWarnings: Array<{ subject: string; message: string }> = [];
  mockSubjects.forEach(sub => {
    const config = mockSubjectConfig[sub];
    if (config?.mode === 'specific' && config.topics.length > 0) {
      const targetCount = sub === 'english' ? 60 : 40;
      const topicsForSub = availableMockTopics[sub] || [];
      const selectedCount = topicsForSub
        .filter(t => config.topics.includes(t.topic))
        .reduce((acc, t) => acc + t.count, 0);
      
      if (selectedCount < targetCount) {
        mockWarnings.push({
          subject: sub,
          message: `Warning: Selected topics only have ${selectedCount} questions. The remaining ${targetCount - selectedCount} will be filled with random ${SUBJECT_LABELS[sub] || sub} questions.`
        });
      }
    }
  });

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans overflow-auto relative flex flex-col">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-bg-secondary rounded-xl transition-colors text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Simulation Mock Setup
              </h1>
            </div>
          </div>
          <div>
             <Button
                disabled={loading || (mockSubjects.length > 0 && mockSubjects.length < 4)}
                onClick={handleStartMock}
                variant="gradient"
                size="sm"
                className="shadow-lg shadow-primary/20"
              >
                {loading ? 'Starting...' : '🚀 Launch Mock'}
              </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-8 space-y-8">
        
        {/* Step 1: Subjects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm">1</span>
              Select Subjects
            </h2>
            <div className="text-sm font-medium text-text-secondary bg-bg-secondary px-3 py-1 rounded-full border border-border">
              {mockSubjects.length}/4 Selected
            </div>
          </div>
          <p className="text-sm text-text-muted">Choose exactly 4 subjects for your UTME simulation. Or leave entirely empty for a fully randomized Full Mock.</p>
          
          {mockSubjects.length > 0 && mockSubjects.length < 4 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm font-medium">
              You must select 4 subjects if you want a customized mock.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoadingSubjects ? (
              <div className="col-span-full py-8 text-center text-text-muted">Loading subjects...</div>
            ) : (
              allSubjects.map(sub => {
                const isSelected = mockSubjects.includes(sub);
                const isDisabled = mockSubjects.length >= 4 && !isSelected;
                return (
                  <button
                    key={sub}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isSelected) {
                        setMockSubjects(prev => prev.filter(s => s !== sub));
                        setMockSubjectConfig(prev => {
                          const newConfig = { ...prev };
                          delete newConfig[sub];
                          return newConfig;
                        });
                      } else {
                        if (mockSubjects.length < 4) {
                          setMockSubjects(prev => [...prev, sub]);
                        }
                      }
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/20' 
                        : 'border-border bg-bg-secondary hover:border-text-muted/30'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-primary border-primary text-text-on-accent' : 'border-text-muted/30'}`}>
                      {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                      {SUBJECT_LABELS[sub] || sub}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Step 2: Difficulty */}
        <section className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm">2</span>
            Exam Difficulty
          </h2>
          <div className="max-w-md">
            <select
              value={mockDifficulty}
              onChange={(e) => setMockDifficulty(e.target.value)}
              className="w-full rounded-xl bg-bg-secondary border border-border p-4 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
            >
              <option value="any">Any Difficulty (Balanced)</option>
              <option value="1">Level 1 (Beginner)</option>
              <option value="2">Level 2 (Easy)</option>
              <option value="3">Level 3 (Medium)</option>
              <option value="4">Level 4 (Hard)</option>
              <option value="5">Level 5 (Expert)</option>
            </select>
          </div>
        </section>

        {/* Step 3: Specific Topics */}
        {mockSubjects.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-border pb-24">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm">3</span>
              Fine-tune Topics <span className="text-text-muted text-sm font-normal">(Optional)</span>
            </h2>
            
            <div className="space-y-6">
              {mockSubjects.map(subject => {
                const config = mockSubjectConfig[subject] || { mode: 'random', topics: [] };
                const topicsForSubject = availableMockTopics[subject] || [];
                const warning = mockWarnings.find(w => w.subject === subject);
                
                return (
                  <div key={subject} className="border border-border rounded-2xl bg-bg-secondary overflow-hidden shadow-sm">
                    {/* Card Header */}
                    <div className="p-5 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-bg-primary rounded-lg">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">{SUBJECT_LABELS[subject] || subject}</h3>
                      </div>
                      
                      <div className="flex bg-bg-primary p-1 rounded-lg border border-border">
                        <button
                          onClick={() => setMockSubjectConfig(prev => ({ ...prev, [subject]: { ...prev[subject], mode: 'random', topics: [] } }))}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            config.mode === 'random' ? 'bg-primary text-text-on-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          Random Mix
                        </button>
                        <button
                          onClick={() => setMockSubjectConfig(prev => ({ ...prev, [subject]: { ...prev[subject], mode: 'specific' } }))}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            config.mode === 'specific' ? 'bg-primary text-text-on-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          Specific Topics
                        </button>
                      </div>
                    </div>
                    
                    {/* Specific Mode Body */}
                    {config.mode === 'specific' && (
                      <div className="p-5 bg-bg-secondary/50">
                        {isLoadingMockTopics ? (
                          <div className="py-8 text-center text-text-muted flex flex-col items-center gap-2">
                            <Layers className="h-8 w-8 animate-pulse text-border" />
                            Loading topics for {SUBJECT_LABELS[subject] || subject}...
                          </div>
                        ) : topicsForSubject.length === 0 ? (
                          <div className="py-8 text-center text-text-muted">No specific topics available for this subject.</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const random = topicsForSubject[Math.floor(Math.random() * topicsForSubject.length)];
                                  setMockSubjectConfig(prev => ({
                                    ...prev,
                                    [subject]: { ...prev[subject], topics: [random.topic] }
                                  }));
                                }}
                                className="text-xs font-bold text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 flex items-center gap-1.5"
                              >
                                🎲 Pick Random Topic
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {topicsForSubject.map(t => {
                                const isTopicSelected = config.topics.includes(t.topic);
                                return (
                                  <label 
                                    key={t.topic} 
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                      isTopicSelected 
                                        ? 'border-primary/50 bg-primary/5' 
                                        : 'border-border/50 bg-bg-primary hover:border-border'
                                    }`}
                                  >
                                    <div className="mt-0.5">
                                      <input
                                        type="checkbox"
                                        checked={isTopicSelected}
                                        onChange={(e) => {
                                          setMockSubjectConfig(prev => ({
                                            ...prev,
                                            [subject]: {
                                              ...prev[subject],
                                              topics: e.target.checked
                                                ? [...prev[subject].topics, t.topic]
                                                : prev[subject].topics.filter(x => x !== t.topic)
                                            }
                                          }));
                                        }}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${isTopicSelected ? 'text-primary' : 'text-text-primary'}`}>
                                        {t.topic}
                                      </p>
                                      <p className="text-xs text-text-muted mt-0.5">{t.count} questions available</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            
                            {warning && (
                              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                <div className="text-amber-500 mt-0.5">⚠️</div>
                                <p className="text-sm text-amber-600/90 font-medium">
                                  {warning.message}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
