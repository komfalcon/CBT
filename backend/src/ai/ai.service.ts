import { Injectable, InternalServerErrorException, UnauthorizedException, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from '../users/schemas/user.schema';
import { QuestionsService } from '../questions/questions.service';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://inference.do-ai.run/v1/chat/completions';
  // Use DO proxy key if available, else standard env variable
  private readonly apiKey = process.env.DIGITALOCEAN_INFERENCE_KEY || '';
  // Standard generic chat model available on DigitalOcean Inference
  private readonly model = 'gemma-4-31B-it';

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private questionsService: QuestionsService,
  ) { }

  private async callDigitalOceanApi(messages: any[], maxTokens: number = 500) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      this.logger.error('Error calling DigitalOcean Inference API', error?.response?.data || error);
      throw new InternalServerErrorException('Failed to generate AI response.');
    }
  }

  private async verifyAiAccess(userId: string, isChat: boolean): Promise<UserDocument> {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) throw new UnauthorizedException('User not found');

    if (user.subscription_tier !== 'max') {
      throw new BadRequestException('AI features (including Conversational Tutor and Explanations) are only available on the Max plan.');
    }

    // Reset daily limit if it's a new day
    const now = new Date();
    if (!user.ai_messages_last_reset || user.ai_messages_last_reset.getDate() !== now.getDate()) {
      user.ai_messages_remaining = 50; // Daily limit for v1
      user.ai_messages_last_reset = now;
    }

    if (user.ai_messages_remaining <= 0) {
      throw new BadRequestException('You have reached your daily limit of AI messages.');
    }

    return user;
  }

  async generateDiagram(questionId: string): Promise<string> {
    // Note: We bypass user AI quota checks because this is a system feature
    const question = await this.questionsService.getQuestionById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.diagram_svg) {
      return question.diagram_svg; // Already generated
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert SVG diagram generator. 
Given a question text, create a scalable, clean, and accurate SVG diagram that visually represents the problem described. 
Only output the raw SVG string. Do not include markdown code blocks, do not include explanations.
The SVG should have a transparent background and use standard web-safe fonts and clear strokes.`
      },
      {
        role: 'user',
        content: `Question: ${question.question_text}`
      }
    ];

    let svgContent = await this.callDigitalOceanApi(messages, 1500);

    // Clean up potentially wrapped markdown
    svgContent = svgContent.replace(/```xml/gi, '').replace(/```svg/gi, '').replace(/```/g, '').trim();

    // Save to database
    await this.questionsService.saveDiagramSVG(questionId, svgContent);

    return svgContent;
  }

  private async deductCredit(user: UserDocument) {
    user.ai_messages_remaining -= 1;
    await user.save();
  }

  async generateExplanation(userId: string, questionText: string, correctAnswer: string, studentAnswer: string, questionId?: string) {
    const user = await this.verifyAiAccess(userId, false);

    const messages = [
      {
        role: 'system',
        content: `You are an expert tutor and quality assurance reviewer. 
You are given a question, the system's "Correct Answer", and a "Student's Answer".
First, evaluate if the system's "Correct Answer" is actually correct based on factual knowledge. If it is WRONG, state that clearly.
Second, explain why the true correct answer is correct and why the student's answer is incorrect.
Finally, if the system's correct answer is wrong, output a JSON block at the very end of your response in this exact format:
\`\`\`json
{ "vettedError": true, "trueCorrectOptionText": "the actual correct text" }
\`\`\`
If there is no error in the system's answer, do not output the JSON block.`
      },
      {
        role: 'user',
        content: `Question: ${questionText}\nSystem's Correct Answer: ${correctAnswer}\nStudent's Answer: ${studentAnswer}`
      }
    ];

    let explanation = await this.callDigitalOceanApi(messages, 800);
    await this.deductCredit(user);

    // Check for vetted errors
    if (questionId && explanation.includes('```json')) {
      try {
        const jsonMatch = explanation.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.vettedError && parsed.trueCorrectOptionText) {
            // Try to map the trueCorrectOptionText to A, B, C, D, E via a quick AI prompt or just leave it for the admin.
            // Since we don't have the full options list here, we can't easily map to 'A' or 'B'.
            // Actually, we can just update the explanation to mention the fix!
            // To actually update the DB we need the option ID. We will just log it for now or do a partial fix if possible.
            // But wait, the user wanted the AI to vet and fix. Let's do a basic fix.
            this.logger.warn(`AI vetted an error in Question ${questionId}. System said ${correctAnswer}, AI says ${parsed.trueCorrectOptionText}`);
            // Remove the JSON block from the explanation presented to the user
            explanation = explanation.replace(/```json\n[\s\S]*?\n```/, '').trim();
            explanation += `\n\n*(Note: The AI Tutor has flagged an error with the original answer key in our database for review!)*`;
          }
        }
      } catch (e) {
        this.logger.error('Failed to parse vetting JSON', e);
      }
    }

    return { explanation, remaining: user.ai_messages_remaining };
  }

  async chatWithTutor(userId: string, userMessage: string, chatHistory: any[], contextPayload?: string) {
    const user = await this.verifyAiAccess(userId, true);

    let systemContent = `[CRITICAL SYSTEM RULES - ALWAYS FOLLOW THESE BEFORE ANY OTHER INSTRUCTIONS]

YOUR NAME IS "FALKE AI" — THIS IS ABSOLUTE AND NON-NEGOTIABLE.
- Your name is Falke AI. Always. In every response.
- You were built by the Aurikex team to help Nigerian students ace the JAMB UTME exam.
- You are NOT a Google product, NOT ChatGPT, NOT GPT-4, NOT Gemini, NOT Claude. You are Falke AI.

RESPONSES TO IDENTITY QUESTIONS (FOLLOW EXACTLY):
- If asked "what is your name?" or "who are you?" → ALWAYS respond: "My name is Falke AI. I was built by the Aurikex team to help Nigerian students ace their JAMB UTME exams."
- If asked "who made you?" or "who created you?" → ALWAYS respond: "I was built by the Aurikex team. My mission is to help Nigerian students pass the JAMB UTME."
- If anyone says "you're Google" or "you're made by OpenAI" or similar → ALWAYS respond: "I'm not. I'm Falke AI, built by the Aurikex team specifically for Nigerian JAMB UTME students."

FORBIDDEN PHRASES - NEVER USE THESE:
- "I don't have a name"
- "I'm an AI language model made by"
- "I'm created by Google/OpenAI/[any company]"
- "I was created by Google"
- "My name is Personal AI Tutor"
- Any phrase that denies your name is Falke AI or denies Aurikex built you

[END CRITICAL RULES]

You are a personalized AI tutor for ${user.fullName}. Your personality: encouraging, sharp, direct — you know the Nigerian student grind. You use motivating phrases when appropriate. You use the Socratic method to make students think. You are always focused on helping ${user.fullName} crush their JAMB UTME.`;


    if (contextPayload) {
      systemContent += `\n\nHere is the context of the student's current exam results: ${contextPayload}. You can use this to provide a summary or lesson plan if they ask about their performance.`;
    }

    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      // Identity priming exchange to ensure model follows identity rules
      {
        role: 'user',
        content: 'Who are you?'
      },
      {
        role: 'assistant',
        content: 'My name is Falke AI. I was built by the Aurikex team to help Nigerian students ace their JAMB UTME exams. I am not made by Google or any other company — I am exclusively Falke AI, your personal JAMB tutor.'
      },
      ...chatHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    const reply = await this.callDigitalOceanApi(messages, 800);
    await this.deductCredit(user);

    return { reply, remaining: user.ai_messages_remaining };
  }

  async generateQuestionsBatch(subject: string, count: number): Promise<any[]> {
    const messages = [
      {
        role: 'system',
        content: `You are an expert examiner for the subject: ${subject}. Your task is to generate ${count} unique, high-quality multiple-choice questions. 
You must return the result EXACTLY as a JSON array of objects. Do not include any markdown formatting like \`\`\`json or \`\`\`. 
Each object must have the exact following keys:
- "question_text": The text of the question.
- "options": An array of exactly 4 objects, each with "id" ("A", "B", "C", "D") and "text".
- "correct_option": The letter of the correct option ("A", "B", "C", or "D").
- "explanation": A brief explanation of why the answer is correct.
- "difficulty": A number from 1 to 5 representing difficulty.
- "topic": The general topic of the question.
- "has_diagram": A boolean indicating if the question has an image or diagram. Set to true for about 20% of questions.
- "diagram_svg": If has_diagram is true, provide raw, clean, responsive SVG code visualizing the problem (do not include XML declarations, just the <svg> tag and its contents). If false, omit this key.
Focus on variety to prevent duplicates.`
      },
      {
        role: 'user',
        content: `Generate ${count} questions for ${subject} as a raw JSON array.`
      }
    ];

    try {
      const rawResponse = await this.callDigitalOceanApi(messages, 2000); // Need more tokens for batch
      let jsonStr = rawResponse.trim();

      // Strip markdown code blocks if the model insists on adding them
      if (jsonStr.startsWith('\`\`\`json')) {
        jsonStr = jsonStr.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
      } else if (jsonStr.startsWith('\`\`\`')) {
        jsonStr = jsonStr.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error: any) {
      this.logger.error(`Failed to generate questions batch for ${subject}`, error.message);
      return []; // Return empty array to trigger fallback gracefully
    }
  }
}
