import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function streamChat(
  messages: ChatCompletionMessageParam[],
  tools: ChatCompletionTool[]
) {
  return await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4',
    messages,
    tools,
    stream: true,
  });
}
