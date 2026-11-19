import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const apiRouter = Router();

// ── Helpers ──────────────────────────────────────────────
function getAI() {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) throw new Error('GEMINI_API_KEY is not set in .env');
  return new GoogleGenAI({ apiKey: key });
}

const MODEL = 'gemini-2.5-flash';

// ── Multer ───────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── System Prompts ───────────────────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are NOVA AI, a premium personal AI assistant.
Reply with clarity, depth and structure. Use markdown formatting, code blocks, lists and tables when helpful.
For medical, legal or financial questions, state clearly that your answer is informational only and recommend consulting a qualified professional.`,

  tutor: `You are NOVA AI in Study Tutor mode.
Teach concepts step-by-step using analogies, examples, diagrams and practice questions.
Test understanding with follow-up questions. Be encouraging and clear.`,

  coding: `You are NOVA AI in Coding Expert mode.
Write clean, well-documented, production-quality code.
Explain architecture decisions, edge cases and security considerations.
Always specify the programming language in code blocks.`,

  career: `You are NOVA AI in Career Coach mode.
Help with resume writing, interview preparation, job applications and professional communication.
Give specific, actionable advice grounded in current industry practices.`,

  creative: `You are NOVA AI in Creative Studio mode.
Generate vivid stories, brainstorm ideas, write marketing copy, design concepts and creative prompts.
Use rich, evocative language and think outside the box.`,

  research: `You are NOVA AI in Research Assistant mode.
Provide thorough, objective analysis. Structure findings with summaries, context, comparisons and citations.
Note limitations when data is incomplete. Never fabricate sources.`,
};

// ── Health ────────────────────────────────────────────────
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: MODEL, timestamp: new Date().toISOString() });
});

// ── Chat (SSE streaming) ─────────────────────────────────
apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { message, history = [], mode = 'general', attachments = [] } = req.body;

  if (!message && attachments.length === 0) {
    return res.status(400).json({ error: 'Message or attachment required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const ai = getAI();
    const systemInstruction = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;

    // Build message parts
    let textContent = message || '';
    const inlineParts: any[] = [];

    for (const file of attachments) {
      if (!file.data) continue;
      if (file.type === 'application/pdf') {
        try {
          const buf = Buffer.from(file.data, 'base64');
          const parsed = await pdfParse(buf);
          textContent += `\n\n[Content of "${file.name}"]:\n${parsed.text.slice(0, 12000)}`;
        } catch {
          textContent += `\n\n[Could not read PDF "${file.name}"]`;
        }
      } else if (file.type.startsWith('image/')) {
        inlineParts.push({ inlineData: { mimeType: file.type, data: file.data } });
      } else {
        try {
          const decoded = Buffer.from(file.data, 'base64').toString('utf-8');
          textContent += `\n\n[Content of "${file.name}"]:\n${decoded.slice(0, 12000)}`;
        } catch {}
      }
    }

    const messageParts: any[] = [];
    if (textContent) messageParts.push({ text: textContent });
    messageParts.push(...inlineParts);

    // Format history
    const chatHistory = history.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = ai.chats.create({
      model: MODEL,
      config: { systemInstruction },
      history: chatHistory,
    });

    const stream = await chat.sendMessageStream({ message: messageParts });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[Chat Error]', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Failed to get AI response' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// ── Search Grounded Chat ─────────────────────────────────
apiRouter.post('/chat/search', async (req: Request, res: Response) => {
  const { message } = req.body;
  try {
    const ai = getAI();
    const response = await ai.interactions.create({
      model: MODEL,
      input: message,
      tools: [{ type: 'google_search' }],
    });

    const text = response.output_text || '';
    const sources: any[] = [];

    // Extract citations from steps
    if ((response as any).steps) {
      for (const step of (response as any).steps) {
        const content = step.model_output_step?.content || step.content || [];
        for (const block of (Array.isArray(content) ? content : [])) {
          if (block.annotations) {
            for (const ann of block.annotations) {
              if (ann.url_citation) {
                sources.push({
                  title: ann.url_citation.title || 'Source',
                  url: ann.url_citation.url,
                });
              }
            }
          }
        }
      }
    }

    res.json({ text, sources });
  } catch (err: any) {
    console.error('[Search Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Image Generation ─────────────────────────────────────
apiRouter.post('/image/generate', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  try {
    const ai = getAI();
    const interaction = await ai.interactions.create({
      model: 'gemini-2.5-flash-preview-image-generation',
      input: prompt,
    });

    if (interaction.output_image?.data) {
      return res.json({
        image: interaction.output_image.data,
        mimeType: interaction.output_image.mime_type || 'image/png',
      });
    }
    res.status(400).json({ error: 'No image generated. Try a more descriptive prompt.' });
  } catch (err: any) {
    console.error('[ImageGen Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Smart Tools ──────────────────────────────────────────
const TOOL_PROMPTS: Record<string, (input: string) => string> = {
  'explain':          i => `Explain this clearly and simply so anyone can understand:\n\n${i}`,
  'summarize':        i => `Provide a concise summary with key takeaways:\n\n${i}`,
  'translate':        i => `Translate the following text. Detect the source language and translate to the target language specified. If no target is specified, translate to English:\n\n${i}`,
  'quiz':             i => `Generate a 5-question multiple-choice quiz with answers and explanations about:\n\n${i}`,
  'flashcards':       i => `Create 10 study flashcards (Q&A format) about:\n\n${i}`,
  'improve-prompt':   i => `Improve and optimize this AI prompt for better results. Show the improved version and explain changes:\n\n${i}`,
  'compare':          i => `Compare these items with a structured analysis of pros, cons and differences:\n\n${i}`,
  'study-notes':      i => `Create comprehensive, well-formatted study notes with headings, key points and summaries about:\n\n${i}`,
  'generate-code':    i => `Write clean, well-documented code with explanation for:\n\n${i}`,
  'interview-prep':   i => `Generate 8 interview questions (mix of behavioral and technical) with model answers for:\n\n${i}`,
};

apiRouter.post('/tools', async (req: Request, res: Response) => {
  const { toolId, input } = req.body;
  if (!input) return res.status(400).json({ error: 'Input is required.' });

  const buildPrompt = TOOL_PROMPTS[toolId];
  if (!buildPrompt) return res.status(400).json({ error: `Unknown tool: ${toolId}` });

  try {
    const ai = getAI();
    const response = await ai.interactions.create({ model: MODEL, input: buildPrompt(input) });
    res.json({ text: response.output_text || '' });
  } catch (err: any) {
    console.error('[Tool Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});
