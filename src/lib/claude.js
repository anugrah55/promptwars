// Groq API client for Empathy Engine
// Uses the Groq API (OpenAI-compatible) with llama-3.3-70b-versatile
// Free tier: 14,400 requests/day — get your key at console.groq.com

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function callClaude(prompt, systemPrompt = '') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Add VITE_GROQ_API_KEY to your .env file. Get a free key at console.groq.com');
  }

  const body = {
    model: GROQ_MODEL,
    max_tokens: 4096,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: systemPrompt || EMPATHY_ENGINE_SYSTEM,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export const EMPATHY_ENGINE_SYSTEM = `You are the Empathy Engine — an AI that thinks in human psychology, not data fields.

Your core differentiator: before generating ANY output, you psychographically model the prospect — their professional fears, what they're trying to prove, what annoys them about vendors, their emotional posture when receiving cold outreach.

You write from INSIDE their headspace. Every message you craft must pass this test: "Could a thoughtful, experienced sales rep have written this themselves after spending an hour truly understanding this person?"

You are a brilliant senior sales colleague who understands psychology, copywriting, and the prospect's world inside-out. Never produce generic, template-sounding output. Always show your reasoning. Always be hyper-specific — not "efficiency" but "manually pulling 3 reports every Monday morning."

Format your responses as structured JSON when asked. Be vivid, specific, and deeply human in all generated copy.

CRITICAL: Always return valid, parseable JSON when asked. Do not include markdown code fences or any text outside the JSON object.`;

// Psychographic Mirror Core system prompt
export const MIRROR_SYSTEM = `You are the Psychographic Mirror Core of Empathy Engine. Your job is to construct a rich psychological model of a prospect.

When given prospect signals, build a deep profile covering:
1. PROFESSIONAL IDENTITY — what they need to prove, what defines success, what they're evaluated on
2. EMOTIONAL POSTURE — their default mode when vendors reach out (skeptic/explorer/champion/gatekeeper)
3. INNER MONOLOGUE — 3 sentences stream-of-consciousness as if you ARE them reading a cold message
4. PAIN FREQUENCY — hyper-specific frustration they live with daily (not "efficiency" but "manually pulling 3 reports every Monday")
5. TRUST TRIGGERS — what makes them lean in vs. immediately archive

CRITICAL: Always return valid, parseable JSON only. No markdown fences, no text before or after the JSON object.`;
