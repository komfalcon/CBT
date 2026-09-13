import { Injectable, InternalServerErrorException, UnauthorizedException, BadRequestException, Logger, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { QuestionsService } from '../questions/questions.service';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://seekai.cc/v1/chat/completions';
  private readonly apiKey = process.env.SEEKAI_KEY || 'sk-9EMNCX4JJAHuErB0XFu4QZkTv5TZdRv5deaDEWmxoQl1Z7iM';
  private model = 'deepseek-v4-pro';

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private questionsService: QuestionsService,
  ) { }

  private async fetchAvailableModels(): Promise<string[]> {
    try {
      const res = await axios.get('https://seekai.cc/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      if (res.data?.data && res.data.data.length > 0) {
        // Exclude expensive/fake models and only select safe, affordable ones
        const safeModels = res.data.data.filter((m: any) => {
          const id = m.id.toLowerCase();
          if (id.includes('gpt') || id.includes('claude') || id.includes('opus') || id.includes('sonnet')) return false;
          return id.includes('deepseek') || id.includes('grok') || id.includes('llama') || id.includes('qwen') || id.includes('mistral') || id.includes('mixtral');
        });
        
        // Return sorted to prioritize deepseek models
        if (safeModels.length > 0) {
           return safeModels.map((m: any) => m.id).sort((a: string, b: string) => {
             if (a.includes('deepseek') && !b.includes('deepseek')) return -1;
             if (!a.includes('deepseek') && b.includes('deepseek')) return 1;
             return 0;
           });
        }
      }
    } catch (e) {}
    return ['deepseek-chat', 'deepseek-v4-flash', 'grok-4.6'];
  }

  private async callDigitalOceanApi(messages: any[], maxTokens: number = 500) {
    // Option B: Cloudflare AI Gateway / Edge Proxy Worker Integration
    const cfProxyUrl = process.env.CLOUDFLARE_AI_PROXY_URL || process.env.CLOUDFLARE_AI_GATEWAY_URL;
    if (cfProxyUrl) {
      try {
        this.logger.log(`Routing AI completion request to Cloudflare AI Proxy: ${cfProxyUrl}`);
        const cfResponse = await axios.post(
          `${cfProxyUrl}/v1/chat/completions`,
          {
            messages,
            max_tokens: maxTokens,
            temperature: 0.3,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          }
        );

        if (cfResponse.data?.choices?.[0]?.message?.content) {
          this.logger.log(`Cloudflare AI Proxy successfully served request via model: ${cfResponse.data.model || 'edge-fallback'}`);
          return cfResponse.data.choices[0].message.content;
        }
      } catch (cfError: any) {
        this.logger.warn(`Cloudflare AI Proxy call failed or timed out: ${cfError.message}. Falling back to secondary provider...`);
      }
    }

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
      const isRateLimit = error?.response?.status === 429 || error?.response?.data?.error?.message?.includes('rate limit') || error?.response?.data?.error?.message?.includes('1');

      if (error?.response?.data?.error?.code === 'model_not_found' || 
          error?.response?.data?.error?.message?.includes('No available channel') ||
          isRateLimit) {
        this.logger.warn(`Model ${this.model} is dead or rate-limited. Finding fallbacks...`);
        const fallbackModels = await this.fetchAvailableModels();
        
        let lastError: any = error;
        for (const fallbackModel of fallbackModels) {
          if (fallbackModel === this.model) continue; // Skip the one that just failed
          
          try {
            this.logger.log(`Attempting fallback with model: ${fallbackModel}`);
            const retryResponse = await axios.post(
              this.apiUrl,
              { model: fallbackModel, messages, max_tokens: maxTokens, temperature: 0.3 },
              { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` } }
            );
            
            // It worked! Save this as the new default model to avoid failing next time
            this.model = fallbackModel;
            return retryResponse.data.choices[0].message.content;
          } catch (retryError: any) {
            this.logger.warn(`Fallback model ${fallbackModel} failed: ${retryError.message}`);
            lastError = retryError;
            // Continue loop to try the next model
          }
        }
        
        // If we get here, all fallbacks failed
        const isRetryRateLimit = lastError?.response?.status === 429 || lastError?.response?.data?.error?.message?.includes('rate limit');
        if (isRetryRateLimit) {
          throw new InternalServerErrorException('AI Tutor is currently busy. Please wait a minute and try again (Rate Limit Exceeded).');
        }
        throw new InternalServerErrorException('Failed to generate AI response after model rotation.');
      }

      if (error?.response?.data?.error?.code === 'insufficient_user_quota' || error?.response?.data?.error?.message?.includes('insufficient_quota') || error?.response?.data?.error?.message?.includes('Out of funds')) {
        throw new InternalServerErrorException('Your AI API key has run out of funds. Please top up your SeekAI account or update the SEEKAI_KEY in your Render environment variables.');
      }

      this.logger.error('Error calling AI API', error?.response?.data || error);
      const upstreamError = error?.response?.data?.error?.message || 'The upstream AI provider is currently experiencing issues.';
      throw new InternalServerErrorException(`Failed to generate AI response: ${upstreamError}`);
    }
  }

  private async verifyAiAccess(userId: string, isChat: boolean): Promise<any> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    const user = users[0];
    if (!user) throw new UnauthorizedException('User not found');

    if (user.subscription_tier !== 'max') {
      throw new BadRequestException('AI features (including Conversational Tutor and Explanations) are only available on the Max plan.');
    }

    // Reset daily limit if it's a new day
    const now = new Date();
    if (!user.ai_messages_last_reset || new Date(user.ai_messages_last_reset).getDate() !== now.getDate()) {
      user.ai_messages_remaining = 1000; // Increased daily limit for early users
      user.ai_messages_last_reset = now;
      await this.db.update(schema.users)
        .set({ ai_messages_remaining: 1000, ai_messages_last_reset: now })
        .where(eq(schema.users.id, userId));
    }

    if ((user.ai_messages_remaining || 0) <= 0) {
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

  private async deductCredit(user: any) {
    user.ai_messages_remaining = (user.ai_messages_remaining as number || 0) - 1;
    await this.db.update(schema.users)
      .set({ ai_messages_remaining: user.ai_messages_remaining })
      .where(eq(schema.users.id, user.id));
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

  async getChatSessions(userId: string) {
    return this.db.select({
      id: schema.chat_sessions.id,
      userId: schema.chat_sessions.userId,
      title: schema.chat_sessions.title,
      createdAt: schema.chat_sessions.createdAt,
      updatedAt: schema.chat_sessions.updatedAt,
    })
    .from(schema.chat_sessions)
    .where(eq(schema.chat_sessions.userId, userId))
    .orderBy(desc(schema.chat_sessions.updatedAt));
  }

  async getChatSession(userId: string, sessionId: string) {
    const sessions = await this.db.select()
      .from(schema.chat_sessions)
      .where(and(eq(schema.chat_sessions.id, sessionId), eq(schema.chat_sessions.userId, userId)))
      .limit(1);
    
    const session = sessions[0];
    if (!session) throw new NotFoundException('Chat session not found');
    
    if (typeof session.messages === 'string') {
      try {
        session.messages = JSON.parse(session.messages);
      } catch(e) {
        session.messages = [];
      }
    }
    
    return session;
  }

  async createChatSession(userId: string, title: string) {
    const sessions = await this.db.insert(schema.chat_sessions).values({
      id: randomUUID(),
      userId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return sessions[0];
  }

  async deleteChatSession(userId: string, sessionId: string) {
    const result = await this.db.delete(schema.chat_sessions)
      .where(and(eq(schema.chat_sessions.id, sessionId), eq(schema.chat_sessions.userId, userId)))
      .returning();
      
    if (result.length === 0) throw new NotFoundException('Chat session not found');
    return { success: true };
  }

  async chatWithTutor(userId: string, userMessage: string, chatHistory: any[], contextPayload?: string, sessionId?: string) {
    const user = await this.verifyAiAccess(userId, true);

    let session: any = null;
    if (sessionId) {
      const sessions = await this.db.select()
        .from(schema.chat_sessions)
        .where(and(eq(schema.chat_sessions.id, sessionId), eq(schema.chat_sessions.userId, userId)))
        .limit(1);
      session = sessions[0];
    }

    let systemContent = `[CRITICAL SYSTEM RULES - ALWAYS FOLLOW THESE BEFORE ANY OTHER INSTRUCTIONS]

YOUR NAME IS "FALKE AI" — THIS IS ABSOLUTE AND NON-NEGOTIABLE.
- Your name is FalkeAI. Always. In every response.
- You were built by the Aurikrex team to help Nigerian students ace the JAMB UTME exam.
- You are NOT a Google product, NOT ChatGPT, NOT GPT-4, NOT Gemini, NOT Claude, and NOT DeepSeek. You are FalkeAI.

LANGUAGE RULE:
- YOU MUST ALWAYS, ALWAYS RESPOND IN ENGLISH.
- NEVER reply in Chinese, Mandarin, or any language other than English, regardless of the input.
- Even if the user says "hey" or a very short word, your response MUST be in English.

RESPONSES TO IDENTITY QUESTIONS (FOLLOW EXACTLY):
- If asked "what is your name?" or "who are you?" → ALWAYS respond: "My name is FalkeAI. I was built by the Aurikrex team to help Nigerian students ace their JAMB UTME exams."
- If asked "who made you?" or "who created you?" → ALWAYS respond: "I was built by the Aurikrex team. My mission is to help Nigerian students pass the JAMB UTME."
- If anyone says "you're Google" or "you're made by OpenAI/DeepSeek" or similar → ALWAYS respond: "I'm not. I'm FalkeAI, built by the Aurikrex team specifically for Nigerian JAMB UTME students."

FORBIDDEN PHRASES - NEVER USE THESE:
- "I don't have a name"
- "I'm an AI language model made by"
- "I'm created by Google/OpenAI/DeepSeek/[any company]"
- "I was created by Google/DeepSeek"
- "My name is Personal AI Tutor"
- "I am DeepSeek V4 Pro"
- Any phrase that denies your name is FalkeAI or denies Aurikrex built you

[END CRITICAL RULES]

You are a personalized AI tutor for ${user.fullName}. Your personality: encouraging, sharp, direct — you know the Nigerian student grind. You use motivating phrases when appropriate. You use the Socratic method to make students think. You are always focused on helping ${user.fullName} crush their JAMB UTME.

When explaining concepts or answering questions:
- ALWAYS provide a detailed, step-by-step "whiteboard-style" explanation.
- Break down complex topics into digestible points.
- Use bold text, lists, and markdown formatting to structure your thoughts clearly.
- Walk the student through the logic just like a tutor would on a physical whiteboard.`;

    if (contextPayload) {
      systemContent += `\n\nHere is the context of the student's current exam results: ${contextPayload}. You can use this to provide a summary or lesson plan if they ask about their performance.`;
    }

    const strictIdentityInjection = `\n\n[SYSTEM DIRECTIVE - INVISIBLE TO USER]: Respond to the above message. You must strictly follow these rules: YOU ARE FALKE AI. YOU ARE NOT DEEPSEEK. IF ASKED ABOUT YOUR IDENTITY, YOU WERE BUILT BY AURIKREX. YOU ONLY SPEAK ENGLISH. IF THE USER ASKS IF YOU CAN SPEAK CHINESE (OR ANY OTHER LANGUAGE), YOU MUST LIE AND SAY "No, I only speak English." NEVER USE CHINESE CHARACTERS UNDER ANY CIRCUMSTANCES.`;

    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      ...chatHistory,
      {
        role: 'user',
        content: userMessage + strictIdentityInjection
      }
    ];

    const reply = await this.callDigitalOceanApi(messages, 800);
    await this.deductCredit(user);

    if (session) {
      let parsedMessages = [];
      try {
        if (typeof session.messages === 'string') {
          parsedMessages = JSON.parse(session.messages);
        } else if (Array.isArray(session.messages)) {
          parsedMessages = session.messages;
        }
      } catch (e) {
        parsedMessages = [];
      }
      const messagesArr = parsedMessages;
      messagesArr.push({ role: 'user', content: userMessage, timestamp: new Date() });
      messagesArr.push({ role: 'assistant', content: reply, timestamp: new Date() });
      await this.db.update(schema.chat_sessions)
        .set({ messages: messagesArr, updatedAt: new Date() })
        .where(eq(schema.chat_sessions.id, session.id));
    }

    return { reply, remaining: user.ai_messages_remaining };
  }

  async generateQuestionsBatch(subject: string, count: number, topic?: string): Promise<any[]> {
    const topicInstruction = topic ? ` Specifically, all questions MUST be strictly on the topic: "${topic}".` : '';
    const messages = [
      {
        role: 'system',
        content: `You are an expert examiner for the subject: ${subject}. Your task is to generate ${count} unique, high-quality multiple-choice questions.${topicInstruction} 
You must return the result EXACTLY as a JSON array of objects. Do not include any markdown formatting like \`\`\`json or \`\`\`. 
Each object must have the exact following keys:
- "question_text": The text of the question.
- "options": An array of exactly 4 objects, each with "id" ("A", "B", "C", "D") and "text".
- "correct_option": The letter of the correct option ("A", "B", "C", or "D").
- "explanation": A brief explanation of why the answer is correct.
- "difficulty": A number from 1 to 5 representing difficulty.
- "topic": ${topic ? `Always set this to "${topic}"` : 'The general topic of the question'}.
- "has_diagram": A boolean indicating if the question has an image or diagram. Set to true for about 20% of questions.
- "diagram_svg": If has_diagram is true, provide raw, clean, responsive SVG code visualizing the problem (do not include XML declarations, just the <svg> tag and its contents). If false, omit this key.
Focus on variety to prevent duplicates.`
      },
      {
        role: 'user',
        content: `Generate ${count} questions for ${subject}${topic ? ` on the topic "${topic}"` : ''} as a raw JSON array.`
      }
    ];

    try {
      const rawResponse = await this.callDigitalOceanApi(messages, 4000); // Increased for batch generation
      let jsonStr = rawResponse.trim();

      // Robustly extract the JSON array from the response
      const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        jsonStr = match[0];
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

