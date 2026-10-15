import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { sanitizeQuestionText } from '../questions/utils/question-sanitizer';
import { UploadService } from '../upload/upload.service';

export interface ClefAuditResult {
  leaksAnswerProbability: number;
  hasHintProbability: number;
  isTruncatedProbability: number;
  hasLatexErrorProbability: number;
  suggestedDifficulty: 'easy' | 'medium' | 'hard';
  flaggedForReview: boolean;
  reasons: string[];
}

export interface ClefProctoringResult {
  multiplePeopleProbability: number;
  cellPhoneProbability: number;
  lookingAwayProbability: number;
  violationFlagged: boolean;
  violationType?: 'multiple_people' | 'cell_phone' | 'looking_away';
  reasons: string[];
}

export interface ClefAdaptiveRoutingResult {
  shouldIncreaseDifficulty: boolean;
  shouldDecreaseDifficulty: boolean;
  needsRemedialReview: boolean;
  confidence: number;
}

@Injectable()
export class ClefDecisionService {
  private readonly logger = new Logger(ClefDecisionService.name);
  private readonly baseUrl = 'https://api.cloudflare.com/client/v4/accounts';
  private readonly defaultModel = '@cf/cloudflare/clef-omni';
  private readonly uploader: UploadService;

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly uploadService?: UploadService,
  ) {
    this.uploader = this.uploadService || new UploadService();
  }

  private getCredentials(): { accountId: string; apiToken: string } {
    const accountId = this.config.get<string>('CLOUDFLARE_ACCOUNT_ID') || process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = this.config.get<string>('CLOUDFLARE_API_TOKEN') || process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare AI credentials missing in environment (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN)');
    }

    return { accountId, apiToken };
  }

  /**
   * Executes a generic decision schema on Cloudflare Clef
   */
  async runDecision(state: any, questions: Record<string, any>, modelName: string = this.defaultModel): Promise<any> {
    const { accountId, apiToken } = this.getCredentials();
    const endpoint = `${this.baseUrl}/${accountId}/ai/run/${modelName}`;
    const cleanModelName = modelName.replace('@cf/cloudflare/', '');

    const payload = {
      model: cleanModelName,
      state,
      questions,
    };

    const response = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    if (!response.data?.success || !response.data?.result?.answers) {
      throw new Error(`Clef execution failed: ${JSON.stringify(response.data?.errors || 'Unknown error')}`);
    }

    return response.data.result.answers;
  }

  /**
   * Feature 3: Question Sanity & Content Quality Audit Engine
   * Evaluates questions for leaked answers, hints, truncation, and LaTeX issues.
   */
  async auditQuestion(input: {
    questionText: string;
    options?: string[];
    explanation?: string;
    subject?: string;
  }): Promise<ClefAuditResult> {
    const stateText = [
      input.subject ? `Subject: ${input.subject}` : '',
      `Question: ${input.questionText}`,
      input.options && input.options.length > 0 ? `Options: ${input.options.join(' | ')}` : '',
      input.explanation ? `Provided Explanation: ${input.explanation}` : '',
    ].filter(Boolean).join('\n');

    const questions = {
      leaks_answer: {
        type: 'noul',
        instructions: 'Does the question text explicitly state which letter or option is the correct answer, such as "Correct Option: A" or "Answer is B" or "The correct option is"?',
      },
      has_hint: {
        type: 'noul',
        instructions: 'Does the question text include an explicit hint, giveaway clue, or instruction telling the candidate which option to pick?',
      },
      is_truncated: {
        type: 'noul',
        instructions: 'Is the question text cut off mid-sentence, grammatically incomplete, or missing essential problem parameters?',
      },
      has_latex_error: {
        type: 'noul',
        instructions: 'Does the text contain malformed LaTeX formulas, broken math syntax, double escape slashes, or unclosed math delimiters?',
      },
      difficulty: {
        type: 'choice',
        instructions: 'What is the appropriate academic difficulty tier for this question?',
        criteria: {
          easy: 'Basic recall, standard definitions, or simple single-step calculations',
          medium: 'Moderate conceptual understanding or multi-step problem solving',
          hard: 'Advanced synthesis, complex derivations, or tricky conceptual traps',
        },
      },
    };

    const answers = await this.runDecision(stateText, questions);

    const leaksProb = answers.leaks_answer?.noul ?? 0;
    const hintProb = answers.has_hint?.noul ?? 0;
    const truncatedProb = answers.is_truncated?.noul ?? 0;
    const latexProb = answers.has_latex_error?.noul ?? 0;

    // Determine highest probability difficulty choice
    let suggestedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (answers.difficulty?.choice) {
      suggestedDifficulty = answers.difficulty.choice as 'easy' | 'medium' | 'hard';
    }

    const reasons: string[] = [];
    if (leaksProb > 0.6) reasons.push(`High risk of leaked answer (${(leaksProb * 100).toFixed(1)}% confidence)`);
    if (hintProb > 0.7) reasons.push(`Answer-revealing hint detected (${(hintProb * 100).toFixed(1)}% confidence)`);
    if (truncatedProb > 0.6) reasons.push(`Question appears truncated/incomplete (${(truncatedProb * 100).toFixed(1)}% confidence)`);
    if (latexProb > 0.65) reasons.push(`Potential LaTeX/KaTeX formula issue (${(latexProb * 100).toFixed(1)}% confidence)`);

    return {
      leaksAnswerProbability: leaksProb,
      hasHintProbability: hintProb,
      isTruncatedProbability: truncatedProb,
      hasLatexErrorProbability: latexProb,
      suggestedDifficulty,
      flaggedForReview: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Auto-Heals a corrupted or leaked question using deterministic sanitizer + Cloudflare Llama 3.1 8B
   */
  async healQuestion(input: {
    questionText: string;
    options?: string[];
    flaw?: string;
  }): Promise<{ healedText: string; isClean: boolean; finalScore: number }> {
    // Step 1: Deterministic regex sanitization
    let candidate = sanitizeQuestionText(input.questionText);

    // Audit with Clef
    let audit = await this.auditQuestion({ questionText: candidate, options: input.options });
    if (audit.leaksAnswerProbability < 0.25 && audit.isTruncatedProbability < 0.25) {
      return { healedText: candidate, isClean: true, finalScore: audit.leaksAnswerProbability };
    }

    // Step 2: Generative repair with Cloudflare Llama 3.1 8B
    try {
      const { accountId, apiToken } = this.getCredentials();
      const endpoint = `${this.baseUrl}/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8`;
      const prompt = `You are an expert examination editor. The multiple choice question stem below has an issue: "${input.flaw || 'leaked answer or incomplete text'}".
Clean and rewrite the question stem so it is grammatically complete, professional, and does NOT reveal the answer, leak options, or give away clues.
Do not output conversational filler, markdown headings, or commentary. Output ONLY the clean question text.

Original Stem:
${candidate}`;

      const res = await axios.post(
        endpoint,
        {
          messages: [
            { role: 'system', content: 'You are an academic exam editor. Return ONLY the edited question statement.' },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const generated = res.data?.result?.response?.trim();
      if (generated && generated.length > 10) {
        candidate = sanitizeQuestionText(generated);
      }
    } catch (e: any) {
      this.logger.warn(`Llama auto-healing fallback to sanitized regex: ${e.message}`);
    }

    // Step 3: Re-verify with Clef
    audit = await this.auditQuestion({ questionText: candidate, options: input.options });
    return {
      healedText: candidate,
      isClean: audit.leaksAnswerProbability < 0.35,
      finalScore: audit.leaksAnswerProbability,
    };
  }

  /**
   * Feature 2: Visual AI Proctoring Evaluation
   * Evaluates webcam frame snapshots for multiple faces, mobile devices, and screen attentiveness.
   * Primary: Cloudflare Clef (@cf/cloudflare/clef-omni) with Cloudinary storage for frame URLs.
   * Fallback: NVIDIA Llama 3.2 Vision for native base64 evaluation if Clef or upload fails.
   */
  async evaluateProctoringFrame(imageBase64OrUrl: string): Promise<ClefProctoringResult> {
    const isBase64 = imageBase64OrUrl.startsWith('data:image') || !imageBase64OrUrl.startsWith('http');
    let frameUrl = isBase64 ? '' : imageBase64OrUrl;

    // 1. If frame is base64, upload to Cloudinary (with backup storage) to provide a public URL for Cloudflare Clef
    if (isBase64) {
      try {
        const base64Clean = imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Clean, 'base64');
        const uploadResult = await this.uploader.uploadFile(
          buffer,
          `proctor_${Date.now()}.jpg`,
          'image/jpeg',
          'proctoring',
        );
        if (uploadResult?.url) {
          frameUrl = uploadResult.url;
        }
      } catch (uploadErr: any) {
        this.logger.warn(`Webcam frame upload to Cloudinary/storage failed: ${uploadErr.message}`);
      }
    }

    // 2. PRIMARY: Cloudflare Clef (@cf/cloudflare/clef-omni)
    if (frameUrl) {
      try {
        const questions = {
          multiple_people: {
            type: 'noul',
            instructions: 'Is more than one person visible in the image?',
          },
          cell_phone: {
            type: 'noul',
            instructions: 'Is a smartphone, mobile device, tablet, or unauthorized secondary screen visible?',
          },
          looking_away: {
            type: 'noul',
            instructions: 'Is the candidate turned completely away from the exam screen or looking off-camera continuously?',
          },
        };

        const answers = await this.runDecision({ image: frameUrl }, questions);

        const multPeopleProb = answers.multiple_people?.noul ?? 0;
        const phoneProb = answers.cell_phone?.noul ?? 0;
        const awayProb = answers.looking_away?.noul ?? 0;

        let violationFlagged = false;
        let violationType: 'multiple_people' | 'cell_phone' | 'looking_away' | undefined;
        const reasons: string[] = [];

        if (phoneProb > 0.6) {
          violationFlagged = true;
          violationType = 'cell_phone';
          reasons.push('Mobile phone or unauthorized device detected');
        }
        if (multPeopleProb > 0.65) {
          violationFlagged = true;
          violationType = violationType || 'multiple_people';
          reasons.push('Multiple individuals detected in exam space');
        }
        if (awayProb > 0.75) {
          violationFlagged = true;
          violationType = violationType || 'looking_away';
          reasons.push('Candidate turned away or looking off-camera');
        }

        return {
          multiplePeopleProbability: multPeopleProb,
          cellPhoneProbability: phoneProb,
          lookingAwayProbability: awayProb,
          violationFlagged,
          violationType,
          reasons,
        };
      } catch (clefErr: any) {
        this.logger.warn(`Primary Cloudflare Clef proctoring failed (${clefErr.message}). Routing to NVIDIA Vision fallback...`);
      }
    }

    // 3. FALLBACK: NVIDIA Llama 3.2 Vision (handles raw base64 frame directly)
    const nvidiaKey = this.config.get<string>('NVIDIA_API_KEY') || process.env.NVIDIA_API_KEY;
    if (nvidiaKey && isBase64) {
      try {
        const normalizedDataUrl = imageBase64OrUrl.startsWith('data:image')
          ? imageBase64OrUrl
          : `data:image/jpeg;base64,${imageBase64OrUrl}`;

        const response = await axios.post(
          'https://integrate.api.nvidia.com/v1/chat/completions',
          {
            model: 'meta/llama-3.2-11b-vision-instruct',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text:
                      'You are an expert AI exam proctor monitoring a candidate taking an examination via webcam. Analyze the image with extreme attention to exam integrity. Check carefully if the candidate is holding, checking, or looking at a smartphone, cell phone, mobile device, tablet, or unauthorized screen, or if another person is present in the frame, or if the candidate is looking completely away from the screen. Output ONLY a valid JSON object matching: {"candidate_present": boolean, "multiple_people": boolean, "cell_phone": boolean, "looking_away": boolean, "violation": boolean, "reasons": string[]}. Strict rule: If any phone, smartphone, mobile screen, or device is visible in the candidate\'s hand or in the background, set cell_phone=true, violation=true, and include an explanation in reasons.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: normalizedDataUrl,
                    },
                  },
                ],
              },
            ],
            temperature: 0.1,
            max_tokens: 300,
          },
          {
            headers: {
              Authorization: `Bearer ${nvidiaKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 12000,
          },
        );

        const content = response.data?.choices?.[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        const cellPhone = Boolean(parsed.cell_phone);
        const multiplePeople = Boolean(parsed.multiple_people);
        const lookingAway = Boolean(parsed.looking_away);
        const violation = Boolean(parsed.violation || cellPhone || multiplePeople || lookingAway);

        const reasons: string[] = Array.isArray(parsed.reasons) ? [...parsed.reasons] : [];
        if (cellPhone && !reasons.some((r) => r.toLowerCase().includes('phone') || r.toLowerCase().includes('device'))) {
          reasons.push('Mobile phone or unauthorized secondary device detected');
        }
        if (multiplePeople && !reasons.some((r) => r.toLowerCase().includes('multiple') || r.toLowerCase().includes('person'))) {
          reasons.push('Multiple individuals detected in exam space');
        }
        if (lookingAway && !reasons.some((r) => r.toLowerCase().includes('look') || r.toLowerCase().includes('away'))) {
          reasons.push('Candidate turned away or looking off-camera');
        }

        let violationType: 'multiple_people' | 'cell_phone' | 'looking_away' | undefined;
        if (cellPhone) violationType = 'cell_phone';
        else if (multiplePeople) violationType = 'multiple_people';
        else if (lookingAway) violationType = 'looking_away';

        return {
          multiplePeopleProbability: multiplePeople ? 0.95 : 0.05,
          cellPhoneProbability: cellPhone ? 0.95 : 0.05,
          lookingAwayProbability: lookingAway ? 0.9 : 0.05,
          violationFlagged: violation,
          violationType,
          reasons,
        };
      } catch (nvidiaErr: any) {
        this.logger.error(`Fallback NVIDIA Vision proctoring failed: ${nvidiaErr.message}`);
      }
    }

    return {
      multiplePeopleProbability: 0,
      cellPhoneProbability: 0,
      lookingAwayProbability: 0,
      violationFlagged: false,
      reasons: [],
    };
  }

  /**
   * Feature 4: Adaptive Quiz Difficulty & Session Routing
   */
  async evaluateAdaptiveRouting(metrics: {
    recentAccuracyPercent: number;
    avgTimeSeconds: number;
    currentDifficulty: string;
    unansweredStreak: number;
  }): Promise<ClefAdaptiveRoutingResult> {
    const stateText = `Candidate Exam Metrics:
- Recent Accuracy: ${metrics.recentAccuracyPercent}%
- Average Time per Question: ${metrics.avgTimeSeconds} seconds
- Current Difficulty Tier: ${metrics.currentDifficulty}
- Consecutive Unanswered Questions: ${metrics.unansweredStreak}`;

    const questions = {
      increase_difficulty: {
        type: 'noul',
        instructions: 'Based on the candidate high accuracy and fast completion time, should difficulty be promoted to the next tier?',
      },
      decrease_difficulty: {
        type: 'noul',
        instructions: 'Based on struggling accuracy or long timeouts, should difficulty be stepped down to assist the student?',
      },
      needs_remedial_review: {
        type: 'noul',
        instructions: 'Does this candidate show signs of systematic struggle requiring focused topical review?',
      },
    };

    const answers = await this.runDecision(stateText, questions);

    const increaseProb = answers.increase_difficulty?.noul ?? 0;
    const decreaseProb = answers.decrease_difficulty?.noul ?? 0;
    const remedialProb = answers.needs_remedial_review?.noul ?? 0;

    return {
      shouldIncreaseDifficulty: increaseProb > 0.7,
      shouldDecreaseDifficulty: decreaseProb > 0.65,
      needsRemedialReview: remedialProb > 0.65,
      confidence: Math.max(increaseProb, decreaseProb, remedialProb),
    };
  }

  /**
   * Semantic Duplicate Detection between two questions
   */
  async verifyQuestionDuplicate(questionA: string, questionB: string): Promise<{ isDuplicate: boolean; confidence: number }> {
    const stateText = `Question A:\n${questionA}\n\nQuestion B:\n${questionB}`;
    const questions = {
      are_duplicates: {
        type: 'noul',
        instructions: 'Are Question A and Question B testing the exact same academic problem with identical or trivially restated statements and answers?',
      },
    };

    const answers = await this.runDecision(stateText, questions);
    const prob = answers.are_duplicates?.noul ?? 0;

    return {
      isDuplicate: prob > 0.8,
      confidence: prob,
    };
  }
}
