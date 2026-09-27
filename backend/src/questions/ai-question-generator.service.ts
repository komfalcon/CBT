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

  // Free Tier & Metered API Keys
  private readonly nvidiaKey =
    process.env.NVIDIA_API_KEY ||
    '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';
  private readonly mistralKey =
    process.env.MISTRAL_API_KEY ||
    'mstrl_JQlXieutzBLjhxC6HJnqbCBM893KsBqJ_0CcPas';
  private readonly orcaKey =
    process.env.ORCAROUTER_API_KEY ||
    'sk-orca-gk0Simt2OkYhhB1TCYoEDT1j7zv8FSeVrjD5G11oGqu';

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

    // Run asynchronously in background
    this.runBackgroundGeneration(config).catch((err) => {
      this.logger.error(`Background generation failed: ${err.message}`, err.stack);
      this.isRunning = false;
      this.activeJob = null;
    });

    return {
      success: true,
      message: `Started background AI generation for subject '${config.subject}' (${config.sourceType}), targeting ${config.targetCount} questions.`,
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
      `Starting background generation job: subject=${config.subject}, type=${config.sourceType}, targetCount=${config.targetCount}`,
    );

    const isCalculationHeavy = ['accounting', 'further_mathematics', 'mathematics', 'physics', 'chemistry'].includes(config.subject.toLowerCase());
    const batchSize = config.sourceType === 'new_svg_diagram' ? 3 : isCalculationHeavy ? 4 : 8;

    while (this.isRunning && this.generatedInCurrentJob < config.targetCount) {
      const needed = Math.min(batchSize, config.targetCount - this.generatedInCurrentJob);
      try {
        const questions = await this.generateBatch(config.subject, config.sourceType, needed, config.topics);
        if (questions && questions.length > 0) {
          await this.saveQuestionsToDb(questions, config.subject, config.sourceType);
          this.generatedInCurrentJob += questions.length;
          this.logger.log(
            `Generated and saved ${questions.length} questions for ${config.subject}. Total in job: ${this.generatedInCurrentJob}/${config.targetCount}`,
          );
        } else {
          this.logger.warn(`Generated batch was empty for ${config.subject}. Retrying...`);
        }
      } catch (err: any) {
        this.logger.error(`Error in generation batch: ${err.message}`);
        // Pause briefly before retrying
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    this.logger.log(`Completed generation job for ${config.subject}. Total generated: ${this.generatedInCurrentJob}`);
    this.isRunning = false;
    this.activeJob = null;
  }

  /**
   * Generates a single batch of questions using the designated provider routing
   */
  async generateBatch(
    subject: string,
    sourceType: GenerationSourceType,
    count: number,
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
You create high-quality STEM questions containing embedded, responsive vector SVG diagrams.`;

      userPrompt = `Generate EXACTLY ${count} JAMB/UTME standard multiple-choice questions for '${subject}'.
Topics to cover: ${topicStr}.
Each question MUST include an inline vector SVG diagram in the 'diagram_svg' field.

Guidelines for SVG Diagrams:
- Must be valid XML/SVG code starting with <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"> and ending with </svg>.
- ALL SVG attribute values MUST use single quotes (e.g. <svg viewBox='0 0 400 300' fill='#3b82f6'>). Do NOT use double quotes inside SVG tags.
- Use clean dark/light mode compatible colors (e.g. stroke="#3b82f6", fill="#1e293b", text fill="#e2e8f0").
- Illustrate real concepts from: ${topicStr}.
- All string values MUST be single-line strings with escaped newlines (\\n).

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
You create step-by-step calculation questions formatted with LaTeX mathematics ($...$) and detailed solutions.`;

      userPrompt = `Generate EXACTLY ${count} calculation-based JAMB UTME questions for '${subject}'.
Topics to cover: ${topicStr}.
All mathematical equations must use LaTeX ($...$). Currency should use ₦ or N (Naira).
Populate 'latex' field with key formulas used.

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
You create reading passages, excerpts, cloze tests, or scenario case studies followed by analytical multiple-choice questions.`;

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
You generate a rich, dynamic mix of conceptual theory, step-by-step calculation (LaTeX), responsive vector SVG diagrams, and reading comprehension passages.`;

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
        systemPrompt = `You are an expert examiner for Nigerian UTME/JAMB in Humanities and Social Sciences (English, History, CRS, IRS, Government, Literature, Commerce, Civic Education).
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

    // Call chosen Provider (Prioritize Mistral API for fast 11s responses)
    let responseText = '';
    try {
      responseText = await this.callMistralApi(systemPrompt, userPrompt);
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

  private async callMistralApi(systemPrompt: string, userPrompt: string): Promise<string> {
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
        Authorization: `Bearer ${this.mistralKey}`,
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

    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const code = clean.charCodeAt(i);

      if (char === '"' && !escaped) {
        inString = !inString;
      }

      if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (code < 32) {
          // omit raw ASCII control codes
        } else if (char === '\\' && !escaped) {
          const nextChar = clean[i + 1];
          if (nextChar && '"/\\'.includes(nextChar)) {
            result += char;
          } else {
            result += '\\\\';
          }
        } else {
          result += char;
        }
      } else {
        if (code < 32 && char !== '\n' && char !== '\r' && char !== '\t') {
          // omit raw control chars outside string literals
        } else {
          result += char;
        }
      }

      if (char === '\\' && !escaped) {
        escaped = true;
      } else {
        escaped = false;
      }
    }

    result = result.replace(/,\s*([\]}])/g, '$1');

    result = result.replace(/("diagram_svg"\s*:\s*")([\s\S]*?)("\s*,\s*"latex"|\s*,\s*"source"|\s*,\s*"difficulty_level"|\s*,\s*"has_diagram"|\s*\})/g, (_m, p1, svg, p3) => {
      const safeSvg = svg.replace(/"/g, "'");
      return p1 + safeSvg + p3;
    });

    try {
      const items = JSON.parse(result);
      if (Array.isArray(items)) return items;
    } catch (e2: any) {
      const recovered: any[] = [];
      const objectMatches = result.match(/\{[\s\S]*?\}(?=\s*,|\s*\]|$)/g);
      if (objectMatches) {
        for (const objStr of objectMatches) {
          try {
            const cleanObj = objStr.replace(/,\s*}/g, '}');
            const parsedObj = JSON.parse(cleanObj);
            if (parsedObj && parsedObj.question_text && parsedObj.options && Array.isArray(parsedObj.options)) {
              recovered.push(parsedObj);
            }
          } catch {
            // ignore
          }
        }
      }

      if (recovered.length > 0) {
        this.logger.log(`Recovered ${recovered.length} valid question objects from AI response.`);
        return recovered;
      }

      this.logger.error(
        `Failed to parse AI JSON response: ${e2.message}. Raw output slice: ${rawText.slice(0, 200)}`,
      );
      return [];
    }

    return [];
  }

  private async saveQuestionsToDb(questions: any[], subject: string, sourceType: GenerationSourceType) {
    let savedCount = 0;
    for (const q of questions) {
      if (!q.question_text || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
        continue;
      }

      const formattedOptions = q.options.map((opt: any, idx: number) => {
        const optionId = (opt.id || ['A', 'B', 'C', 'D', 'E'][idx] || 'A').toUpperCase().trim();
        const optionText = typeof opt === 'string' ? opt : String(opt.text || opt);
        return { id: optionId, text: optionText };
      });

      const rawCorrect = String(q.correct_option || 'A').toUpperCase().trim();
      const validCorrect = ['A', 'B', 'C', 'D', 'E'].includes(rawCorrect[0]) ? rawCorrect[0] : 'A';

      const questionType = q.diagram_svg ? 'image_based' : q.latex ? 'latex' : 'mcq_single';

      const id = `q_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const newQuestion = {
        id,
        subject: (q.subject || subject).toLowerCase().trim(),
        topic: q.topic || 'General',
        question_text: q.question_text,
        options: formattedOptions,
        correct_option: validCorrect,
        explanation: q.explanation || null,
        question_type: questionType,
        difficulty_level: Math.min(5, Math.max(1, Number(q.difficulty_level) || 3)),
        has_diagram: Boolean(q.has_diagram || q.diagram_svg),
        diagram_svg: q.diagram_svg || null,
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
