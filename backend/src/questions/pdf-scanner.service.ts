import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

const execAsync = promisify(exec);

export interface ScanProgress {
  isScanning: boolean;
  currentDirectory: string;
  scannedFiles: string[];
  currentFile: string | null;
  totalExtractedQuestions: number;
  logs: string[];
}

@Injectable()
export class PdfScannerService {
  private readonly logger = new Logger(PdfScannerService.name);
  private readonly defaultDirectory = 'C:\\Users\\DELL\\Downloads\\PQ';

  private isScanning = false;
  private currentDirectory = this.defaultDirectory;
  private scannedFiles: string[] = [];
  private currentFile: string | null = null;
  private totalExtractedQuestions = 0;
  private logs: string[] = [];

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  getScanProgress(): ScanProgress {
    return {
      isScanning: this.isScanning,
      currentDirectory: this.currentDirectory,
      scannedFiles: this.scannedFiles,
      currentFile: this.currentFile,
      totalExtractedQuestions: this.totalExtractedQuestions,
      logs: this.logs.slice(-50), // last 50 log messages
    };
  }

  private addLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${msg}`;
    this.logs.push(logLine);
    this.logger.log(msg);
  }

  async scanDirectory(
    dirPath: string = this.defaultDirectory,
  ): Promise<{ success: boolean; message: string }> {
    if (this.isScanning) {
      return {
        success: false,
        message: `Already scanning file: ${this.currentFile}`,
      };
    }

    const targetDir = dirPath || this.defaultDirectory;
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch {
        return {
          success: false,
          message: `Directory '${targetDir}' does not exist on the web server. Since you are using the deployed website, please click 'Upload PDF Past Paper File' to upload your PDF directly from your PC!`,
        };
      }
    }

    this.isScanning = true;
    this.currentDirectory = targetDir;
    this.scannedFiles = [];
    this.currentFile = null;
    this.totalExtractedQuestions = 0;
    this.logs = [];

    this.addLog(`Starting PDF scan job in directory: ${targetDir}`);

    // Asynchronously execute scanner loop
    this.runDirectoryScanner(targetDir).catch((err) => {
      this.addLog(`Scanner job failed: ${err.message}`);
      this.isScanning = false;
    });

    return {
      success: true,
      message: `Started scanning PDF past papers in '${targetDir}'.`,
    };
  }

  async scanUploadedPdf(fileBuffer: Buffer, filename: string): Promise<{ success: boolean; extractedCount: number; message: string }> {
    try {
      this.addLog(`Processing uploaded PDF past paper: ${filename}...`);
      const subject = this.inferSubjectFromFilename(filename);

      let pdfData: any = null;
      try {
        pdfData = await pdfParse(fileBuffer);
      } catch (err: any) {
        this.addLog(`Failed to parse PDF binary content: ${err.message}`);
        return { success: false, extractedCount: 0, message: `Could not read PDF file format: ${err.message}` };
      }

      const rawText = pdfData?.text || '';
      this.addLog(`PDF loaded: ${pdfData?.numpages || 0} pages, ${rawText.length} characters extracted from ${filename}.`);

      if (!rawText || rawText.trim().length < 50) {
        return {
          success: true,
          extractedCount: 0,
          message: `Uploaded '${filename}' appears to be a scanned image PDF (no embedded text layer found). Please upload a text-readable PDF or use AI Generator.`,
        };
      }

      const questions = await this.extractQuestionsFromText(rawText, subject, filename);
      if (questions && questions.length > 0) {
        await this.saveScannedQuestions(questions, filename);
        return {
          success: true,
          extractedCount: questions.length,
          message: `Successfully extracted ${questions.length} questions from '${filename}'!`,
        };
      }

      return {
        success: true,
        extractedCount: 0,
        message: `Processed '${filename}', but no standard 4-option questions were detected in the text.`,
      };
    } catch (e: any) {
      this.addLog(`Error processing uploaded file ${filename}: ${e.message}`);
      return { success: false, extractedCount: 0, message: `Failed to scan ${filename}: ${e.message}` };
    }
  }

  private async runDirectoryScanner(targetDir: string) {
    try {
      const files = fs.readdirSync(targetDir);
      const pdfFiles = files.filter((f) => f.toLowerCase().endsWith('.pdf'));

      this.addLog(`Found ${pdfFiles.length} PDF files in directory.`);

      for (const pdfFile of pdfFiles) {
        if (!this.isScanning) break;

        const fullPath = path.join(targetDir, pdfFile);
        this.currentFile = pdfFile;
        this.addLog(`Processing PDF past paper: ${pdfFile}...`);

        const fileBuffer = fs.readFileSync(fullPath);
        const res = await this.scanUploadedPdf(fileBuffer, pdfFile);
        if (res.success && res.extractedCount > 0) {
          this.totalExtractedQuestions += res.extractedCount;
          this.addLog(
            `Extracted & saved ${res.extractedCount} questions from ${pdfFile}. Total: ${this.totalExtractedQuestions}`,
          );
        } else {
          this.addLog(`Directory scan note for ${pdfFile}: ${res.message}`);
        }

        this.scannedFiles.push(pdfFile);
      }

      this.addLog(
        `PDF Scanning complete! Total questions processed: ${this.totalExtractedQuestions}`,
      );
    } catch (err: any) {
      this.addLog(`Error scanning directory: ${err.message}`);
    } finally {
      this.isScanning = false;
      this.currentFile = null;
    }
  }

  private async extractQuestionsFromText(rawText: string, subject: string, filename: string): Promise<any[]> {
    const chunkSize = 3500;
    const chunks: string[] = [];
    for (let i = 0; i < rawText.length; i += chunkSize) {
      chunks.push(rawText.substring(i, i + chunkSize));
    }

    this.addLog(`Split document text into ${chunks.length} processing chunks for subject '${subject}'.`);

    const allQuestions: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const prompt = `You are an expert JAMB UTME exam scanner. Extract all standard 4-option multiple-choice questions from the following past paper text content.
Subject: ${subject}
Source File: ${filename}

Text Content (Chunk ${i + 1}/${chunks.length}):
${chunk}

Strict Formatting Instructions:
- Return ONLY a raw JSON array of objects. Do not wrap in markdown or backticks if possible.
- Output JSON schema for each question object:
[
  {
    "subject": "${subject}",
    "topic": "Topic Name",
    "question_text": "Stem question text",
    "options": [
      { "id": "A", "text": "Option A text" },
      { "id": "B", "text": "Option B text" },
      { "id": "C", "text": "Option C text" },
      { "id": "D", "text": "Option D text" }
    ],
    "correct_option": "A",
    "explanation": "Detailed explanation",
    "difficulty_level": 3,
    "latex": null
  }
]`;

        const responseText = await this.callMistralApi(prompt);
        if (responseText) {
          const parsed = this.cleanAndParseQuestions(responseText, subject);
          if (parsed && parsed.length > 0) {
            allQuestions.push(...parsed);
            this.addLog(`Chunk ${i + 1}/${chunks.length}: Extracted ${parsed.length} questions.`);
          }
        }
      } catch (err: any) {
        this.addLog(`Chunk ${i + 1}/${chunks.length} parsing note: ${err.message}`);
      }
    }

    return allQuestions;
  }

  private async callMistralApi(prompt: string): Promise<string | null> {
    const mistralKey = process.env.MISTRAL_API_KEY || 'mstrl_JQlXieutzBLjhxC6HJnqbCBM893KsBqJ_0CcPas';
    const url = 'https://api.mistral.ai/v1/chat/completions';

    try {
      const res = await axios.post(
        url,
        {
          model: 'ministral-3b-latest',
          messages: [
            {
              role: 'system',
              content: 'You are a high-accuracy educational past paper text scanner. Extract structured exam questions in raw JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 3000,
        },
        {
          headers: {
            Authorization: `Bearer ${mistralKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        },
      );

      return res.data?.choices?.[0]?.message?.content || null;
    } catch (e: any) {
      this.logger.warn(`Mistral API call failed in PDF scanner: ${e.message}`);
      return null;
    }
  }

  private cleanAndParseQuestions(rawText: string, defaultSubject: string): any[] {
    let clean = rawText.trim();

    // Strip markdown code fence blocks if present
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

    // Control character & escape sanitizer
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
          // omit control codes
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
          // omit control chars outside string literals
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

    try {
      const items = JSON.parse(result);
      if (Array.isArray(items)) return items;
    } catch {
      // Object-level recovery fallback
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
        return recovered;
      }
    }

    return [];
  }

  private inferSubjectFromFilename(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('math')) return 'mathematics';
    if (lower.includes('bio')) return 'biology';
    if (lower.includes('chem')) return 'chemistry';
    if (lower.includes('english')) return 'english';
    if (lower.includes('physic') || lower.includes('physics')) return 'physics';
    if (lower.includes('gov')) return 'government';
    if (lower.includes('econ')) return 'economics';
    if (lower.includes('agri')) return 'agriculture';
    if (lower.includes('acc') || lower.includes('financial')) return 'accounting';
    if (lower.includes('lit')) return 'literature';
    if (lower.includes('comm')) return 'commerce';
    if (lower.includes('geog')) return 'geography';
    if (lower.includes('crk') || lower.includes('crs')) return 'crk';
    if (lower.includes('irk') || lower.includes('irs')) return 'irk';
    if (lower.includes('civic')) return 'civic_education';
    if (lower.includes('hist')) return 'history';
    return 'general';
  }

  private async saveScannedQuestions(questions: any[], filename: string) {
    for (const q of questions) {
      if (!q.question_text || !q.options || !Array.isArray(q.options)) {
        continue;
      }

      const formattedOptions = q.options.map((opt: any, idx: number) => {
        const optionId = (opt.id || ['A', 'B', 'C', 'D', 'E'][idx] || 'A').toUpperCase().trim();
        const optionText = typeof opt === 'string' ? opt : String(opt.text || opt);
        return { id: optionId, text: optionText };
      });

      const rawCorrect = String(q.correct_option || 'A').toUpperCase().trim();
      const validCorrect = ['A', 'B', 'C', 'D', 'E'].includes(rawCorrect[0]) ? rawCorrect[0] : 'A';

      const id = `q_scan_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const newQuestion = {
        id,
        subject: (q.subject || this.inferSubjectFromFilename(filename)).toLowerCase().trim(),
        topic: q.topic || 'Past Questions',
        question_text: q.question_text,
        options: formattedOptions,
        correct_option: validCorrect,
        explanation: q.explanation || null,
        question_type: 'mcq_single',
        difficulty_level: Math.min(5, Math.max(1, Number(q.difficulty_level) || 3)),
        has_diagram: Boolean(q.has_diagram || q.diagram_svg),
        diagram_svg: q.diagram_svg || null,
        latex: q.latex || null,
        import_batch_id: filename,
        source: 'import',
        question_source_type: 'scanned_past_paper',
        created_by: 'pdf_scanner',
        status: 'published',
      };

      await this.db.insert(schema.questions).values(newQuestion as any).onConflictDoNothing();
    }
  }
}
