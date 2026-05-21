import type { Message } from '../types/tree';

export async function generateLearningPath(
  apiKey: string, topic: string, model: string, baseUrl: string
): Promise<{ title: string; nodes: { question: string; children?: { question: string; children?: any[] }[] }[] }> {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      model, max_tokens: 1024,
      messages: [{ role: 'user', content: `Create a learning path for: "${topic}". Return ONLY valid JSON: { "title": "Learning: topic", "nodes": [{ "question": "subtopic question", "children": [{ "question": "specific question" }] }] }. Aim for 3-4 subtopics each with 1-2 questions. Keep questions concise.` }],
    }),
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid response format');
  return JSON.parse(match[0]);
}

export async function fetchSuggestions(
  apiKey: string,
  question: string,
  answer: string,
  model: string,
  baseUrl: string
): Promise<string[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      model,
      max_tokens: 256,
      messages: [{ role: 'user', content: `Based on this Q&A, suggest 3 concise follow-up questions the learner might ask next. Return ONLY a JSON array of strings, no other text.\n\nQuestion: ${question}\n\nAnswer: ${answer.slice(0, 1000)}` }],
    }),
  });
  if (!response.ok) return [];
  try {
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return [];
}

export async function* streamClaudeResponse(
  apiKey: string,
  messages: Message[],
  model: string = 'deepseek-v4-pro',
  baseUrl: string = 'https://api.deepseek.com/anthropic'
): AsyncGenerator<string> {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        if (
          parsed.type === 'content_block_delta' &&
          parsed.delta?.type === 'text_delta'
        ) {
          yield parsed.delta.text;
        }
      } catch {
        // skip malformed JSON
      }
    }
  }
}
