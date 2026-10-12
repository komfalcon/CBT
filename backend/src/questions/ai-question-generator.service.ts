import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  NON_TECHNICAL_SUBJECTS,
  TECHNICAL_SUBJECTS,
  QuestionSourceType,
} from './types/question.types';
import {
  sanitizeQuestionText,
  cleanOptionText,
  sanitizeExplanation,
  isIncompleteQuestion,
} from './utils/question-sanitizer';

export type GenerationSourceType =
  | 'new_text'
  | 'new_svg_diagram'
  | 'calculation_latex'
  | 'passage_comprehension'
  | 'mixed_curriculum';

export interface GenerationJobConfig {
  subject: string;
  sourceType: GenerationSourceType;
  targetCount: number;
  topics?: string[];
}

export interface GenerationStatus {
  isRunning: boolean;
  activeJob: GenerationJobConfig | null;
  generatedInCurrentJob: number;
  totalStats: {
    newText: number;
    newSvgDiagram: number;
    scannedPastPaper: number;
    bySubject: Record<string, { newText: number; newSvgDiagram: number; scannedPastPaper: number }>;
  };
}

export const SUBJECT_SYLLABUS_MAP: Record<string, string[]> = {
  mathematics: [
    'Algebra & Quadratic Equations',
    'Calculus & Derivatives/Integrals',
    'Trigonometry & Polar Coordinates',
    'Geometry, Mensuration & Vectors',
    'Statistics & Probability Distributions',
    'Indices, Logarithms & Surds',
    'Matrices, Determinants & Transformations',
    'Sequence, Series & Progressions',
  ],
  further_mathematics: [
    'Vectors & 3D Analytical Geometry',
    'Advanced Calculus & Differential Equations',
    'Complex Numbers & De Moivre Theorem',
    'Statics, Dynamics & Kinematics',
    'Probability Distributions & Variance',
    'Linear Algebra & Matrix Transformations',
    'Numerical Methods & Approximation',
  ],
  physics: [
    'Mechanics, Motion & Newton Laws',
    'Waves, Sound & Wave Optics',
    'Electricity, Circuits & Magnetism',
    'Thermodynamics, Gas Laws & Heat',
    'Atomic, Quantum & Nuclear Physics',
    'Gravitational & Electric Fields',
    'Simple Harmonic Motion & Elasticity',
    'Fluids, Viscosity & Surface Tension',
  ],
  chemistry: [
    'Organic Chemistry & Functional Groups',
    'Stoichiometry & Mole Concept',
    'Periodic Table & Chemical Bonding',
    'Electrochemistry & Redox Reactions',
    'Chemical Equilibrium & Reaction Kinetics',
    'Acids, Bases & Salt Analysis',
    'Thermodynamics & Thermochemistry',
    'Gas Laws & Kinetic Theory of Matter',
  ],
  biology: [
    'Cell Biology, Organelles & Mitosis',
    'Genetics, DNA & Heredity',
    'Ecology, Ecosystems & Biomes',
    'Human Physiology & Organ Systems',
    'Plant Physiology, Photosynthesis & Transport',
    'Evolution & Natural Selection',
    'Taxonomy & Diversity of Organisms',
    'Microbiology, Immunity & Diseases',
  ],
  english: [
    'Comprehension & Passage Analysis',
    'Lexis, Structure & Sentence Completion',
    'Synonyms & Antonyms in Context',
    'Vowels, Consonants & Stress Patterns',
    'Idioms, Phrasal Verbs & Figures of Speech',
    'Cloze Test & Contextual Vocabulary',
  ],
  accounting: [
    'Financial Accounting Principles & Conventions',
    'Trial Balance, Trading & P/L Accounts',
    'Partnership Accounts & Dissolution',
    'Company Accounts & Share Capital',
    'Depreciation & Fixed Assets Management',
    'Bank Reconciliation & Control Accounts',
    'Costing, Budgeting & Marginal Costing',
  ],
  economics: [
    'Microeconomics & Demand/Supply Elasticity',
    'Macroeconomics & National Income Accounting',
    'Money, Banking & Monetary Policy',
    'Public Finance, Taxation & Fiscal Policy',
    'International Trade & Exchange Rates',
    'Inflation, Unemployment & Business Cycles',
    'Economic Growth & Development Planning',
  ],
  government: [
    'Basic Political Concepts & Power/Authority',
    'Nigerian Constitutional Development (1914-1999)',
    'Federalism & Local Government Administration',
    'Public Service & Civil Bureaucracy',
    'International Organizations (ECOWAS, AU, UN)',
    'Electoral Systems, Parties & Pressure Groups',
  ],
  literature: [
    'African Prose & Novel Analysis',
    'Non-African Prose & Classics',
    'African Poetry & Stanza Analysis',
    'Non-African Poetry',
    'African & Non-African Drama/Plays',
    'Literary Devices, Devices & Themes',
  ],
  commerce: [
    'Home & Foreign Trade Operations',
    'Forms of Business Units & Ownership',
    'Commercial Banking & Insurance Services',
    'Transportation, Communication & Warehousing',
    'Marketing, Advertising & Consumer Protection',
    'Stock Exchange & Capital Markets',
  ],
  geography: [
    'Physical Geography & Landforms',
    'Weather, Climate & Biomes',
    'Map Reading, Scales & Topography',
    'Human Settlement & Population Geography',
    'Economic Geography & Mineral Resources',
    'Regional Geography of Nigeria & West Africa',
  ],
  agriculture: [
    'Crop Agronomy & Production Systems',
    'Animal Husbandry, Livestock & Breeding',
    'Soil Fertility, Chemistry & Irrigation',
    'Agricultural Economics & Extension Services',
    'Agricultural Mechanics, Tools & Implements',
    'Pest Management & Disease Control',
  ],
  history: [
    'Pre-Colonial Nigerian Empires (Oyo, Benin, Sokoto, Kanem)',
    'British Colonial Rule & Amalgamation (1914)',
    'Constitutional Developments & Nationalism (Richards/Macpherson)',
    'Independence Movement (1960) & First Republic',
    'Nigerian Civil War & Military Regimes',
    'Contemporary Nigerian Foreign Policy & Pan-Africanism',
  ],
  civic_education: [
    'Human Rights, Rule of Law & Justice',
    'Democracy, Constitution & Governance',
    'Citizenship Duties & National Values',
    'Youth Empowerment & Community Service',
    'Addressing Cultism, Corruption & Drug Abuse',
  ],
  crk: [
    'Sovereignty of God & Creation',
    'Leadership in Israel (Moses, Joshua, Judges)',
    'The Kings of Israel (Saul, David, Solomon)',
    'The Prophets & Social Justice (Amos, Hosea, Isaiah)',
    'Life, Ministry & Parables of Jesus Christ',
    'The Early Church & Missionary Journeys of Paul',
  ],
  irk: [
    'Tawhid, Faith & Articles of Islam',
    'Selected Surahs of Quran & Tafsir',
    'Hadith Collections & Prophetic Guidance',
    'Islamic History & Rightly Guided Caliphs',
    'Fiqh, Sharia & Acts of Worship (Salat, Zakat, Hajj)',
  ],
};

@Injectable()
export class AiQuestionGeneratorService {
  private readonly logger = new Logger(AiQuestionGeneratorService.name);

  // Free Tier & Metered API Keys from Environment Variables
  private readonly nvidiaKey = process.env.NVIDIA_API_KEY || '';

  // Quad Mistral API Keys for High-Throughput Quad-Worker Parallel Generation
  private readonly mistralKeys = [
    process.env.MISTRAL_API_KEY,
    process.env.MISTRAL_API_KEY_2,
    process.env.MISTRAL_API_KEY_3,
    process.env.MISTRAL_API_KEY_4,
  ].filter(Boolean) as string[];

  private readonly orcaKey = process.env.ORCAROUTER_API_KEY || '';

  private isRunning = false;
  private activeJob: GenerationJobConfig | null = null;
  private generatedInCurrentJob = 0;

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  public isNonTechnicalSubject(subject: string): boolean {
    const norm = subject.toLowerCase().trim();
    return (NON_TECHNICAL_SUBJECTS as readonly string[]).includes(norm);
  }

  /**
   * Main entry point to generate questions in batch or background
   */
  async startGenerationJob(config: GenerationJobConfig): Promise<{ success: boolean; message: string }> {
    if (this.isRunning) {
      return { success: false, message: `A generation job is already running for ${this.activeJob?.subject}` };
    }

    this.isRunning = true;
    this.activeJob = config;
    this.generatedInCurrentJob = 0;

    // Run asynchronously in background using Quad-Worker Parallel Execution
    this.runBackgroundGeneration(config).catch((err) => {
      this.logger.error(`Background generation failed: ${err.message}`, err.stack);
      this.isRunning = false;
      this.activeJob = null;
    });

    return {
      success: true,
      message: `Started quad-worker background AI generation for subject '${config.subject}' (${config.sourceType}), targeting ${config.targetCount} questions across ${this.mistralKeys.length} API keys.`,
    };
  }

  async stopGenerationJob(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning) {
      return { success: false, message: 'No generation job is currently running.' };
    }
    this.isRunning = false;
    this.activeJob = null;
    return { success: true, message: 'Generation job stopped.' };
  }

  private async runBackgroundGeneration(config: GenerationJobConfig) {
    this.logger.log(
      `Launching QUAD-WORKER parallel generation job across ${this.mistralKeys.length} keys: subject=${config.subject}, type=${config.sourceType}, targetCount=${config.targetCount}`,
    );

    const isCalculationHeavy = ['accounting', 'further_mathematics', 'mathematics', 'physics', 'chemistry'].includes(config.subject.toLowerCase());
    const batchSize = config.sourceType === 'new_svg_diagram' ? 3 : (isCalculationHeavy || config.sourceType === 'passage_comprehension') ? 4 : 6;

    // Launch 4 concurrent workers (one for each Mistral API key)
    const workers = this.mistralKeys.map((key, idx) =>
      this.runWorkerLoop(config, batchSize, key, `Worker-${idx + 1}`),
    );

    await Promise.allSettled(workers);

    this.logger.log(`Completed quad-worker generation job for ${config.subject}. Total generated: ${this.generatedInCurrentJob}/${config.targetCount}`);
    this.isRunning = false;
    this.activeJob = null;
  }

  private async runWorkerLoop(
    config: GenerationJobConfig,
    batchSize: number,
    apiKey: string,
    workerId: string,
  ) {
    this.logger.log(`[${workerId}] Started parallel generation loop for ${config.subject}...`);

    while (this.isRunning && this.generatedInCurrentJob < config.targetCount) {
      const remaining = config.targetCount - this.generatedInCurrentJob;
      const needed = Math.min(batchSize, remaining);
      if (needed <= 0) break;

      try {
        const questions = await this.generateBatch(config.subject, config.sourceType, needed, apiKey, config.topics);
        if (questions && questions.length > 0) {
          const saved = await this.saveQuestionsToDb(questions, config.subject, config.sourceType);
          this.generatedInCurrentJob += saved;
          this.logger.log(
            `[${workerId}] Saved ${saved} questions for ${config.subject}. Progress: ${this.generatedInCurrentJob}/${config.targetCount}`,
          );
        } else {
          this.logger.warn(`[${workerId}] Generated batch was empty for ${config.subject}. Retrying...`);
        }
      } catch (err: any) {
        this.logger.error(`[${workerId}] Error in generation batch: ${err.message}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  /**
   * Generates a single batch of questions using designated API key & routing
   */
  async generateBatch(
    subject: string,
    sourceType: GenerationSourceType,
    count: number,
    apiKey?: string,
    customTopics?: string[],
  ): Promise<any[]> {
    const isNonTech = this.isNonTechnicalSubject(subject);
    const subNorm = subject.toLowerCase().trim();

    // Select topics for this batch
    let selectedTopics: string[] = [];
    if (customTopics && customTopics.length > 0) {
      selectedTopics = customTopics;
    } else {
      const syllabus = SUBJECT_SYLLABUS_MAP[subNorm] || ['General Syllabus'];
      const shuffled = [...syllabus].sort(() => 0.5 - Math.random());
      selectedTopics = shuffled.slice(0, 3);
    }

    const topicStr = selectedTopics.join(', ');

    let systemPrompt = '';
    let userPrompt = '';

    if (sourceType === 'new_svg_diagram') {
      systemPrompt = `You are a high-level educational content designer for Nigerian UTME/JAMB exams.
You create high-quality STEM questions containing embedded, responsive vector SVG diagrams.

SVG Design Standards for Subject Diagrams:
- ViewBox: Responsive viewBox='0 0 500 320' with ample padding (at least 30px) on all sides so labels are never cut off.
- Colors (High Contrast for Dark Theme):
  * Diagram Text / Labels: fill='#f8fafc' font-size='14' font-family='sans-serif' font-weight='600'. NEVER use black (#000) or dark grey text.
  * Primary Lines / Curves: stroke='#38bdf8' (bright sky blue), stroke-width='2.5' or '3'.
  * Secondary Lines / Demand: stroke='#f59e0b' (amber gold), stroke-width='2.5'.
  * Shaded Areas (e.g. DWL / Regions): fill='rgba(239, 68, 68, 0.25)' stroke='#ef4444' stroke-width='2'.
  * Grid / Axes: stroke='#475569' (slate), stroke-width='1.5', stroke-dasharray='4,4'.
- Economics Diagrams (Supply/Demand, DWL, Cost Curves):
  * Draw X & Y axes labeled 'Quantity (Q)' and 'Price (P)'.
  * Supply Curve: upward slope line stroke='#38bdf8'. Demand Curve: downward slope line stroke='#f59e0b'.
  * Deadweight Loss (DWL): shaded triangular region fill='rgba(239, 68, 68, 0.25)' stroke='#ef4444' with distinct 'DWL' text label inside or offset with an arrow.
- Mathematics & Further Maths (Geometry, Vectors, Complex Argand Plane):
  * Draw clear labeled X/Y or Re/Im axes.
  * Vector Arrows: stroke='#38bdf8' with marker-end='url(#arrow)' and clear label offset from line.
- General Rules:
  * NEVER let text labels overlap lines, curves, points, or other text labels.
  * In SVG <text> elements, NEVER output raw LaTeX backslash macros (like \\sqrt, \\pi, \\vec). Use clean Unicode (√3, π, θ, v⃗).`;

      userPrompt = `Generate EXACTLY ${count} JAMB/UTME standard multiple-choice questions for '${subject}'.
Topics to cover: ${topicStr}.
Each question MUST include an inline vector SVG diagram in the 'diagram_svg' field.

Formatting Rules:
- Enclose all JSON string values in double quotes ("...").
- Inside 'diagram_svg', use single quotes for XML attributes (e.g. <svg viewBox='0 0 400 300' fill='#3b82f6'>).
- Escape backslashes in LaTeX formulas (e.g. \\\\(3x^2 - 12x - 15 = 0\\\\) or \\\\vec{v} = (2, -1, 4)).
- In 'options', do NOT include option prefixes like 'A. ', 'B) ', or 'Option C: ' inside the 'text' field.
- In 'explanation', format solutions in clear, step-by-step paragraphs with inline LaTeX ($...$) for formulas.

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string (sub-topic from: ${topicStr})
- 'question_text': string
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string
- 'difficulty_level': number (1 to 5)
- 'has_diagram': true
- 'diagram_svg': string (complete inline <svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>...</svg>)
- 'latex': string or null

Respond ONLY with the raw JSON array.`;
    } else if (sourceType === 'calculation_latex') {
      systemPrompt = `You are a STEM & Quantitative Reasoning expert for Nigerian UTME/JAMB.
You create step-by-step calculation questions formatted with LaTeX mathematics ($...$) and detailed solutions.
CRITICAL FORMAT RULES:
- 'question_text' must NEVER contain the answer, correct option letter, hints, or the list of options.
- Explanations belong strictly in the 'explanation' field.
- Options belong strictly in the 'options' array.
- Option texts must NOT have letter prefixes (e.g. write '25 cm', NOT 'A. 25 cm').
- All equations must use clean LaTeX ($...$). Do NOT double-escape backslashes (use standard \\frac{a}{b}, not \\\\frac{a}{b}).`;

      userPrompt = `Generate EXACTLY ${count} calculation-based JAMB UTME questions for '${subject}'.
Topics to cover: ${topicStr}.
All mathematical equations must use LaTeX ($...$). Currency should use ₦ or N (Naira).

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string (sub-topic from: ${topicStr})
- 'question_text': string
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string (step-by-step solution)
- 'difficulty_level': number (1 to 5)
- 'has_diagram': false
- 'diagram_svg': null
- 'latex': string (formulas in $...$)

Respond ONLY with the raw JSON array.`;
    } else if (sourceType === 'passage_comprehension') {
      systemPrompt = `You are an expert reading comprehension and passage-based exam author for Nigerian UTME/JAMB.
You create reading passages, excerpts, cloze tests, or scenario case studies followed by analytical multiple-choice questions.
CRITICAL FORMAT RULES:
- 'question_text' must contain the reading passage followed by the complete question stem.
- 'question_text' must NEVER reveal the answer, correct option, hints, or duplicated options list.
- Options belong strictly in the 'options' array, without letter prefixes.
- Passages and questions must be complete and never truncated mid-sentence.`;

      userPrompt = `Generate EXACTLY ${count} passage-based questions for '${subject}'.
Topics to cover: ${topicStr}.
Each question stem in 'question_text' must include the reading passage/scenario excerpt followed by the question.

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string (sub-topic from: ${topicStr})
- 'question_text': string (reading passage/scenario context followed by stem question)
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string
- 'difficulty_level': number (1 to 5)
- 'has_diagram': false
- 'diagram_svg': null
- 'latex': null

Respond ONLY with the raw JSON array.`;
    } else if (sourceType === 'mixed_curriculum') {
      systemPrompt = `You are a master curriculum examiner for Nigerian UTME/JAMB.
You generate a rich, dynamic mix of conceptual theory, step-by-step calculation (LaTeX), responsive vector SVG diagrams, and reading comprehension passages.
CRITICAL FORMAT RULES:
- 'question_text' must NEVER contain the answer, correct option, hints, or duplicate options list.
- Options belong strictly in the 'options' array without letter prefixes.
- All equations must use clean LaTeX ($...$). Do NOT double-escape backslashes.`;

      userPrompt = `Generate EXACTLY ${count} JAMB UTME standard questions for '${subject}'.
Cover topics: ${topicStr}.

Dynamic Mix Rules:
- Include a variety of question styles: conceptual theory, mathematical calculations with LaTeX ($...$), inline vector SVG diagrams (where appropriate), and scenario/passage questions.
- For vector SVG diagrams (if any), use single quotes inside SVG tag attributes (<svg viewBox='0 0 400 300' fill='#3b82f6'>).

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string (sub-topic from: ${topicStr})
- 'question_text': string
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string
- 'difficulty_level': number (1 to 5)
- 'has_diagram': boolean
- 'diagram_svg': string or null
- 'latex': string or null

Respond ONLY with the raw JSON array.`;
    } else {
      // Standard Text Question Generation
      if (isNonTech) {
        systemPrompt = `You are an expert examiner for Nigerian UTME/JAMB in Humanities and Social Sciences.
Special Note for History: Prioritize authentic NIGERIAN HISTORY (e.g., 1960 Independence, 1914 Amalgamation, pre-colonial Oyo, Benin, Sokoto Caliphate, Kanem-Borno empires, constitutional developments like Richards/Macpherson constitutions, military regimes, democratic transitions, nationalism).`;

        userPrompt = `Generate EXACTLY ${count} high-quality JAMB standard CBT questions for '${subject}'.
Topics to cover: ${topicStr}.

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string (sub-topic from: ${topicStr})
- 'question_text': string
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string
- 'difficulty_level': number (1 to 5)
- 'has_diagram': false
- 'diagram_svg': null
- 'latex': null

Respond ONLY with the raw JSON array.`;
      } else {
        systemPrompt = `You are an expert examiner for Nigerian UTME/JAMB in STEM and Financial Accounting subjects.
All currency values should use N (Naira) or ₦. All mathematical equations should use LaTeX $...$.`;

        userPrompt = `Generate EXACTLY ${count} high-quality JAMB standard CBT questions for '${subject}'.
Topics to cover: ${topicStr}.

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string (sub-topic from: ${topicStr})
- 'question_text': string
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string
- 'difficulty_level': number (1 to 5)
- 'has_diagram': false
- 'diagram_svg': null
- 'latex': string or null

Respond ONLY with the raw JSON array.`;
      }
    }

    // Call chosen Provider (Prioritize Mistral API with worker designated key)
    let responseText = '';
    try {
      responseText = await this.callMistralApi(systemPrompt, userPrompt, apiKey);
    } catch (err: any) {
      this.logger.warn(`Mistral API call failed: ${err.message}. Falling back to NVIDIA API...`);
      try {
        responseText = await this.callNvidiaApi(systemPrompt, userPrompt);
      } catch (err2: any) {
        this.logger.warn(`NVIDIA API call failed: ${err2.message}. Falling back to Orca API...`);
        responseText = await this.callOrcaApi(systemPrompt, userPrompt);
      }
    }

    return this.parseJsonResponse(responseText);
  }

  private async callNvidiaApi(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
    
    // Live validated models on NVIDIA API
    const models = [
      'meta/llama-3.2-11b-vision-instruct',
      'meta/llama-3.2-90b-vision-instruct',
      'moonshotai/kimi-k3',
    ];
    
    for (const model of models) {
      try {
        const payload = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.3,
        };

        const res = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.nvidiaKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 45000,
        });

        const content = res.data?.choices?.[0]?.message?.content;
        if (content) {
          return content;
        }
      } catch (e: any) {
        this.logger.warn(`NVIDIA model ${model} failed: ${e.message}. Trying next model...`);
      }
    }

    throw new Error('All NVIDIA models failed to return content');
  }

  private async callMistralApi(systemPrompt: string, userPrompt: string, apiKey?: string): Promise<string> {
    const key = apiKey || this.mistralKeys[0];
    const url = 'https://api.mistral.ai/v1/chat/completions';
    const payload = {
      model: 'ministral-3b-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    });

    return res.data?.choices?.[0]?.message?.content || '';
  }

  private async callOrcaApi(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = 'https://api.orcarouter.com/v1/chat/completions';
    const payload = {
      model: 'deepseek/deepseek-v4-flash-free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.orcaKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    });

    return res.data?.choices?.[0]?.message?.content || '';
  }

  private parseJsonResponse(rawText: string): any[] {
    if (!rawText) return [];

    let clean = rawText.trim();
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

    const jsonStart = clean.indexOf('[');
    const jsonEnd = clean.lastIndexOf(']');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      clean = clean.substring(jsonStart, jsonEnd + 1);
    } else if (jsonStart !== -1) {
      clean = clean.substring(jsonStart);
    }

    // 1. Convert single-quoted "diagram_svg": '<svg...' to standard double-quoted "diagram_svg": "<svg...>"
    clean = clean.replace(/"diagram_svg"\s*:\s*'([\s\S]*?)'(?=\s*,\s*"|\s*\})/g, (_m, svgContent) => {
      const safeSvg = svgContent.replace(/"/g, "'");
      return `"diagram_svg": "${safeSvg}"`;
    });

    // 2. Character-level state machine parser for controls, escapes & LaTeX backslashes
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const code = clean.charCodeAt(i);

      if (char === '"' && !escaped) {
        inString = !inString;
        result += char;
        escaped = false;
        continue;
      }

      if (inString) {
        if (escaped) {
          result += char;
          escaped = false;
        } else if (char === '\\') {
          const nextChar = clean[i + 1];
          const remainder = clean.substring(i + 1, i + 10);
          const isLatexMacro = /^f(?:rac|actor)/i.test(remainder) || /^t(?:ext|heta|an|au|o|imes)\b/i.test(remainder);

          if (isLatexMacro) {
            // Escape LaTeX macro backslashes so JSON.parse outputs \frac or \text
            result += '\\\\';
            escaped = false;
          } else if (nextChar && '"\\/bfnrtu'.includes(nextChar)) {
            result += char;
            escaped = true;
          } else {
            // Unescaped LaTeX backslash (e.g. \( \) \int \sqrt \vec). Escape it as \\
            result += '\\\\';
            escaped = false;
          }
        } else if (char === '\n') {
          result += '\\n';
          escaped = false;
        } else if (char === '\r') {
          result += '\\r';
          escaped = false;
        } else if (char === '\t') {
          result += '\\t';
          escaped = false;
        } else if (code < 32) {
          // omit raw ASCII control codes (< 0x20)
          escaped = false;
        } else {
          result += char;
          escaped = false;
        }
      } else {
        if (code < 32 && char !== '\n' && char !== '\r' && char !== '\t') {
          // omit raw control codes outside strings
        } else {
          result += char;
        }
        escaped = false;
      }
    }

    // Trailing comma cleanup
    result = result.replace(/,\s*([\]}])/g, '$1');

    // Convert internal double-quotes inside diagram_svg field to single-quotes
    result = result.replace(/("diagram_svg"\s*:\s*")([\s\S]*?)("\s*,\s*"latex"|\s*,\s*"source"|\s*,\s*"difficulty_level"|\s*,\s*"has_diagram"|\s*\})/g, (_m, p1, svg, p3) => {
      const safeSvg = svg.replace(/"/g, "'");
      return p1 + safeSvg + p3;
    });

    try {
      const items = JSON.parse(result);
      if (Array.isArray(items)) return items;
    } catch {
      // Automatic Truncated JSON Repair & Object Recovery Fallback
      const salvaged = this.salvageTruncatedJson(result);
      if (salvaged.length > 0) {
        this.logger.log(`Salvaged ${salvaged.length} completed question objects from truncated AI response.`);
        return salvaged;
      }
    }

    return [];
  }

  private salvageTruncatedJson(clean: string): any[] {
    const recovered: any[] = [];
    
    // Find the last complete object ending with '}'
    const lastObjectEnd = clean.lastIndexOf('}');
    if (lastObjectEnd !== -1) {
      let trimmed = clean.substring(0, lastObjectEnd + 1).trim();
      if (!trimmed.startsWith('[')) {
        const firstBracket = trimmed.indexOf('[');
        if (firstBracket !== -1) trimmed = trimmed.substring(firstBracket);
      }
      if (!trimmed.endsWith(']')) {
        trimmed += ']';
      }

      try {
        const items = JSON.parse(trimmed);
        if (Array.isArray(items)) {
          for (const item of items) {
            if (
              item &&
              item.question_text &&
              !isIncompleteQuestion(item.question_text) &&
              item.options &&
              Array.isArray(item.options) &&
              item.options.length >= 2
            ) {
              recovered.push(item);
            }
          }
          if (recovered.length > 0) return recovered;
        }
      } catch {
        // Fallback to regex object extraction if trimmed array parse fails
      }
    }

    // Extract all valid complete question objects using regex
    const objectMatches = clean.match(/\{[^{}]*"question_text"[\s\S]*?"options"[\s\S]*?\}/g);
    if (objectMatches) {
      for (const objStr of objectMatches) {
        try {
          const cleanObj = objStr.replace(/,\s*}/g, '}');
          const parsedObj = JSON.parse(cleanObj);
          if (
            parsedObj &&
            parsedObj.question_text &&
            !isIncompleteQuestion(parsedObj.question_text) &&
            parsedObj.options &&
            Array.isArray(parsedObj.options) &&
            parsedObj.options.length >= 2
          ) {
            recovered.push(parsedObj);
          }
        } catch {
          // ignore unparseable partial object
        }
      }
    }

    return recovered;
  }

  private async saveQuestionsToDb(questions: any[], subject: string, sourceType: GenerationSourceType): Promise<number> {
    let savedCount = 0;
    for (const q of questions) {
      if (!q.question_text || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
        continue;
      }

      if (isIncompleteQuestion(q.question_text)) {
        this.logger.warn(`Discarded incomplete/truncated question stem for ${subject}: "${String(q.question_text).substring(0, 60)}..."`);
        continue;
      }

      const sanitizedStem = sanitizeQuestionText(q.question_text);
      if (!sanitizedStem || sanitizedStem.length < 10) {
        continue;
      }

      const formattedOptions = q.options.map((opt: any, idx: number) => {
        const optionId = (opt.id || ['A', 'B', 'C', 'D', 'E'][idx] || 'A').toUpperCase().trim();
        let optionText = typeof opt === 'string' ? opt : String(opt.text || opt);
        optionText = cleanOptionText(optionText);
        return { id: optionId, text: optionText };
      });

      const rawCorrect = String(q.correct_option || 'A').toUpperCase().trim();
      const validCorrect = ['A', 'B', 'C', 'D', 'E'].includes(rawCorrect[0]) ? rawCorrect[0] : 'A';

      let cleanSvg = q.diagram_svg;
      if (cleanSvg && typeof cleanSvg === 'string') {
        cleanSvg = cleanSvg.replace(/^```(?:xml|svg)?\s*/i, '').replace(/\s*```$/, '').trim();
      }

      const questionType = cleanSvg ? 'image_based' : q.latex ? 'latex' : 'mcq_single';

      const id = `q_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const newQuestion = {
        id,
        subject: (q.subject || subject).toLowerCase().trim(),
        topic: q.topic || 'General',
        question_text: sanitizedStem,
        options: formattedOptions,
        correct_option: validCorrect,
        explanation: q.explanation ? sanitizeExplanation(q.explanation) : null,
        question_type: questionType,
        difficulty_level: Math.min(5, Math.max(1, Number(q.difficulty_level) || 3)),
        has_diagram: Boolean(q.has_diagram || cleanSvg),
        diagram_svg: cleanSvg || null,
        latex: q.latex || null,
        import_batch_id: `ai_${sourceType}_${Date.now()}`,
        source: 'ai_generated',
        question_source_type: sourceType,
        created_by: 'ai_generator',
        status: 'published',
      };

      try {
        await this.db.insert(schema.questions).values(newQuestion as any).onConflictDoNothing();
        savedCount++;
      } catch (dbErr: any) {
        this.logger.error(`Database insertion error for question '${id}': ${dbErr.message}`);
      }
    }

    if (savedCount > 0) {
      this.logger.log(`Successfully persisted ${savedCount} questions into database for subject '${subject}'.`);
    }

    return savedCount;
  }

  async getGenerationStatus(): Promise<GenerationStatus> {
    const totals = await this.db
      .select({
        sourceType: schema.questions.question_source_type,
        count: count(),
      })
      .from(schema.questions)
      .groupBy(schema.questions.question_source_type);

    let newText = 0;
    let newSvgDiagram = 0;
    let scannedPastPaper = 0;

    totals.forEach((row) => {
      const type = row.sourceType || 'new_text';
      if (type === 'new_svg_diagram') newSvgDiagram = Number(row.count);
      else if (type === 'scanned_past_paper') scannedPastPaper = Number(row.count);
      else newText += Number(row.count);
    });

    const subjectRows = await this.db
      .select({
        subject: schema.questions.subject,
        sourceType: schema.questions.question_source_type,
        count: count(),
      })
      .from(schema.questions)
      .groupBy(schema.questions.subject, schema.questions.question_source_type);

    const bySubject: Record<string, { newText: number; newSvgDiagram: number; scannedPastPaper: number }> = {};

    subjectRows.forEach((row) => {
      const sub = row.subject || 'unknown';
      if (!bySubject[sub]) {
        bySubject[sub] = { newText: 0, newSvgDiagram: 0, scannedPastPaper: 0 };
      }
      const st = row.sourceType || 'new_text';
      if (st === 'new_svg_diagram') bySubject[sub].newSvgDiagram += Number(row.count);
      else if (st === 'scanned_past_paper') bySubject[sub].scannedPastPaper += Number(row.count);
      else bySubject[sub].newText += Number(row.count);
    });

    return {
      isRunning: this.isRunning,
      activeJob: this.activeJob,
      generatedInCurrentJob: this.generatedInCurrentJob,
      totalStats: {
        newText,
        newSvgDiagram,
        scannedPastPaper,
        bySubject,
      },
    };
  }
}
