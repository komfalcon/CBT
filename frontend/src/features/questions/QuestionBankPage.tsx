import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Database,
  Search,
  PlusCircle,
  UploadCloud,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  X,
  FileCheck2,
} from 'lucide-react';
import {
  commitImport,
  createQuestion,
  getQuestionStats,
  getQuestions,
  getQuestionSubjects,
  searchQuestions,
  uploadImportFile,
  triggerAiGeneration,
  stopAiGeneration,
  getAiGenerationStatus,
  triggerPdfScan,
  getPdfScanStatus,
  uploadAndScanPdfFile,
  QuestionRecord,
  QuestionOption,
} from './api';
import { Button, Card, Input, Alert, Badge, AppNavbar } from '../../components';
import { StudentLayout } from '../../components/StudentLayout';
import { SmartTextRenderer, DiagramRenderer, cleanOptionText } from '../../components/QuestionCard';

const AVAILABLE_SUBJECTS = [
  { value: 'english', label: 'Use of English' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'economics', label: 'Economics' },
  { value: 'government', label: 'Government' },
  { value: 'literature', label: 'Literature in English' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'accounting', label: 'Financial Accounting' },
  { value: 'geography', label: 'Geography' },
  { value: 'agriculture', label: 'Agricultural Science' },
  { value: 'civic_education', label: 'Civic Education' },
  { value: 'crk', label: 'Christian Religious Studies' },
  { value: 'irk', label: 'Islamic Religious Studies' },
  { value: 'history', label: 'History' },
  { value: 'further_mathematics', label: 'Further Mathematics' },
];

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
  explanation: '',
  tags: '',
};

type ActiveTab = 'browse' | 'create' | 'import' | 'pdf_scanner' | 'ai_generator' | 'stats';

export default function QuestionBankPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const [query, setQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const [student, setStudent] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedEra, setSelectedEra] = useState<string>('recent');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [falkeDialectMap, setFalkeDialectMap] = useState<Record<string, 'english' | 'pidgin'>>({});

  useEffect(() => {
    if (!isAdminView) {
      import('../../features/auth/api').then(({ getMe }) => {
        getMe().then((data) => setStudent(data)).catch(() => {});
      });
    }

    const params = new URLSearchParams(location.search);
    const subParam = params.get('subject');
    if (subParam) setSelectedSubjectFilter(subParam);
    const modeParam = params.get('mode');
    if (modeParam === 'past') {
      // past questions mode filters
      setSelectedEra('vintage');
    }
  }, [location.search, isAdminView]);

  // PDF Scanner State
  const [pdfDirPath, setPdfDirPath] = useState('');
  const [pdfScanProgress, setPdfScanProgress] = useState<{
    isScanning?: boolean;
    currentDirectory?: string;
    scannedFiles?: string[];
    currentFile?: string | null;
    totalExtractedQuestions?: number;
    logs?: string[];
  }>({});
  const [isPdfScanLoading, setIsPdfScanLoading] = useState(false);

  // AI Question Generator State
  const [aiSubject, setAiSubject] = useState('english');
  const [aiSourceType, setAiSourceType] = useState<
    'mixed_curriculum' | 'new_text' | 'calculation_latex' | 'new_svg_diagram' | 'passage_comprehension'
  >('mixed_curriculum');
  const [aiTargetCount, setAiTargetCount] = useState<number>(30000);
  const [customTargetCount, setCustomTargetCount] = useState<string>('30000');
  const [useCustomTarget, setUseCustomTarget] = useState<boolean>(false);
  const [selectedTopicsInput, setSelectedTopicsInput] = useState<string>('');

  const [aiGenStatus, setAiGenStatus] = useState<{
    isRunning?: boolean;
    activeJob?: { subject: string; sourceType: string; targetCount: number } | null;
    generatedInCurrentJob?: number;
    totalStats?: {
      newText: number;
      newSvgDiagram: number;
      scannedPastPaper: number;
      bySubject: Record<string, { newText: number; newSvgDiagram: number; scannedPastPaper: number }>;
    };
  }>({});
  const [isAiGenLoading, setIsAiGenLoading] = useState(false);

  // Browse state
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);

  // Subject Stats state
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [subjectsList, setSubjectsList] = useState<Array<{ subject: string; count: number }>>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Create Question state
  const [createState, setCreateState] = useState(defaultCreateState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importUpload, setImportUpload] = useState<{
    importId?: string;
    columns?: string[];
    preview?: Record<string, string>[];
    totalRows?: number;
  }>({});

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 6000);
  };

  // Load questions based on current page, subject filter, and search query
  const loadQuestionBank = useCallback(async (targetPage = 1, searchQuery = query, subjectFilter = selectedSubjectFilter) => {
    setIsLoading(true);
    try {
      if (searchQuery.trim()) {
        const response = await searchQuestions(searchQuery.trim(), {
          page: targetPage,
          limit: pageSize,
          ...(subjectFilter ? { subject: subjectFilter } : {}),
        });
        setQuestions(response.data || []);
        setTotalQuestions(response.total || 0);
        setPage(response.page || targetPage);
      } else {
        const response = await getQuestions(undefined, {
          page: targetPage,
          limit: pageSize,
          ...(subjectFilter ? { subject: subjectFilter } : {}),
        });
        setQuestions(response.data || []);
        setTotalQuestions(response.total || 0);
        setPage(response.page || targetPage);
      }
    } catch (err: unknown) {
      console.error('Failed to load questions:', err);
      showToast('error', 'Unable to retrieve questions. Verify your administrative session.');
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedSubjectFilter, pageSize]);

  // Load subject statistics
  const loadStatsData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, subjectsRes] = await Promise.all([
        getQuestionStats().catch(() => null),
        getQuestionSubjects().catch(() => []),
      ]);
      if (statsRes) setStats(statsRes as Record<string, unknown>);
      if (Array.isArray(subjectsRes)) setSubjectsList(subjectsRes);
    } catch (err: unknown) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadQuestionBank(1);
    loadStatsData();
  }, [loadQuestionBank, loadStatsData]);

  // Debounced or direct search submit
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadQuestionBank(1, query, selectedSubjectFilter);
  };

  const handleClearSearch = () => {
    setQuery('');
    setPage(1);
    loadQuestionBank(1, '', selectedSubjectFilter);
  };

  const handleSubjectFilterChange = (newSubject: string) => {
    setSelectedSubjectFilter(newSubject);
    setPage(1);
    loadQuestionBank(1, query, newSubject);
  };

  // Submit Create Question
  const handleCreateQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!createState.question_text.trim()) {
      showToast('error', 'Question stem text is required.');
      return;
    }
    if (!createState.option_a.trim() || !createState.option_b.trim()) {
      showToast('error', 'At least Options A and B must be provided.');
      return;
    }

    setIsSubmitting(true);
    try {
      const options: QuestionOption[] = [
        { id: 'A', text: createState.option_a },
        { id: 'B', text: createState.option_b },
      ];
      if (createState.option_c.trim()) options.push({ id: 'C', text: createState.option_c });
      if (createState.option_d.trim()) options.push({ id: 'D', text: createState.option_d });

      const payload = {
        subject: createState.subject,
        topic: createState.topic.trim() || 'General',
        question_text: createState.question_text.trim(),
        options,
        correct_option: createState.correct_option,
        question_type: createState.question_type,
        difficulty_level: Number(createState.difficulty_level) || 3,
        tags: createState.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await createQuestion(undefined, payload);
      showToast('success', 'Question successfully saved and added to the curriculum bank!');
      setCreateState(defaultCreateState);
      loadQuestionBank(1);
      loadStatsData();
      setActiveTab('browse');
    } catch (err: unknown) {
      console.error('Failed to create question:', err);
      showToast('error', 'Could not save question. Please verify input fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Import Column Mapping
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
      'topic',
      'difficulty_level',
      'explanation',
      'tags',
    ];

    expectedColumns.forEach((col) => {
      const direct = columns.find((c) => c.toLowerCase() === col);
      if (direct) {
        mapping[col] = direct;
      }
    });

    return mapping;
  }, [importUpload.columns]);

  const handleImportUpload = async () => {
    if (!importFile) {
      showToast('error', 'Please select a CSV or Excel file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadImportFile(undefined, importFile);
      setImportUpload(res);
      showToast('success', `File inspected! ${res.totalRows} candidate question rows detected.`);
    } catch (err: unknown) {
      console.error('Failed to upload file:', err);
      showToast('error', 'Upload failed. Ensure the file is a valid CSV or XLSX format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importUpload.importId) {
      showToast('error', 'Please upload and preview a question set first.');
      return;
    }

    setIsCommitting(true);
    try {
      await commitImport(undefined, {
        importId: importUpload.importId,
        columnMapping,
        async: false,
      });
      setActiveTab('browse');
    } catch (err: unknown) {
      console.error('Commit import failed:', err);
      showToast('error', 'Failed to commit import. Please review your file format.');
    } finally {
      setIsCommitting(false);
    }
  };

  // PDF Scanner Handlers & Polling
  const loadPdfScanStatus = useCallback(async () => {
    try {
      const status = await getPdfScanStatus(undefined);
      setPdfScanProgress(status);
    } catch (e) {
      console.error('Failed to load PDF scan status:', e);
    }
  }, []);

  const [isPdfUploadLoading, setIsPdfUploadLoading] = useState(false);

  const handleStartPdfScan = async () => {
    setIsPdfScanLoading(true);
    try {
      const res = await triggerPdfScan(undefined, pdfDirPath);
      showToast('info', res.message || 'Started scanning PDF past papers.');
      loadPdfScanStatus();
    } catch (e: any) {
      showToast('error', e.response?.data?.message || 'Failed to start PDF scanner.');
    } finally {
      setIsPdfScanLoading(false);
    }
  };

  const handleUploadAndScanPdfFile = async (file: File) => {
    setIsPdfUploadLoading(true);
    try {
      showToast('info', `Uploading and scanning '${file.name}' with Falke AI past paper scanner...`);
      const res = await uploadAndScanPdfFile(undefined, file);
      if (res.success) {
        if (res.extractedCount > 0) {
          showToast('success', res.message || `Extracted ${res.extractedCount} questions from '${file.name}'!`);
        } else {
          showToast('info', res.message || `Processed '${file.name}', 0 questions extracted.`);
        }
        loadPdfScanStatus();
        loadQuestionBank(1);
        loadStatsData();
      } else {
        showToast('error', res.message || 'Could not extract questions from PDF.');
      }
    } catch (e: any) {
      showToast('error', e.response?.data?.message || 'Failed to upload and scan PDF file.');
    } finally {
      setIsPdfUploadLoading(false);
    }
  };

  // AI Generator Handlers & Polling
  const loadAiGenStatus = useCallback(async () => {
    try {
      const status = await getAiGenerationStatus(undefined);
      setAiGenStatus(status);
    } catch (e) {
      console.error('Failed to load AI generation status:', e);
    }
  }, []);

  const handleStartAiGen = async () => {
    setIsAiGenLoading(true);
    const target = useCustomTarget ? (Number(customTargetCount) || 30000) : aiTargetCount;
    const topicsArr = selectedTopicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await triggerAiGeneration(undefined, {
        subject: aiSubject,
        sourceType: aiSourceType,
        targetCount: target,
        topics: topicsArr.length > 0 ? topicsArr : undefined,
      });
      showToast('success', res.message || `Started background AI generation targeting ${target.toLocaleString()} questions.`);
      loadAiGenStatus();
    } catch (e: any) {
      showToast('error', e.response?.data?.message || 'Failed to start AI generation job.');
    } finally {
      setIsAiGenLoading(false);
    }
  };

  const handleStopAiGen = async () => {
    try {
      const res = await stopAiGeneration(undefined);
      showToast('info', res.message || 'Stopped AI generation job.');
      loadAiGenStatus();
    } catch (e: any) {
      showToast('error', 'Failed to stop AI generation job.');
    }
  };

  // Always check AI Generation & PDF Scanner status on mount and poll continuously
  useEffect(() => {
    loadAiGenStatus();
    loadPdfScanStatus();

    const interval = setInterval(() => {
      loadAiGenStatus();
      loadPdfScanStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadAiGenStatus, loadPdfScanStatus]);


  // Generate downloadable sample CSV
  const downloadSampleCsv = () => {
    const csvContent =
      'subject,topic,question_text,option_a,option_b,option_c,option_d,correct_option,difficulty_level,explanation\n' +
      'english,Lexis & Structure,"Choose the word that is opposite in meaning to CANDID:","Deceitful","Frank","Honest","Straightforward",A,2,"Candid means frank or direct; deceitful is its antonym."\n' +
      'mathematics,Calculus,"Differentiate y = 3x^2 + 5x with respect to x:","6x + 5","3x + 5","6x^2 + 5","6x",A,3,"dy/dx of 3x^2 + 5x is 6x + 5."\n' +
      'physics,Mechanics,"A car accelerates uniformly from rest at 2 m/s^2 for 5 seconds. What is its final velocity?","10 m/s","5 m/s","20 m/s","2.5 m/s",A,2,"v = u + at = 0 + 2(5) = 10 m/s."\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aurikrex_question_bank_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalQuestions / pageSize) || 1;

  const getDifficultyBadge = (level: number) => {
    switch (level) {
      case 1:
        return <Badge variant="success">Level 1 (Easy)</Badge>;
      case 2:
        return <Badge variant="success">Level 2 (Moderate)</Badge>;
      case 3:
        return <Badge variant="warning">Level 3 (Intermediate)</Badge>;
      case 4:
        return <Badge variant="warning">Level 4 (Advanced)</Badge>;
      case 5:
        return <Badge variant="error">Level 5 (Expert)</Badge>;
      default:
        return <Badge variant="info">Level {level}</Badge>;
    }
  };

  const content = (
    <div className={isAdminView ? "space-y-6" : "w-full space-y-6"}>
      {/* ========================================================================= */}
      {/* HERO HEADER SECTION                                                       */}
      {/* ========================================================================= */}
      <section className="relative rounded-2xl bg-gradient-to-r from-bg-secondary-dark via-surface-container-low to-bg-card-dark border border-border-dark p-6 md:p-8 overflow-hidden shadow-md">
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-accent-royal-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 w-64 h-32 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-border-hover-dark text-secondary">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="text-label-sm font-label-sm font-semibold tracking-wide">17 Accredited Subjects · Standard UTME Archive</span>
            </div>
            <h1 className="text-headline-lg font-headline-lg text-text-primary-dark tracking-tight leading-tight">
              JAMB UTME Past Question Bank &amp; Drill Explorer (1983–2024)
            </h1>
            <p className="text-body-md font-body-md text-text-secondary-dark">
              Search, filter, and launch targeted diagnostic drills across all 17 accredited JAMB subjects with zero-downtime Falke AI explanations.
            </p>
          </div>
          <div className="flex sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-high/80 border border-border-dark backdrop-blur-sm">
              <span className="material-symbols-outlined text-tertiary text-[24px]">verified_user</span>
              <div>
                <div className="text-mono-data font-mono-data text-tertiary font-bold text-[15px]">100% Curated</div>
                <div className="text-label-sm font-label-sm text-text-secondary-dark">Standard Syllabus Aligned</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-high/80 border border-border-dark backdrop-blur-sm">
              <span className="material-symbols-outlined text-accent-ai-gold text-[24px]">bolt</span>
              <div>
                <div className="text-mono-data font-mono-data text-accent-ai-gold font-bold text-[15px]">0ms Instant Cache</div>
                <div className="text-label-sm font-label-sm text-text-secondary-dark">Pre-indexed Falke AI Engine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ADVANCED FILTER CONSOLE                                                   */}
      {/* ========================================================================= */}
      <section className="bg-bg-secondary-dark border border-border-dark rounded-xl p-5 space-y-4 shadow-sm">
        {/* Top Row: Global Search Input + Difficulty Badges */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted-dark text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by keyword, formula, or question excerpt... [Ctrl + K]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-2.5 bg-surface-container-low border border-border-dark rounded-xl text-text-primary-dark placeholder-text-muted-dark text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            {query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-dark hover:text-text-primary-dark"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-mono-data font-mono-data text-[11px] text-text-muted-dark bg-surface-container px-2 py-0.5 rounded border border-border-dark">
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
              </div>
            )}
          </form>

          {/* Difficulty Pill Group */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-label-sm font-label-sm text-text-secondary-dark mr-1 shrink-0">Difficulty:</span>
            {['all', 'foundation', 'standard', 'challenge', 'speed'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-label-sm transition-all capitalize ${
                  selectedDifficulty === diff
                    ? 'bg-accent-royal-blue text-white font-semibold border border-primary/40 shadow-sm'
                    : 'bg-surface-container text-text-secondary-dark hover:text-text-primary-dark border border-border-dark'
                }`}
              >
                {diff === 'all' ? 'All Tiers' : diff === 'standard' ? 'Standard JAMB' : diff}
              </button>
            ))}
          </div>
        </div>

        {/* 17 Subject Selector Chips (Horizontal Scrollable Carousel) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-label-sm text-text-secondary-dark font-semibold">17 Accredited Subjects:</span>
            <Link to="/syllabus" className="text-label-sm font-label-sm text-primary hover:underline">
              View Syllabus Outline
            </Link>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleSubjectFilterChange('')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-label-md font-label-md shrink-0 transition-all border ${
                selectedSubjectFilter === ''
                  ? 'bg-surface-container text-primary font-semibold border-primary shadow-sm'
                  : 'bg-surface-container-low text-text-secondary-dark hover:text-text-primary-dark border-border-dark'
              }`}
            >
              <span>All Subjects</span>
              <span className="text-mono-data text-[11px] px-1.5 py-0.2 rounded bg-surface-container text-text-muted-dark">
                {totalQuestions.toLocaleString()}
              </span>
            </button>
            {AVAILABLE_SUBJECTS.map((sub) => {
              const isSelected = selectedSubjectFilter === sub.value;
              return (
                <button
                  key={sub.value}
                  onClick={() => handleSubjectFilterChange(sub.value)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-label-md font-label-md shrink-0 transition-all border ${
                    isSelected
                      ? 'bg-surface-container text-primary font-semibold border-primary shadow-sm'
                      : 'bg-surface-container-low text-text-secondary-dark hover:text-text-primary-dark border-border-dark'
                  }`}
                >
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Filter Strip: Era Range + Topic Taxonomy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border-dark/60">
          <div>
            <label className="block text-label-sm font-label-sm text-text-secondary-dark mb-1">UTME Exam Year Range</label>
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              className="w-full bg-surface-container-low border border-border-dark rounded-xl px-3 py-2 text-text-primary-dark text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="recent">2015–2024 Recent Era (Most Relevant)</option>
              <option value="classic">2010–2014 Classic CBT Era</option>
              <option value="paper">2000–2009 Paper &amp; Pencil Vintage</option>
              <option value="foundational">1983–1999 Foundational Archives</option>
              <option value="all">All Years (1983–2024 Complete 41-Year Archive)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-label-sm font-label-sm text-text-secondary-dark">Syllabus Topic</label>
              <span className="text-label-sm font-label-sm text-accent-streak-rose font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-streak-rose" /> 55% Weak Area
              </span>
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setQuery(e.target.value);
                  loadQuestionBank(1, e.target.value, selectedSubjectFilter);
                }
              }}
              className="w-full bg-surface-container-low border border-border-dark rounded-xl px-3 py-2 text-text-primary-dark text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="">All Topics (Curriculum Stream)</option>
              <option value="Oral Forms">Oral Forms (Vowels &amp; Consonants) · Priority Drill</option>
              <option value="Lexis">Lexis &amp; Structure (Collocations, Antonyms)</option>
              <option value="Comprehension">Comprehension &amp; Summary Analysis</option>
              <option value="Calculus">Calculus &amp; Differentiation</option>
              <option value="Mechanics">Mechanics &amp; Motion</option>
            </select>
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-text-secondary-dark mb-1">Quick Action</label>
            <button
              onClick={() => navigate(`/mock-setup?subject=${selectedSubjectFilter || 'english'}`)}
              className="w-full bg-accent-royal-blue hover:bg-primary-container text-white rounded-xl px-4 py-2 font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>Launch 15m Deficit Drill</span>
            </button>
          </div>
        </div>
      </section>

      {/* Notification Toast */}
      {notification && (
        <Alert
          variant={notification.type === 'error' ? 'error' : notification.type === 'success' ? 'success' : 'info'}
          className="animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs">{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-text-muted hover:text-text-primary ml-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </Alert>
      )}

      {/* Active AI Background Generator Banner */}
      {aiGenStatus.isRunning && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/30 p-3 text-xs text-primary">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-spin text-primary shrink-0" />
            <div>
              <span className="font-bold">Falke AI Background Generator Running:</span> Subject{' '}
              <span className="capitalize font-black">{aiGenStatus.activeJob?.subject}</span> ({aiGenStatus.activeJob?.sourceType === 'new_svg_diagram' ? 'SVG Diagrams' : 'Standard Text'}).
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold self-end sm:self-auto">
            <span>Progress: {aiGenStatus.generatedInCurrentJob} / {aiGenStatus.activeJob?.targetCount}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('ai_generator')}
              className="text-[11px] h-7 px-2.5"
            >
              View Generator
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'browse'
              ? 'bg-accent-royal-blue text-white shadow-sm'
              : 'text-text-secondary-dark hover:bg-surface-container hover:text-text-primary-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">quiz</span>
          Drill Explorer
          <span
            className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === 'browse' ? 'bg-white/20 text-white' : 'bg-surface-container text-text-muted-dark'
            }`}
          >
            {totalQuestions.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'create'
              ? 'bg-accent-royal-blue text-white shadow-sm'
              : 'text-text-secondary-dark hover:bg-surface-container hover:text-text-primary-dark'
          }`}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Author Question
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'import'
              ? 'bg-accent-royal-blue text-white shadow-sm'
              : 'text-text-secondary-dark hover:bg-surface-container hover:text-text-primary-dark'
          }`}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Bulk CSV Import
        </button>

        <button
          onClick={() => setActiveTab('pdf_scanner')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'pdf_scanner'
              ? 'bg-accent-royal-blue text-white shadow-sm'
              : 'text-text-secondary-dark hover:bg-surface-container hover:text-text-primary-dark'
          }`}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          PDF Past Paper Scanner
        </button>

        <button
          onClick={() => setActiveTab('ai_generator')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'ai_generator'
              ? 'bg-accent-royal-blue text-white shadow-sm'
              : 'text-text-secondary-dark hover:bg-surface-container hover:text-text-primary-dark'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-accent-ai-gold" />
          Falke AI Generator
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-accent-royal-blue text-white shadow-sm'
              : 'text-text-secondary-dark hover:bg-surface-container hover:text-text-primary-dark'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Curriculum Analytics
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DRILL EXPLORER (BROWSE & SEARCH)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Question Explorer Feed (Cols 1-8) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-label-md font-label-md">
                <span className="text-text-primary-dark font-bold">
                  Showing {questions.length} of {totalQuestions.toLocaleString()} Questions
                </span>
                {selectedSubjectFilter && (
                  <span className="text-text-muted-dark font-normal">
                    in <span className="capitalize text-primary font-semibold">{selectedSubjectFilter}</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted-dark font-mono-data">
                Page {page} of {totalPages}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-2xl border border-border-dark bg-bg-card-dark p-6 animate-pulse space-y-4">
                    <div className="h-4 w-1/4 bg-surface-container rounded" />
                    <div className="h-6 w-3/4 bg-surface-container rounded" />
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="h-10 bg-surface-container rounded-xl" />
                      <div className="h-10 bg-surface-container rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-2xl border border-border-dark bg-bg-card-dark py-16 text-center space-y-4 p-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-text-muted-dark border border-border-dark">
                  <Database className="h-7 w-7" />
                </div>
                <h3 className="text-headline-sm font-headline-sm text-text-primary-dark">No questions found</h3>
                <p className="text-body-sm font-body-sm text-text-secondary-dark max-w-md mx-auto">
                  {query || selectedSubjectFilter
                    ? 'No questions matched your search criteria. Try modifying your filter or clearing the search query.'
                    : 'The question repository is being synchronized with the national UTME archive.'}
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  {(query || selectedSubjectFilter) && (
                    <button
                      onClick={() => {
                        setQuery('');
                        setSelectedSubjectFilter('');
                        loadQuestionBank(1, '', '');
                      }}
                      className="px-4 py-2 rounded-xl bg-surface-container text-text-primary-dark text-label-sm font-label-sm border border-border-dark hover:bg-surface-variant transition-all"
                    >
                      Reset Filters
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-xl bg-accent-royal-blue text-white text-label-sm font-label-sm font-semibold shadow hover:bg-primary-container transition-all"
                  >
                    Author Question
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const qId = q.questionId || `q-${idx}`;
                  const isExplanationOpen = expandedExplanations[qId] ?? false;
                  const dialect = falkeDialectMap[qId] || 'english';

                  return (
                    <article
                      key={qId}
                      className="bg-bg-card-dark border border-border-dark rounded-2xl p-6 space-y-5 shadow-lg hover:border-border-hover-dark transition-all"
                    >
                      {/* Card Header & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-dark/60 pb-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded bg-surface-container-high border border-border-dark text-text-primary-dark text-mono-data font-mono-data text-[12px] font-bold">
                            JAMB UTME · Q{idx + 1 + (page - 1) * pageSize}
                          </span>
                          <span className="px-2.5 py-1 rounded bg-surface-container border border-border-dark text-secondary text-label-sm font-label-sm capitalize">
                            {q.subject} {q.topic ? `· ${q.topic}` : ''}
                          </span>
                          {getDifficultyBadge(q.difficulty_level || 3)}
                          <span className="px-2 py-0.5 rounded bg-surface-container text-text-muted-dark text-mono-data font-mono-data text-[11px]">
                            1 Mark
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/mock-setup?subject=${q.subject}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low hover:bg-accent-royal-blue hover:text-white border border-border-dark text-text-secondary-dark text-label-sm font-label-sm transition-all"
                          >
                            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                            <span>Drill Topic</span>
                          </button>
                        </div>
                      </div>

                      {/* Question Stem */}
                      <div className="text-body-lg font-body-lg text-text-primary-dark font-medium leading-relaxed">
                        <SmartTextRenderer text={q.question_text} sanitizeStem />
                      </div>

                      {/* Optional Diagram */}
                      {Boolean(q.diagram_svg) && (
                        <div className="p-3 bg-surface-container-low rounded-xl border border-border-dark">
                          <DiagramRenderer svg={q.diagram_svg!} />
                        </div>
                      )}

                      {/* Options Grid */}
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {q.options.map((opt) => {
                            const isCorrect = String(opt.id).toUpperCase() === String(q.correct_option).toUpperCase();
                            return (
                              <div
                                key={opt.id}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-body-sm font-body-sm transition-all ${
                                  isCorrect
                                    ? 'bg-tertiary/10 border-tertiary text-text-primary-dark shadow-sm'
                                    : 'bg-surface-container-low border-border-dark text-text-secondary-dark'
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data text-xs font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-tertiary text-bg-primary-dark'
                                      : 'bg-surface-container text-text-muted-dark border border-border-dark'
                                  }`}
                                >
                                  {opt.id}
                                </span>
                                <span className="flex-1 mt-0.5 leading-snug">
                                  <SmartTextRenderer text={cleanOptionText(opt.text)} />
                                </span>
                                {isCorrect && (
                                  <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 self-center">
                                    check_circle
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Falke AI Drawer Toggle & Explanation */}
                      <div className="pt-2 border-t border-border-dark/60">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() =>
                              setExpandedExplanations((prev) => ({
                                ...prev,
                                [qId]: !isExplanationOpen,
                              }))
                            }
                            className="flex items-center gap-2 text-label-sm font-label-sm text-accent-ai-gold hover:underline"
                          >
                            <span className="material-symbols-outlined text-[18px]">psychology</span>
                            <span>{isExplanationOpen ? 'Hide Falke AI Explanation' : 'View Verified Solution & Falke AI Breakdown'}</span>
                            <span className="text-[10px] font-mono-data bg-accent-ai-gold/20 text-accent-ai-gold px-1.5 py-0.5 rounded">0 Coins Cache</span>
                          </button>

                          {isExplanationOpen && (
                            <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-border-dark text-xs">
                              <button
                                onClick={() => setFalkeDialectMap((prev) => ({ ...prev, [qId]: 'english' }))}
                                className={`px-2 py-0.5 rounded font-medium ${dialect === 'english' ? 'bg-accent-royal-blue text-white' : 'text-text-secondary-dark'}`}
                              >
                                English
                              </button>
                              <button
                                onClick={() => setFalkeDialectMap((prev) => ({ ...prev, [qId]: 'pidgin' }))}
                                className={`px-2 py-0.5 rounded font-medium ${dialect === 'pidgin' ? 'bg-accent-royal-blue text-white' : 'text-text-secondary-dark'}`}
                              >
                                Pidgin
                              </button>
                            </div>
                          )}
                        </div>

                        {isExplanationOpen && (
                          <div className="mt-3 p-4 rounded-xl bg-surface-container-high border border-border-dark space-y-2 text-body-sm font-body-sm text-text-secondary-dark">
                            <p>
                              <strong className="text-primary">Correct Option [{q.correct_option}]: </strong>
                              {dialect === 'english'
                                ? q.explanation || 'Standard official curriculum mapping verifies this option conforms strictly to UTME testing standards.'
                                : `Make we break am down: Option [${q.correct_option}] na the only one wey follow the correct syllabus rule without mistake!`}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border-dark pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const target = Math.max(1, page - 1);
                    setPage(target);
                    loadQuestionBank(target);
                  }}
                  disabled={page <= 1 || isLoading}
                  className="text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>

                <span className="text-xs text-text-secondary-dark font-mono-data">
                  Page <strong className="text-text-primary-dark">{page}</strong> of{' '}
                  <strong className="text-text-primary-dark">{totalPages}</strong>
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const target = Math.min(totalPages, page + 1);
                    setPage(target);
                    loadQuestionBank(target);
                  }}
                  disabled={page >= totalPages || isLoading}
                  className="text-xs gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </section>

          {/* Drill Launcher Sidebar (Cols 9-12) */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Quick Diagnostic Drill Launcher */}
            <div className="bg-bg-card-dark border border-border-dark rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-royal-blue/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">flash_on</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm text-text-primary-dark font-bold">Targeted Deficit Drill</h3>
                  <p className="text-xs text-text-muted-dark font-mono-data">Instant 15-Minute Session</p>
                </div>
              </div>

              <p className="text-body-sm font-body-sm text-text-secondary-dark text-xs">
                Launch a targeted sprint of 15 questions in your weakest topic to patch score leaks and train authentic time pressure.
              </p>

              <button
                onClick={() => navigate('/mock-setup')}
                className="w-full py-3 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                <span>Configure Drill Mission</span>
              </button>
            </div>

            {/* Official UTME Past Question Archives */}
            <div className="bg-surface-container-low border border-border-dark rounded-2xl p-5 space-y-3">
              <h4 className="text-label-sm font-label-sm text-text-primary-dark font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                <span>Past Paper Sets</span>
              </h4>
              <div className="space-y-2 text-xs">
                {['2024 Full UTME CBT Exam', '2023 National Standard UTME', '2022 JAMB CBT Standardized', '2021 UTME Mock & Official'].map((set) => (
                  <button
                    key={set}
                    onClick={() => navigate('/mock-setup')}
                    className="w-full p-2.5 rounded-xl bg-surface-container border border-border-dark flex items-center justify-between text-text-secondary-dark hover:text-text-primary-dark hover:border-border-hover-dark transition-all text-left"
                  >
                    <span>{set}</span>
                    <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Falke AI Pre-Index Telemetry */}
            <div className="bg-bg-card-dark border border-accent-ai-gold/30 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent-ai-gold font-mono-data">Falke AI Cache Telemetry</span>
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              </div>
              <p className="text-[11px] text-text-secondary-dark leading-relaxed">
                Accredited past question stems pre-computed and stored in edge cache memory. Instant explanation lookup requires 0 AuriCoins.
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREATE QUESTION                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Authoring Form */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-5 space-y-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Author New Question
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Compose single-best-answer multiple choice questions adhering to JAMB syllabus standards.
                </p>
              </div>

              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Subject
                    </label>
                    <select
                      value={createState.subject}
                      onChange={(e) => setCreateState({ ...createState, subject: e.target.value })}
                      className="w-full rounded-xl bg-bg-secondary border border-border p-3 text-xs text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      {AVAILABLE_SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Topic / Section"
                    placeholder="e.g. Calculus, Organic Chemistry, Mechanics"
                    value={createState.topic}
                    onChange={(e) => setCreateState({ ...createState, topic: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Question Stem
                  </label>
                  <textarea
                    rows={4}
                    value={createState.question_text}
                    onChange={(e) => setCreateState({ ...createState, question_text: e.target.value })}
                    placeholder="Enter the complete question prompt or problem statement..."
                    className="w-full rounded-xl bg-bg-secondary border border-border p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Option A"
                    placeholder="Option A text..."
                    value={createState.option_a}
                    onChange={(e) => setCreateState({ ...createState, option_a: e.target.value })}
                  />
                  <Input
                    label="Option B"
                    placeholder="Option B text..."
                    value={createState.option_b}
                    onChange={(e) => setCreateState({ ...createState, option_b: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Option C"
                    placeholder="Option C text..."
                    value={createState.option_c}
                    onChange={(e) => setCreateState({ ...createState, option_c: e.target.value })}
                  />
                  <Input
                    label="Option D"
                    placeholder="Option D text..."
                    value={createState.option_d}
                    onChange={(e) => setCreateState({ ...createState, option_d: e.target.value })}
                  />
                </div>

                {/* Correct Option Selector & Difficulty Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Correct Key Option
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => setCreateState({ ...createState, correct_option: letter })}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                            createState.correct_option === letter
                              ? 'bg-success text-white border-success shadow-sm'
                              : 'bg-bg-secondary border-border text-text-secondary hover:border-primary/40'
                          }`}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                        Difficulty Rating (1-5)
                      </label>
                      <span className="text-xs font-bold text-primary">
                        Level {createState.difficulty_level}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={createState.difficulty_level}
                      onChange={(e) => setCreateState({ ...createState, difficulty_level: Number(e.target.value) })}
                      className="w-full accent-primary h-2 bg-bg-secondary rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted">
                      <span>1 (Basic)</span>
                      <span>3 (JAMB Standard)</span>
                      <span>5 (Expert)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Explanation / Solution Walkthrough (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={createState.explanation}
                    onChange={(e) => setCreateState({ ...createState, explanation: e.target.value })}
                    placeholder="Provide step-by-step guidance shown to candidates during review..."
                    className="w-full rounded-xl bg-bg-secondary border border-border p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 leading-relaxed"
                  />
                </div>

                <Input
                  label="Curriculum Tags"
                  placeholder="e.g. jamb2024, optics, refraction (comma-separated)"
                  value={createState.tags}
                  onChange={(e) => setCreateState({ ...createState, tags: e.target.value })}
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setCreateState(defaultCreateState)}
                    className="text-xs"
                  >
                    Reset Form
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    className="text-xs gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Save Question to Bank
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Live Candidate Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Candidate Exam Preview
              </div>

              <Card className="p-5 border-primary/30 shadow-md space-y-4 bg-bg-card">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-bold text-xs text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      {createState.subject}
                    </span>
                    <span className="text-xs text-text-muted">
                      {createState.topic || 'General Practice'}
                    </span>
                  </div>
                  {getDifficultyBadge(createState.difficulty_level)}
                </div>

                <div className="text-sm font-medium text-text-primary leading-relaxed min-h-[48px]">
                  {createState.question_text || (
                    <span className="italic text-text-muted">
                      Start typing the question prompt in the form to see live formatting...
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'A', text: createState.option_a },
                    { id: 'B', text: createState.option_b },
                    { id: 'C', text: createState.option_c },
                    { id: 'D', text: createState.option_d },
                  ].map((opt) => {
                    const isKey = createState.correct_option === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                          isKey
                            ? 'bg-success/15 border-success/40 text-success font-semibold'
                            : 'bg-bg-secondary/40 border-border text-text-secondary'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                            isKey ? 'bg-success text-white' : 'bg-bg-secondary border border-border text-text-muted'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1 truncate">
                          {opt.text || <span className="italic text-text-muted">Option {opt.id}...</span>}
                        </span>
                        {isKey && <Badge variant="success">Answer Key</Badge>}
                      </div>
                    );
                  })}
                </div>

                {createState.explanation && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-text-secondary space-y-1">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Solution Walkthrough:
                    </span>
                    <p className="leading-relaxed">{createState.explanation}</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BULK IMPORT                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Instructions and Download Template */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  Bulk Question Ingestion
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Upload hundreds of JAMB past questions in seconds using CSV or XLSX files.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={downloadSampleCsv}
                className="text-xs gap-1.5 self-start md:self-auto"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-text-secondary">
              <div className="rounded-xl border border-border bg-bg-secondary/40 p-3 space-y-1">
                <span className="font-bold text-text-primary">1. Prepare Data</span>
                <p className="text-[11px] leading-relaxed">
                  Include columns: <code>subject</code>, <code>topic</code>, <code>question_text</code>, <code>option_a</code> through <code>option_d</code>, <code>correct_option</code>.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary/40 p-3 space-y-1">
                <span className="font-bold text-text-primary">2. Upload & Validate</span>
                <p className="text-[11px] leading-relaxed">
                  The parser verifies structure, extracts headers, and presents an interactive row preview.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary/40 p-3 space-y-1">
                <span className="font-bold text-text-primary">3. Ingest Instantly</span>
                <p className="text-[11px] leading-relaxed">
                  Commit the staged questions directly into the live PostgreSQL database with one click.
                </p>
              </div>
            </div>
          </Card>

          {/* Upload Input Area */}
          <Card className="p-6 text-center space-y-4 border-dashed border-2 border-border hover:border-primary/50 transition-colors">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text-primary">
                Select your CSV or Excel Spreadsheet
              </h3>
              <p className="text-xs text-text-muted">
                Accepts .csv, .xlsx, and .xls files up to 25MB.
              </p>
            </div>

            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-border file:bg-bg-secondary file:text-text-primary hover:file:bg-bg-secondary/80 cursor-pointer focus:outline-none"
              />

              <Button
                variant="primary"
                size="sm"
                onClick={handleImportUpload}
                disabled={!importFile || isUploading}
                className="text-xs gap-1.5 whitespace-nowrap"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Inspecting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5" />
                    Inspect File
                  </>
                )}
              </Button>
            </div>

            {importFile && (
              <p className="text-xs font-mono text-primary font-medium">
                Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </Card>

          {/* Staging & Preview Area */}
          {importUpload.importId && (
            <Card className="p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Staged Import Overview
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Batch ID: <span className="font-mono text-primary">{importUpload.importId}</span> • Total Rows: <strong className="text-text-primary">{importUpload.totalRows}</strong>
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCommitImport}
                  disabled={isCommitting}
                  className="text-xs gap-1.5 bg-success hover:bg-success/90 border-success shadow-sm"
                >
                  {isCommitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Committing Rows...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Commit {importUpload.totalRows} Questions
                    </>
                  )}
                </Button>
              </div>

              {/* Detected Columns */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Detected Column Mapping
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(importUpload.columns ?? []).map((col) => (
                    <span
                      key={col}
                      className="rounded-md border border-border bg-bg-secondary px-2 py-1 text-[11px] font-mono text-text-primary"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              {Array.isArray(importUpload.preview) && importUpload.preview.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Sample Rows (First {importUpload.preview.length})
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-border bg-bg-secondary/20">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-bg-secondary/40 font-semibold text-text-secondary">
                          {(importUpload.columns ?? []).slice(0, 6).map((c) => (
                            <th key={c} className="p-2.5">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {importUpload.preview.slice(0, 4).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-bg-secondary/30">
                            {(importUpload.columns ?? []).slice(0, 6).map((col) => (
                              <td key={col} className="p-2.5 max-w-[200px] truncate text-text-primary">
                                {String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PDF PAST PAPER SCANNER                                               */}
      {/* ========================================================================= */}
      {activeTab === 'pdf_scanner' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-primary" />
                  PDF Past Paper Directory Scanner
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Scans multi-question pages (5-10 questions per page) and printed diagrams from past paper PDFs into PostgreSQL/LibSQL.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={handleStartPdfScan}
                  disabled={isPdfScanLoading || pdfScanProgress.isScanning}
                  className="text-xs gap-2 shadow-sm"
                >
                  {pdfScanProgress.isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Scanning in Progress...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Start Scanning Folder
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Web PDF File Upload (Recommended for Deployed Website) */}
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center space-y-3">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <UploadCloud className="h-7 w-7 text-primary" />
                <span className="text-xs font-bold text-text-primary">
                  Upload & Scan PDF File Directly (Recommended for Web Deployment)
                </span>
                <p className="text-[11px] text-text-secondary max-w-md">
                  Select any JAMB Past Paper PDF file from your computer (e.g. <code className="text-primary font-bold">JAMB_Maths_2023.pdf</code>). NVIDIA Kimi K3 Vision Engine will scan the pages and extract questions into PostgreSQL!
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <input
                  type="file"
                  id="pdf-file-upload-input"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadAndScanPdfFile(file);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isPdfUploadLoading || pdfScanProgress.isScanning}
                  className="text-xs gap-2 shadow-sm cursor-pointer"
                  onClick={() => document.getElementById('pdf-file-upload-input')?.click()}
                >
                  {isPdfUploadLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Uploading & Scanning PDF...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Select PDF File from Computer
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Currently Processing Banner */}
            {pdfScanProgress.isScanning && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Currently Processing: <span className="font-mono">{pdfScanProgress.currentFile}</span>
                </div>
                <Badge variant="warning">NVIDIA Kimi K3 Vision Active</Badge>
              </div>
            )}

            {/* Real-time Scanner Execution Console Log */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Live Execution Logs
              </span>
              <div className="h-48 overflow-y-auto rounded-xl border border-border bg-black/80 p-3 font-mono text-[11px] text-emerald-400 space-y-1 leading-relaxed">
                {(!pdfScanProgress.logs || pdfScanProgress.logs.length === 0) ? (
                  <p className="text-gray-500 italic">No scanner logs available. Click 'Start Scanning Folder' to initiate.</p>
                ) : (
                  pdfScanProgress.logs.map((line, idx) => <p key={idx}>{line}</p>)
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: AI QUESTION GENERATOR                                               */}
      {/* ========================================================================= */}
      {activeTab === 'ai_generator' && (
        <div className="space-y-6">
          {/* Main Controls */}
          <Card className="p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Background Falke AI Question Generator
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Generates JAMB CBT standard text questions and vector SVG diagram questions continuously in background.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {aiGenStatus.isRunning ? (
                  <Button
                    variant="secondary"
                    onClick={handleStopAiGen}
                    className="text-xs gap-2 border-error/50 text-error hover:bg-error/10"
                  >
                    <X className="h-4 w-4" />
                    Stop Generation Job
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleStartAiGen}
                    disabled={isAiGenLoading}
                    className="text-xs gap-2 shadow-sm"
                  >
                    {isAiGenLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Start Background Generator
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Target Subject</label>
                <select
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                >
                  {AVAILABLE_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} ({s.value})
                    </option>
                  ))}
                </select>
                <div className="pt-1">
                  {['english', 'crk', 'irk', 'history', 'literature', 'commerce', 'government', 'civic_education'].includes(aiSubject) ? (
                    <Badge variant="success" className="text-[10px]">
                      Mistral & OrcaRouter Free Keys (Nigerian Context History Focus)
                    </Badge>
                  ) : (
                    <Badge variant="info" className="text-[10px]">
                      NVIDIA Key (STEM, Math LaTeX & Diagram SVG Focus)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary">Question Category / Mode</label>
                <select
                  value={aiSourceType}
                  onChange={(e) => setAiSourceType(e.target.value as any)}
                  className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary font-medium"
                >
                  <option value="mixed_curriculum">Full Curriculum Mix (Theory, Calculation, Diagrams & Passages)</option>
                  <option value="new_text">Standard Digital Text (Theory & Concepts)</option>
                  <option value="calculation_latex">Step-by-Step Calculation & LaTeX Formulae ($...$)</option>
                  <option value="new_svg_diagram">Vector SVG Diagram & Geometry Questions</option>
                  <option value="passage_comprehension">Reading Passages, Cloze Tests & Case Studies</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">Target Generation Count</label>
                  <button
                    type="button"
                    onClick={() => setUseCustomTarget(!useCustomTarget)}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    {useCustomTarget ? 'Use Presets' : 'Custom Number'}
                  </button>
                </div>
                {useCustomTarget ? (
                  <input
                    type="number"
                    value={customTargetCount}
                    onChange={(e) => setCustomTargetCount(e.target.value)}
                    placeholder="e.g. 30000"
                    min={1}
                    max={50000}
                    className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary font-mono"
                  />
                ) : (
                  <select
                    value={aiTargetCount}
                    onChange={(e) => setAiTargetCount(Number(e.target.value))}
                    className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary font-medium"
                  >
                    <option value={100}>100 Questions</option>
                    <option value={500}>500 Questions</option>
                    <option value={1000}>1,000 Questions</option>
                    <option value={5000}>5,000 Questions</option>
                    <option value={10000}>10,000 Questions</option>
                    <option value={20000}>20,000 Questions</option>
                    <option value={30000}>30,000 Questions (High-Volume Full Subject Target)</option>
                  </select>
                )}
              </div>
            </div>

            {/* Multi-Topic Syllabus Selection Box */}
            <div className="rounded-xl border border-border bg-bg-secondary/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Syllabus Topic Focus / Multi-Topic Selection (Optional)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Auto-Full Syllabus Rotation Active
                </span>
              </div>
              <input
                type="text"
                value={selectedTopicsInput}
                onChange={(e) => setSelectedTopicsInput(e.target.value)}
                placeholder="e.g. Calculus & Derivatives, Trigonometry, Statistics & Probability (Comma-separated for multi-topics)"
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary font-mono placeholder:text-text-muted"
              />
              <p className="text-[11px] text-text-muted">
                Leave empty for automatic full syllabus rotation. The Falke AI generator will continuously cycle across every topic in the JAMB UTME curriculum for <strong className="text-text-primary">{aiSubject}</strong>!
              </p>
            </div>

            {/* Active Job Progress */}
            {aiGenStatus.isRunning && aiGenStatus.activeJob && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating {aiGenStatus.activeJob.sourceType} for '{aiGenStatus.activeJob.subject}'...
                  </div>
                  <span>
                    {aiGenStatus.generatedInCurrentJob || 0} / {aiGenStatus.activeJob.targetCount}
                  </span>
                </div>
                <div className="w-full bg-bg-secondary/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        ((aiGenStatus.generatedInCurrentJob || 0) / (aiGenStatus.activeJob.targetCount || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Target Quota Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase text-text-muted">Standard Text Questions</span>
                <p className="text-2xl font-black text-text-primary">
                  {aiGenStatus.totalStats?.newText || 0} <span className="text-xs text-text-muted font-normal">/ 10,000 Target</span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase text-text-muted">Vector SVG Diagrams</span>
                <p className="text-2xl font-black text-primary">
                  {aiGenStatus.totalStats?.newSvgDiagram || 0} <span className="text-xs text-text-muted font-normal">/ 5,000 Target</span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-bg-secondary/20 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase text-text-muted">Scanned Past Papers</span>
                <p className="text-2xl font-black text-success">
                  {aiGenStatus.totalStats?.scannedPastPaper || 0} <span className="text-xs text-text-muted font-normal">Extracted</span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUBJECT STATS & CURRICULUM ANALYTICS                                */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Total Questions</p>
                <p className="text-xl font-black text-text-primary mt-0.5">{totalQuestions}</p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Subjects Active</p>
                <p className="text-xl font-black text-text-primary mt-0.5">{subjectsList.length}</p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Curricula Coverage</p>
                <p className="text-xl font-black text-text-primary mt-0.5">JAMB UTME</p>
              </div>
            </Card>
          </div>

          {/* Subject Distribution Cards */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Question Distribution by Subject
              </h2>
              <span className="text-xs text-text-secondary">
                {subjectsList.length} subjects populated
              </span>
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="h-20 bg-border/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : subjectsList.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-8">
                No subject distribution data available yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjectsList.map((entry) => {
                  const subjectMeta = AVAILABLE_SUBJECTS.find(
                    (s) => s.value.toLowerCase() === entry.subject.toLowerCase()
                  );
                  const displayName = subjectMeta?.label || entry.subject;
                  const percentage = totalQuestions > 0 ? ((entry.count / totalQuestions) * 100).toFixed(1) : '0';

                  return (
                    <button
                      key={entry.subject}
                      onClick={() => {
                        setSelectedSubjectFilter(entry.subject.toLowerCase());
                        setActiveTab('browse');
                      }}
                      className="group flex flex-col justify-between p-4 rounded-xl border border-border bg-bg-secondary/20 hover:border-primary/50 hover:bg-bg-secondary/50 transition-all text-left"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                          {displayName}
                        </span>
                        <div className="text-[11px] text-text-muted capitalize">
                          {entry.subject}
                        </div>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-border/50">
                        <span className="text-base font-black text-text-primary">
                          {entry.count} <span className="text-[11px] font-normal text-text-muted">Qs</span>
                        </span>
                        <span className="text-[11px] font-semibold text-primary">
                          {percentage}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Raw System Telemetry if present */}
          {stats && (
            <Card className="p-5 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Curriculum Engine Diagnostics
              </span>
              <pre className="overflow-auto rounded-xl border border-border bg-bg-secondary/40 p-3 text-xs font-mono text-text-secondary max-h-48 leading-relaxed">
                {JSON.stringify(stats, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  if (isAdminView) {
    return content;
  }

  return (
    <StudentLayout student={student}>
      {content}
    </StudentLayout>
  );
}
