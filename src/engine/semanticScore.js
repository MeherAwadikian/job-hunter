// Second-pass semantic scorer. Layered on top of score.js's free rule-based
// pass per brief §27 (don't spend an LLM call validating obvious non-matches).
// Only called for jobs that already cleared SEMANTIC_FLOOR on the rule-based score.
//
// Uses DeepSeek's OpenAI-compatible API — the only confirmed-live paid-capable
// key in the Hermes key pool as of 2026-10-05 (Anthropic key in the stack is
// dead/placeholder, OpenAI pool exhausted, OpenRouter is free-tier only).
// Swap BASE_URL/MODEL below if a live Anthropic/OpenAI key becomes available later.

const BASE_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
export const SEMANTIC_FLOOR = 35; // rule-based overall_score threshold to bother calling the LLM

const SYSTEM_PROMPT = `You are a job-matching analyst. Given a candidate profile and a job posting, score the fit.
Return ONLY a JSON object, no markdown fences, no prose, with this exact shape:
{"overall_score": 0-100, "skill_match": 0-100, "experience_match": 0-100, "industry_match": 0-100, "remote_match": 0-100, "grade": "A+|A|B|C|D", "why": "one sentence"}`;

export async function semanticScoreJob(job, profile) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not set. Copy it into job apps/.env (see .env.example).');
  }

  const userPrompt = `CANDIDATE PROFILE:
Name: ${profile.name}
Location: ${profile.location}
Preferred roles: ${profile.preferred_roles.join(', ')}
Skill angles: ${profile.skill_angles.map((a) => `${a.category} (${a.skills.join(', ')})`).join(' | ')}
Opportunity types accepted: ${profile.opportunity_types_accepted.join(', ')}

JOB POSTING:
Title: ${job.title}
Company: ${job.company || 'n/a'}
Location: ${job.location || 'n/a'}
Remote: ${job.remote}
Employment type: ${job.employment_type || 'n/a'}
Skills/tags: ${(job.skills || []).join(', ')}
Description: ${(job.description || '').slice(0, 1500)}`;

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error ${res.status}: ${await res.text().then((t) => t.slice(0, 300))}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || '';
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Could not parse semantic score response: ${cleaned.slice(0, 200)}`);
  }
  return parsed;
}
