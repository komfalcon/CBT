import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components';
import { Book, Calendar, CheckSquare, Clock } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const JAMB_SYLLABUS: Record<string, string[]> = {
  physics: ['Motion', 'Energy', 'Waves', 'Thermodynamics', 'Electricity', 'Magnetism', 'Modern Physics', 'Optics'],
  chemistry: ['Atomic Structure', 'Bonding', 'States of Matter', 'Acids & Bases', 'Organic Chemistry', 'Metals', 'Non-metals', 'Stoichiometry'],
  math: ['Algebra', 'Calculus', 'Trigonometry', 'Statistics', 'Probability', 'Geometry', 'Matrices'],
  english: ['Comprehension', 'Lexis and Structure', 'Oral English', 'Synonyms', 'Antonyms', 'Idioms'],
  biology: ['Cell Biology', 'Genetics', 'Ecology', 'Evolution', 'Human Anatomy', 'Plant Physiology']
};

export default function ExamHub() {
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newSession, setNewSession] = useState({ subject: 'physics', topic: '', startTime: '', endTime: '' });
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/auth?mode=login');
        return;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      
      const syllabusRes = await fetch(`${apiBase}/study/syllabus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const timetableRes = await fetch(`${apiBase}/study/timetable`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (syllabusRes.ok) {
        const contentType = syllabusRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setSyllabus(await syllabusRes.json());
        }
      }
      if (timetableRes.ok) {
        const contentType = timetableRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setTimetable(await timetableRes.json());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = async (subject: string, topic: string, currentCompleted: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const res = await fetch(`${apiBase}/study/syllabus/${subject}/topic`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          topic,
          completed: !currentCompleted
        })
      });

      if (res.ok) {
        fetchHubData(); // Refresh syllabus data
      }
    } catch (err) {
      console.error('Failed to toggle topic', err);
    }
  };

  const handleAddSession = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
      const res = await fetch(`${apiBase}/study/timetable/session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          subject: newSession.subject,
          topic: newSession.topic || 'General Revision',
          startTime: new Date(newSession.startTime).toISOString(),
          endTime: new Date(newSession.endTime).toISOString()
        })
      });

      if (res.ok) {
        setIsAddingSession(false);
        setNewSession({ subject: 'physics', topic: '', startTime: '', endTime: '' });
        fetchHubData(); // Refresh data
      } else {
        alert('Failed to add study session');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding study session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans overflow-auto relative">
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              CBT Exam Hub
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 grid gap-8 md:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">Syllabus Tracker</h3>
          </div>
          {Object.keys(JAMB_SYLLABUS).map((subjectKey) => {
            const subjectData = syllabus.find(s => s.subject === subjectKey) || { completedTopics: [] };
            const allTopics = JAMB_SYLLABUS[subjectKey];
            const completedCount = subjectData.completedTopics.filter((t: string) => allTopics.includes(t)).length;
            const progressPct = Math.round((completedCount / allTopics.length) * 100);
            const isExpanded = expandedSubject === subjectKey;

            return (
              <div key={subjectKey} className="border border-border p-4 rounded-xl bg-bg-secondary/50">
                <div 
                  className="flex justify-between items-center mb-2 cursor-pointer"
                  onClick={() => setExpandedSubject(isExpanded ? null : subjectKey)}
                >
                  <span className="text-xs font-bold text-slate-200 capitalize">{subjectKey}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{progressPct}% Mastered</Badge>
                    <span className="text-[10px] text-text-muted">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-primary h-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                
                {isExpanded && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <p className="text-[10px] text-text-secondary mb-2">Check off topics as you study. AI will also automatically check these off when you score highly on CBT quizzes.</p>
                    {allTopics.map(topic => {
                      const isCompleted = subjectData.completedTopics.includes(topic);
                      return (
                        <div key={topic} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={isCompleted}
                            onChange={() => handleToggleTopic(subjectKey, topic, isCompleted)}
                            className="cursor-pointer h-3 w-3 accent-primary"
                          />
                          <span className={`text-xs ${isCompleted ? 'text-text-muted line-through' : 'text-slate-300'}`}>
                            {topic}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">Study Timetable</h3>
          </div>
          {timetable?.sessions?.length > 0 ? (
            <div className="space-y-3">
              {timetable.sessions.map((session: any) => (
                <div key={session._id} className="border border-border p-3 rounded-lg flex justify-between items-center bg-bg-secondary">
                  <div>
                    <div className="text-xs font-bold">{session.subject.toUpperCase()}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{session.topic}</div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <Clock className="w-3 h-3 text-text-secondary" />
                    <span className="text-[10px] font-medium text-text-secondary">
                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-text-secondary mb-3">No study sessions scheduled.</p>
            </div>
          )}

          {isAddingSession ? (
            <div className="mt-4 p-4 border border-border rounded-lg bg-bg-secondary space-y-3">
              <h4 className="text-xs font-bold mb-2">New Session</h4>
              <div>
                <label className="text-[10px] text-text-secondary block mb-1">Subject</label>
                <select 
                  className="w-full bg-slate-900 border border-border rounded px-2 py-1 text-xs text-white"
                  value={newSession.subject} 
                  onChange={(e) => setNewSession({...newSession, subject: e.target.value})}
                >
                  <option value="math">Mathematics</option>
                  <option value="english">English</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-secondary block mb-1">Topic (optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Motion"
                  className="w-full bg-slate-900 border border-border rounded px-2 py-1 text-xs text-white"
                  value={newSession.topic}
                  onChange={(e) => setNewSession({...newSession, topic: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-text-secondary block mb-1">Start Time</label>
                  <input 
                    type="datetime-local"
                    className="w-full bg-slate-900 border border-border rounded px-2 py-1 text-xs text-white"
                    value={newSession.startTime}
                    onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-text-secondary block mb-1">End Time</label>
                  <input 
                    type="datetime-local"
                    className="w-full bg-slate-900 border border-border rounded px-2 py-1 text-xs text-white"
                    value={newSession.endTime}
                    onChange={(e) => setNewSession({...newSession, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button size="sm" variant="secondary" onClick={() => setIsAddingSession(false)}>Cancel</Button>
                <Button size="sm" variant="primary" onClick={handleAddSession}>Save Session</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex justify-center">
              <Button size="sm" variant="secondary" onClick={() => setIsAddingSession(true)}>Add Study Session</Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
