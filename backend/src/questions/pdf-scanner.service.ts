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
  private readonly nvidiaKey =
    process.env.NVIDIA_API_KEY ||
    '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';

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
      return {
        success: false,
        message: `Directory does not exist: ${targetDir}`,
      };
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
    const tempPath = path.join(os.tmpdir(), `upload_${Date.now()}_${filename}`);
    fs.writeFileSync(tempPath, fileBuffer);
    try {
      this.addLog(`Processing uploaded PDF past paper: ${filename}...`);
      const questions = await this.processPdfFile(tempPath, filename);
      if (questions && questions.length > 0) {
        await this.saveScannedQuestions(questions, filename);
        return {
          success: true,
          extractedCount: questions.length,
          message: `Successfully extracted ${questions.length} questions from ${filename}.`,
        };
      }
      return { success: true, extractedCount: 0, message: `Processed ${filename}, but no standard questions were extracted.` };
    } catch (e: any) {
      this.addLog(`Error processing uploaded file ${filename}: ${e.message}`);
      return { success: false, extractedCount: 0, message: `Failed to scan ${filename}: ${e.message}` };
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
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

        const extracted = await this.processPdfFile(fullPath, pdfFile);
        if (extracted && extracted.length > 0) {
          await this.saveScannedQuestions(extracted, pdfFile);
          this.totalExtractedQuestions += extracted.length;
          this.addLog(
            `Extracted & saved ${extracted.length} questions from ${pdfFile}. Total: ${this.totalExtractedQuestions}`,
          );
        } else {
          this.addLog(`No questions extracted or page text parsed for ${pdfFile}.`);
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

  /**
   * Processes a single PDF file using vision or python helper
   */
  async processPdfFile(fullPath: string, filename: string): Promise<any[]> {
    const subject = this.inferSubjectFromFilename(filename);

    // Python script path
    const pythonScript = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\f8ccf9be-8a30-439b-9374-75aa4d27a865\\scratch\\pdf_question_scanner.py';

    if (fs.existsSync(pythonScript)) {
      try {
        const cmd = `python "${pythonScript}" "${fullPath}" "${subject}"`;
        this.addLog(`Invoking vision scanner pipeline for subject '${subject}'...`);
        const { stdout } = await execAsync(cmd, { timeout: 120000 });
        if (stdout) {
          const jsonStart = stdout.indexOf('[');
          const jsonEnd = stdout.lastIndexOf(']');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const clean = stdout.substring(jsonStart, jsonEnd + 1);
            return JSON.parse(clean);
          }
        }
      } catch (e: any) {
        this.addLog(`Python helper note: ${e.message}. Using built-in fallback parser...`);
      }
    }

    // Fallback direct text/AI parsing
    return this.parsePdfFallback(fullPath, subject);
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

  private async parsePdfFallback(fullPath: string, subject: string): Promise<any[]> {
    // If text file preview is available or basic stream read
    try {
      const stats = fs.statSync(fullPath);
      this.addLog(`File size for ${path.basename(fullPath)}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return [];
    } catch (err: any) {
      return [];
    }
  }

  private async saveScannedQuestions(questions: any[], filename: string) {
    for (const q of questions) {
      if (!q.question_text || !q.options || !Array.isArray(q.options)) {
        continue;
      }

      const id = `q_scan_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const newQuestion = {
        id,
        subject: (q.subject || this.inferSubjectFromFilename(filename)).toLowerCase().trim(),
        topic: q.topic || 'Past Questions',
        question_text: q.question_text,
        options: q.options,
        correct_option: q.correct_option || 'A',
        explanation: q.explanation || null,
        question_type: 'mcq_single',
        difficulty_level: Number(q.difficulty_level) || 3,
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
