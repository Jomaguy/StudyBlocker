import Anthropic from '@anthropic-ai/sdk';
import type { StudyProfile } from '@/types/study';
import type { QuizQuestion, QuizEvaluation } from '@/types/quiz';

let _client: Anthropic | null = null;

export function getClient(apiKey: string): Anthropic {
  if (!_client || (_client as any).apiKey !== apiKey) {
    _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _client;
}

// ─── 1. Analyze uploaded study material ──────────────────────────────────────

const ANALYSIS_SYSTEM = `You are a study material analyzer. Given a document, extract:
1. The main topics as an array of objects: {id, title, description}
2. A concise summary (3-4 sentences) capturing the most important ideas, suitable for later generating quiz questions.

Respond ONLY with valid JSON in this exact shape, no markdown fences:
{"topics":[{"id":"1","title":"...","description":"..."}],"rawMaterialSummary":"..."}`;

export async function analyzeMaterial(
  client: Anthropic,
  base64Data: string,
  mimeType: 'application/pdf' | 'text/plain',
  filename: string
): Promise<{ topics: StudyProfile['topics']; rawMaterialSummary: string }> {
  const content: Anthropic.MessageParam['content'] = mimeType === 'application/pdf'
    ? [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
          title: filename,
        } as Anthropic.DocumentBlockParam,
        { type: 'text', text: 'Analyze this study material and return JSON.' },
      ]
    : [
        {
          type: 'text',
          text: `Study material content:\n\n${Buffer.from(base64Data, 'base64').toString('utf-8')}\n\nAnalyze this and return JSON.`,
        },
      ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: ANALYSIS_SYSTEM,
    messages: [{ role: 'user', content }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(text);
}

// ─── 2. Onboarding interview (multi-turn) ────────────────────────────────────

const ONBOARDING_SYSTEM = `You are a friendly, encouraging study coach. The student has uploaded study material you have already analyzed.

Your goal over 3-4 conversational turns:
1. Ask what they most want to master from the material
2. Ask about their weak areas or tricky concepts
3. Ask about their study goals (exam prep, career, curiosity, etc.)
4. Confirm your understanding warmly

Ask ONE question at a time. Keep responses under 80 words.

When you have gathered enough (after ~3 student replies), output a JSON block inside XML tags and a brief closing message:
<PROFILE_COMPLETE>{"weakAreas":["..."],"studyGoals":["..."]}</PROFILE_COMPLETE>`;

export async function sendOnboardingMessage(
  client: Anthropic,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  summary: string
): Promise<{ text: string; profileData?: { weakAreas: string[]; studyGoals: string[] } }> {
  // First turn: seed with the summary context
  const messages: Anthropic.MessageParam[] =
    history.length === 0
      ? [
          {
            role: 'user',
            content: `I've uploaded my study material. Here's a summary of what it covers:\n\n${summary}\n\nI'm ready to start.`,
          },
        ]
      : history.map((m) => ({ role: m.role, content: m.content }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: ONBOARDING_SYSTEM,
    messages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const profileMatch = text.match(/<PROFILE_COMPLETE>([\s\S]*?)<\/PROFILE_COMPLETE>/);

  if (profileMatch) {
    const profileData = JSON.parse(profileMatch[1]);
    const displayText = text.replace(/<PROFILE_COMPLETE>[\s\S]*?<\/PROFILE_COMPLETE>/, '').trim();
    return { text: displayText || "You're all set! Let's get your blocking set up.", profileData };
  }

  return { text };
}

// ─── 3. Generate quiz question ────────────────────────────────────────────────

const QUESTION_SYSTEM = `You are a study quiz master. Generate ONE open-ended question to test understanding.

Rules:
- Never multiple choice. Ask for explanations, comparisons, examples, or applications.
- Vary topics to avoid repetition.
- Scale difficulty based on the streak count provided.

Output ONLY valid JSON, no fences:
{"questionText":"...","targetConcept":"...","difficulty":"foundational|intermediate|advanced"}`;

export async function generateQuestion(
  client: Anthropic,
  profile: StudyProfile,
  recentQuestions: string[],
  streak: number
): Promise<QuizQuestion> {
  const difficultyHint = streak >= 3 ? 'advanced' : streak >= 1 ? 'intermediate' : 'foundational';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 384,
    system: QUESTION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Study material summary: ${profile.rawMaterialSummary}

Topics: ${profile.topics.map((t) => t.title).join(', ')}
Weak areas to focus on: ${profile.weakAreas.join(', ') || 'none specified'}
Recent questions asked (avoid repeating): ${recentQuestions.slice(-5).join(' | ') || 'none yet'}
Current streak: ${streak} (aim for ${difficultyHint} difficulty)

Generate one question.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(text);
  return {
    ...parsed,
    id: Math.random().toString(36).slice(2),
    generatedAt: Date.now(),
  } as QuizQuestion;
}

// ─── 4. Evaluate user's answer ────────────────────────────────────────────────

const EVALUATION_SYSTEM = `You are a generous but honest study quiz evaluator.

Principles:
- If the student shows genuine understanding of the core concept, mark it correct.
- Award credit for partial answers with confidence "partial" (isCorrect: false but kind feedback).
- Only mark incorrect if the answer is clearly wrong or completely off-topic.
- Keep feedback to 1-2 sentences. Be encouraging, never harsh.

Output ONLY valid JSON, no fences:
{"isCorrect":true,"confidence":"clear|partial|incorrect","feedback":"..."}`;

export async function evaluateAnswer(
  client: Anthropic,
  question: QuizQuestion,
  userAnswer: string,
  profile: StudyProfile
): Promise<QuizEvaluation> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: EVALUATION_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Context: ${profile.rawMaterialSummary}

Question: "${question.questionText}"
Target concept: ${question.targetConcept}
Student's answer: "${userAnswer}"

Evaluate.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const parsed = JSON.parse(text);
  return { ...parsed, questionId: question.id, userAnswer } as QuizEvaluation;
}
