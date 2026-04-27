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
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 bg-background p-6 text-text-primary">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Question Bank</h1>
        <p className="text-sm text-gray-600">Manage questions, search, stats, and bulk import.</p>
        <input
          className="w-full rounded border p-2"
          placeholder="Paste examiner/admin JWT token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="mb-2 font-medium">Search Questions</h2>
          <form className="space-y-2" onSubmit={performSearch}>
            <input
              className="w-full rounded border p-2"
              placeholder="Search question text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="flex gap-2">
              <button className="rounded border px-3 py-1" type="submit">
                Search
              </button>
              <button className="rounded border px-3 py-1" onClick={loadQuestions} type="button">
                Load All
              </button>
              <button className="rounded border px-3 py-1" onClick={loadStats} type="button">
                Load Stats
              </button>
            </div>
          </form>
          <p className="mt-3 text-sm">Total results: {listResult.total}</p>
          <ul className="mt-2 max-h-72 space-y-2 overflow-auto">
            {listResult.data.map((question) => (
              <li key={String(question.questionId)} className="rounded border p-2 text-sm">
                <p className="font-medium">{String(question.question_text)}</p>
                <p className="text-xs text-gray-600">
                  {String(question.subject)} • {String(question.topic)} • difficulty {String(question.difficulty_level)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border p-4">
          <h2 className="mb-2 font-medium">Create Question</h2>
          <form className="space-y-2" onSubmit={submitCreateQuestion}>
            <input
              className="w-full rounded border p-2"
              placeholder="Subject"
              value={createState.subject}
              onChange={(event) => setCreateState((prev) => ({ ...prev, subject: event.target.value }))}
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Topic"
              value={createState.topic}
              onChange={(event) => setCreateState((prev) => ({ ...prev, topic: event.target.value }))}
            />
            <textarea
              className="min-h-20 w-full rounded border p-2"
              placeholder="Question text"
              value={createState.question_text}
              onChange={(event) =>
                setCreateState((prev) => ({ ...prev, question_text: event.target.value }))
              }
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Option A"
              value={createState.option_a}
              onChange={(event) => setCreateState((prev) => ({ ...prev, option_a: event.target.value }))}
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Option B"
              value={createState.option_b}
              onChange={(event) => setCreateState((prev) => ({ ...prev, option_b: event.target.value }))}
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Option C"
              value={createState.option_c}
              onChange={(event) => setCreateState((prev) => ({ ...prev, option_c: event.target.value }))}
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Option D"
              value={createState.option_d}
              onChange={(event) => setCreateState((prev) => ({ ...prev, option_d: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full rounded border p-2"
                placeholder="Correct option"
                value={createState.correct_option}
                onChange={(event) =>
                  setCreateState((prev) => ({ ...prev, correct_option: event.target.value.toUpperCase() }))
                }
              />
              <input
                className="w-full rounded border p-2"
                placeholder="Difficulty (1-5)"
                type="number"
                min={1}
                max={5}
                value={createState.difficulty_level}
                onChange={(event) =>
                  setCreateState((prev) => ({ ...prev, difficulty_level: Number(event.target.value) }))
                }
              />
            </div>
            <input
              className="w-full rounded border p-2"
              placeholder="Tags (comma-separated)"
              value={createState.tags}
              onChange={(event) => setCreateState((prev) => ({ ...prev, tags: event.target.value }))}
            />
            <button className="rounded bg-primary px-4 py-2 text-white" type="submit">
              Save Draft
            </button>
          </form>
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="mb-2 font-medium">Bulk Import (CSV/XLSX/XLS)</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
          />
          <button className="rounded border px-3 py-1" onClick={handleImportUpload} type="button">
            Upload
          </button>
          <button className="rounded border px-3 py-1" onClick={handleCommitImport} type="button">
            Commit Import
          </button>
        </div>

        {importUpload.importId && (
          <div className="mt-3 text-sm">
            <p>Import ID: {importUpload.importId}</p>
            <p>Rows detected: {importUpload.totalRows}</p>
            <p>Detected columns: {(importUpload.columns ?? []).join(', ')}</p>
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(importUpload.preview ?? [], null, 2)}
            </pre>
          </div>
        )}
      </section>

      <section className="rounded border p-4">
        <h2 className="mb-2 font-medium">Published Subject Counts</h2>
        <ul className="list-disc pl-5 text-sm">
          {subjects.map((entry) => (
            <li key={entry.subject}>
              {entry.subject}: {entry.count}
            </li>
          ))}
        </ul>
        {stats && (
          <pre className="mt-3 overflow-auto rounded bg-gray-50 p-2 text-xs">
            {JSON.stringify(stats, null, 2)}
          </pre>
        )}
      </section>

      {message && <p className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">{message}</p>}
    </main>
  );
}
