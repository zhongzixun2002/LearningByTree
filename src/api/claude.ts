import type { Message } from '../types/tree';

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
