import type { ChatMessage, StreamEvent } from '@subbotnik/shared';

export async function sendMessage(
  messages: ChatMessage[],
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Разбиваем на строки (каждая строка = JSON событие)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Сохраняем неполную строку

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event: StreamEvent = JSON.parse(line);
            onEvent(event);
          } catch (e) {
            console.error('Failed to parse event:', line, e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
