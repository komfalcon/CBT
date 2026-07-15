import { FormEvent, useMemo, useState } from 'react';
import {
  commitImport,
  createQuestion,
  getQuestionStats,
  getQuestions,
  getQuestionSubjects,
  searchQuestions,
  uploadImportFile,
} from './api';
import { Button, Card, Input, Alert } from '../../components';

const defaultCreateState = {
  subject: 'english',
  topic: '',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  question_type: 'mcq_single',
  difficulty_level: 3,
  tags: '',
};

export default function QuestionBankPage() {
  const [token, setToken] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [listResult, setListResult] = useState<{ total: number; data: Array<Record<string, unknown>> }>({
    total: 0,
    data: [],
  });
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [subjects, setSubjects] = useState<Array<{ subject: string; count: number }>>([]);
  const [createState, setCreateState] = useState(defaultCreateState);
  const [importUpload, setImportUpload] = useState<{
    importId?: string;
    columns?: string[];
    preview?: Record<string, string>[];
    totalRows?: number;
  }>({});
  const [importFile, setImportFile] = useState<File | null>(null);

  const canUseAuthEndpoints = token.trim().length > 0;

  const columnMapping = useMemo(() => {
    const columns = importUpload.columns ?? [];
    const mapping: Record<string, string> = {};
    const expectedColumns = [
      'question_text',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_option',
      'subject',
      'option_e',
      'topic',
      'subtopic',
      'difficulty_level',
      'year_sourced',
      'explanation',
      'bloom_level',
      'tags',
      'question_type',
      'estimated_solve_time_seconds',
    ];

    expectedColumns.forEach((column) => {
      const direct = columns.find((entry) => entry.toLowerCase() === column);
      if (direct) {
        mapping[column] = direct;
      }
    });

    return mapping;
  }, [importUpload.columns]);

  const loadQuestions = async () => {
    if (!canUseAuthEndpoints) {
      setMessage('Provide a JWT access token first.');
      return;
    }

    try {
      const response = await getQuestions(token, { page: 1, limit: 20 });
      setListResult({ total: response.total, data: response.data });
      setMessage('Loaded questions.');
    } catch (error) {
      setMessage('Failed to load questions.');
      console.error(error);
    }
  };

  const performSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setMessage('Enter a search query.');
      return;
    }

    try {
      const response = await searchQuestions(query, { page: 1, limit: 20 });
      setListResult({ total: response.total, data: response.data });
      setMessage('Search completed.');
    } catch (error) {
      setMessage('Search failed.');
      console.error(error);
    }
  };

  const loadStats = async () => {
    if (!canUseAuthEndpoints) {
      setMessage('Provide a JWT access token first.');
      return;
    }

    try {
      const [statsResponse, subjectsResponse] = await Promise.all([
        getQuestionStats(token),
        getQuestionSubjects(),
      ]);
      setStats(statsResponse as Record<string, unknown>);
      setSubjects(subjectsResponse);
      setMessage('Loaded question stats.');
    } catch (error) {
      setMessage('Failed to load stats.');
      console.error(error);
    }
  };

  const submitCreateQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!canUseAuthEndpoints) {
      setMessage('Provide a JWT access token first.');
      return;
    }

    try {
      const payload = {
        subject: createState.subject,
        topic: createState.topic,
        question_text: createState.question_text,
        options: [
          { id: 'A' as const, text: createState.option_a },
          { id: 'B' as const, text: createState.option_b },
          { id: 'C' as const, text: createState.option_c },
          { id: 'D' as const, text: createState.option_d },
        ],
        correct_option: createState.correct_option,
        question_type: createState.question_type,
        difficulty_level: Number(createState.difficulty_level),
        tags: createState.tags
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      };

      await createQuestion(token, payload);
      setCreateState(defaultCreateState);
      setMessage('Question created successfully.');
      await loadQuestions();
    } catch (error) {
      setMessage('Question creation failed.');
      console.error(error);
    }
  };

  const handleImportUpload = async () => {
    if (!canUseAuthEndpoints) {
      setMessage('Provide a JWT access token first.');
      return;
    }

    if (!importFile) {
      setMessage('Select an import file first.');
      return;
    }

    try {
      const uploaded = await uploadImportFile(token, importFile);
      setImportUpload(uploaded);
      setMessage(`Import uploaded. ${uploaded.totalRows} rows detected.`);
    } catch (error) {
      setMessage('Import upload failed.');
      console.error(error);
    }
  };

  const handleCommitImport = async () => {
    if (!canUseAuthEndpoints) {
      setMessage('Provide a JWT access token first.');
      return;
    }

    if (!importUpload.importId) {
      setMessage('Upload and preview an import first.');
      return;
    }

    try {
      const response = await commitImport(token, {
        importId: importUpload.importId,
        columnMapping,
      });
      setMessage(`Import committed: ${JSON.stringify(response)}`);
      await loadQuestions();
    } catch (error) {
      setMessage('Import commit failed.');
      console.error(error);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 bg-bg-primary p-6 text-text-primary md:p-8">
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Question Bank Management
        </h1>
        <p className="text-xs text-text-secondary">
          Manage, search, view stats, and perform bulk question imports for CBT.
        </p>
        <Input
          label="Examiner/Admin JWT Token"
          placeholder="Paste examiner/admin JWT token to authorize changes..."
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Search Questions */}
        <Card className="flex flex-col h-full">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary border-b border-border pb-3 mb-4">
            Search Questions
          </h2>
          <form className="space-y-4" onSubmit={performSearch}>
            <Input
              label="Search Query"
              placeholder="Search question text..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Search
              </Button>
              <Button variant="secondary" size="sm" onClick={loadQuestions} type="button">
                Load All
              </Button>
              <Button variant="secondary" size="sm" onClick={loadStats} type="button">
                Load Stats
              </Button>
            </div>
          </form>
          <div className="mt-4 pt-4 border-t border-border flex-1 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Total results: <strong className="text-primary">{listResult.total}</strong>
            </span>
            <ul className="mt-3 max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {listResult.data.map((question) => (
                <li
                  key={String(question.questionId)}
                  className="rounded-xl border border-border bg-bg-secondary/20 p-3 text-xs leading-relaxed transition-all hover:bg-bg-secondary/40"
                >
                  <p className="font-semibold text-text-primary">{String(question.question_text)}</p>
                  <p className="text-[10px] text-text-muted mt-1.5 font-medium uppercase tracking-wider">
                    {String(question.subject)} • {String(question.topic)} • Difficulty {String(question.difficulty_level)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Create Question */}
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary border-b border-border pb-3 mb-4">
            Create Question
          </h2>
          <form className="space-y-4" onSubmit={submitCreateQuestion}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Subject"
                placeholder="e.g. english, mathematics"
                value={createState.subject}
                onChange={(event) => setCreateState((prev) => ({ ...prev, subject: event.target.value }))}
              />
              <Input
                label="Topic"
                placeholder="e.g. Calculus, Mechanics"
                value={createState.topic}
                onChange={(event) => setCreateState((prev) => ({ ...prev, topic: event.target.value }))}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Question Text
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl bg-bg-secondary border border-border p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                placeholder="Write question stem text..."
                value={createState.question_text}
                onChange={(event) =>
                  setCreateState((prev) => ({ ...prev, question_text: event.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Option A"
                placeholder="Option A text..."
                value={createState.option_a}
                onChange={(event) => setCreateState((prev) => ({ ...prev, option_a: event.target.value }))}
              />
              <Input
                label="Option B"
                placeholder="Option B text..."
                value={createState.option_b}
                onChange={(event) => setCreateState((prev) => ({ ...prev, option_b: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Option C"
                placeholder="Option C text..."
                value={createState.option_c}
                onChange={(event) => setCreateState((prev) => ({ ...prev, option_c: event.target.value }))}
              />
              <Input
                label="Option D"
                placeholder="Option D text..."
                value={createState.option_d}
                onChange={(event) => setCreateState((prev) => ({ ...prev, option_d: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Correct Option"
                placeholder="e.g. A, B, C, D"
                value={createState.correct_option}
                onChange={(event) =>
                  setCreateState((prev) => ({ ...prev, correct_option: event.target.value.toUpperCase() }))
                }
              />
              <Input
                label="Difficulty (1-5)"
                placeholder="Difficulty level..."
                type="number"
                min={1}
                max={5}
                value={createState.difficulty_level}
                onChange={(event) =>
                  setCreateState((prev) => ({ ...prev, difficulty_level: Number(event.target.value) }))
                }
              />
            </div>

            <Input
              label="Tags"
              placeholder="comma-separated tags..."
              value={createState.tags}
              onChange={(event) => setCreateState((prev) => ({ ...prev, tags: event.target.value }))}
            />

            <Button type="submit" className="w-full">
              Save Draft
            </Button>
          </form>
        </Card>
      </div>

      {/* Bulk Import */}
      <Card className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary border-b border-border pb-3 mb-2">
          Bulk Import (CSV/XLSX/XLS)
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="text-xs text-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-border file:bg-bg-secondary file:text-text-primary hover:file:bg-bg-secondary/80 cursor-pointer focus:outline-none"
            onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleImportUpload}>
              Upload File
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCommitImport}>
              Commit Import
            </Button>
          </div>
        </div>

        {importUpload.importId && (
          <div className="mt-4 pt-4 border-t border-border text-xs text-text-secondary space-y-2 animate-in fade-in duration-200">
            <p>Import ID: <strong className="text-primary font-mono">{importUpload.importId}</strong></p>
            <p>Rows detected: <strong className="text-text-primary">{importUpload.totalRows}</strong></p>
            <p>Detected columns: <strong className="text-text-primary">{(importUpload.columns ?? []).join(', ')}</strong></p>
            <pre className="mt-2 overflow-auto rounded-xl border border-border bg-bg-secondary/40 p-3 text-[10px] max-h-60 font-mono text-text-secondary leading-relaxed">
              {JSON.stringify(importUpload.preview ?? [], null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Published Subject Counts */}
      <Card>
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary border-b border-border pb-3 mb-4">
          Published Subject Counts
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {subjects.map((entry) => (
            <div
              key={entry.subject}
              className="rounded-xl border border-border bg-bg-secondary/20 p-3.5 text-xs text-center flex flex-col justify-center"
            >
              <span className="text-text-secondary uppercase font-bold tracking-wider text-[9px] mb-1">
                {entry.subject}
              </span>
              <span className="text-lg font-bold text-white">{entry.count} Qs</span>
            </div>
          ))}
        </div>
        {stats && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Detailed Stats JSON</span>
            <pre className="mt-2 overflow-auto rounded-xl border border-border bg-bg-secondary/40 p-3 text-[10px] max-h-60 font-mono text-text-secondary leading-relaxed">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {message && (
        <Alert variant="info" className="mt-4">
          {message}
        </Alert>
      )}
    </main>
  );
}
