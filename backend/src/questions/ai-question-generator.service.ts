import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { count, eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  NON_TECHNICAL_SUBJECTS,
  TECHNICAL_SUBJECTS,
  QuestionSourceType,
} from './types/question.types';

export interface GenerationJobConfig {
  subject: string;
  sourceType: 'new_text' | 'new_svg_diagram';
  targetCount: number;
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
      message: `Started generation job for subject '${config.subject}' (${config.sourceType}), targeting ${config.targetCount} questions.`,
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

    const batchSize = config.sourceType === 'new_svg_diagram' ? 3 : 10;
    while (this.isRunning && this.generatedInCurrentJob < config.targetCount) {
      const needed = Math.min(batchSize, config.targetCount - this.generatedInCurrentJob);
      try {
        const questions = await this.generateBatch(config.subject, config.sourceType, needed);
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
    sourceType: 'new_text' | 'new_svg_diagram',
    count: number,
  ): Promise<any[]> {
    const isNonTech = this.isNonTechnicalSubject(subject);

    let systemPrompt = '';
    let userPrompt = '';

    if (sourceType === 'new_svg_diagram') {
      systemPrompt = `You are a high-level educational content designer for Nigerian UTME/JAMB exams.
You create high-quality STEM questions containing embedded, responsive vector SVG diagrams.`;

      userPrompt = `Generate EXACTLY ${count} JAMB/UTME standard multiple-choice questions for the subject '${subject}'.
Each question MUST include an inline vector SVG diagram in the 'diagram_svg' field.

Guidelines for SVG Diagrams:
- Must be valid XML/SVG code starting with <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"> and ending with </svg>.
- ALL SVG attribute values MUST use single quotes (e.g. <svg viewBox='0 0 400 300' fill='#3b82f6'>). Do NOT use double quotes inside SVG tags.
- Use clean dark/light mode compatible colors (e.g. stroke="#3b82f6", fill="#1e293b", text fill="#e2e8f0").
- Illustrate real concepts (e.g., ray optics, electric circuits, force vectors, chemical structures, biological cell diagrams, Venn diagrams, geometric shapes, coordinate graphs).
- All string values ('question_text', 'explanation', 'diagram_svg') MUST be single-line strings with escaped newlines (\n). Do NOT output literal linebreaks.

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string
- 'question_text': string (full stem text)
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string (detailed solution walkthrough)
- 'difficulty_level': number (1 to 5)
- 'has_diagram': true
- 'diagram_svg': string (complete inline <svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>...</svg> code using single quotes)
- 'latex': string or null (use $...$ math formatting where applicable)

Respond ONLY with the raw JSON array.`;
    } else {
      // Standard Text Question Generation
      if (isNonTech) {
        systemPrompt = `You are an expert examiner for Nigerian UTME/JAMB in Humanities and Social Sciences (English, History, CRS, IRS, Government, Literature, Commerce, Civic Education).
Special Note for History: Prioritize authentic NIGERIAN HISTORY (e.g., 1960 Independence, 1914 Amalgamation, pre-colonial Oyo, Benin, Sokoto Caliphate, Kanem-Borno empires, constitutional developments like Richards/Macpherson constitutions, military regimes, democratic transitions, nationalism).
For English: Comprehension passages, antonyms, synonyms, stress patterns, registers, and grammatical accuracy.`;

        userPrompt = `Generate EXACTLY ${count} high-quality JAMB standard CBT questions for '${subject}'.

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string
- 'question_text': string
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string
- 'difficulty_level': number (1 to 5)
- 'has_diagram': false
- 'diagram_svg': null

Respond ONLY with the raw JSON array.`;
      } else {
        systemPrompt = `You are an expert examiner for Nigerian UTME/JAMB in STEM subjects (Mathematics, Physics, Chemistry, Biology, Geography, Accounting, Further Math).
All mathematical and chemical equations MUST use standard LaTeX enclosed in $...$ (e.g. $f(x) = \\int_0^1 x^2 dx$ or $H_2SO_4$).`;

        userPrompt = `Generate EXACTLY ${count} high-quality JAMB standard CBT questions for '${subject}'.

Output a raw JSON array containing objects with:
- 'subject': "${subject}"
- 'topic': string
- 'question_text': string (including LaTeX math expressions)
- 'options': array of 4 objects [{ 'id': 'A', 'text': '...' }, { 'id': 'B', 'text': '...' }, { 'id': 'C', 'text': '...' }, { 'id': 'D', 'text': '...' }]
- 'correct_option': 'A' | 'B' | 'C' | 'D'
- 'explanation': string (step-by-step mathematical or scientific derivation)
- 'difficulty_level': number (1 to 5)
- 'has_diagram': false
- 'diagram_svg': null
- 'latex': string or null

Respond ONLY with the raw JSON array.`;
      }
    }

    // Call chosen Provider (Prioritize Mistral API for fast 11s responses with LaTeX & SVG support)
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
          max_tokens: 3000,
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
      max_tokens: 3000,
      temperature: 0.3,
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.mistralKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
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
      max_tokens: 3000,
      temperature: 0.3,
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.orcaKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return res.data?.choices?.[0]?.message?.content || '';
  }

  private parseJsonResponse(rawText: string): any[] {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    const jsonStart = clean.indexOf('[');
    const jsonEnd = clean.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      clean = clean.substring(jsonStart, jsonEnd + 1);
    }
    clean = clean.replace(/,\s*([\]}])/g, '$1');
    // Pre-repair unquoted string values like "explanation": *Option B* or backticked SVG strings "diagram_svg": `<svg...>`
    clean = clean.replace(/:\s*`([\s\S]*?)`/g, (_m, p1) => `:${JSON.stringify(p1)}`);
    clean = clean.replace(/:\s*(\*[^\r\n,}]+\*)/g, ':"$1"');

    // 1. State-machine JSON repair & control-char sanitizer: handles unescaped literal newlines/tabs/control chars inside quotes & LaTeX single backslashes
    let inString = false;
    let escaped = false;
    let result = '';

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const code = clean.charCodeAt(i);

      if (char === '"' && !escaped) {
        inString = !inString;
        result += char;
      } else if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          // omit carriage return
        } else if (char === '\t') {
          result += '\\t';
        } else if (code < 32) {
          // omit raw ASCII control codes (0x00 - 0x1F) inside string literals
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

    // Convert any unescaped double quotes inside diagram_svg field to single quotes
    result = result.replace(/("diagram_svg"\s*:\s*")([\s\S]*?)("\s*,\s*"latex"|\s*,\s*"source"|\s*,\s*"difficulty_level"|\s*,\s*"has_diagram"|\s*\})/g, (_m, p1, svg, p3) => {
      const safeSvg = svg.replace(/"/g, "'");
      return p1 + safeSvg + p3;
    });

    try {
      const items = JSON.parse(result);
      if (Array.isArray(items)) return items;
    } catch (e2: any) {
      // 3. Object-level recovery fallback: extract valid individual question objects from response
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
            // ignore unparseable single object
          }
        }
      }

      if (recovered.length > 0) {
        this.logger.log(`Recovered ${recovered.length} valid question objects from partially truncated AI response.`);
        return recovered;
      }

      this.logger.error(
        `Failed to parse AI JSON response: ${e2.message}. Raw output slice: ${rawText.slice(0, 200)}`,
      );
      return [];
    }

    return [];
  }

  private async saveQuestionsToDb(questions: any[], subject: string, sourceType: QuestionSourceType) {
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

      const id = `q_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const newQuestion = {
        id,
        subject: (q.subject || subject).toLowerCase().trim(),
        topic: q.topic || 'General',
        question_text: q.question_text,
        options: formattedOptions,
        correct_option: validCorrect,
        explanation: q.explanation || null,
        question_type: 'mcq_single',
        difficulty_level: Math.min(5, Math.max(1, Number(q.difficulty_level) || 3)),
        has_diagram: Boolean(q.has_diagram || q.diagram_svg),
        diagram_svg: q.diagram_svg || null,
        latex: q.latex || null,
        source: 'ai_generated',
        question_source_type: sourceType,
        created_by: 'ai_system',
        status: 'published',
      };

      try {
        await this.db.insert(schema.questions).values(newQuestion as any);
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
    // Query totals by source type
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

    // Query per-subject counts
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
