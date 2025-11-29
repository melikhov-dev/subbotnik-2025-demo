import type { Request, Response } from 'express';
import type {
  StreamEvent,
  AssistantMessageWithTools,
  ToolMessage,
  ChatMessage,
} from '@subbotnik/shared';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { streamChat } from './llmClient.js';
import { tools, executeTool } from '../tools/registry.js';

export async function handleChat(req: Request, res: Response) {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  // Настраиваем streaming response
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  const sendEvent = (event: StreamEvent) => {
    res.write(JSON.stringify(event) + '\n');
  };

  try {
    const conversationMessages: (
      | ChatMessage
      | AssistantMessageWithTools
      | ToolMessage
    )[] = [...messages];
    let shouldContinue = true;

    while (shouldContinue) {
      shouldContinue = false;

      // Аккумулятор для tool_calls (приходят чанками)
      const toolCallsAccumulator = new Map<
        number,
        { id?: string; name: string; arguments: string }
      >();

      const stream = await streamChat(
        conversationMessages as ChatCompletionMessageParam[],
        tools
      );
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        if (!delta) continue;

        // Накапливаем tool_calls чанки
        if (delta.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const index = toolCallDelta.index;
            const existing = toolCallsAccumulator.get(index) || {
              name: '',
              arguments: '',
            };

            // Накапливаем id, name и arguments
            if (toolCallDelta.id) {
              existing.id = toolCallDelta.id;
            }
            if (toolCallDelta.function?.name) {
              existing.name += toolCallDelta.function.name;
            }
            if (toolCallDelta.function?.arguments) {
              existing.arguments += toolCallDelta.function.arguments;
            }

            toolCallsAccumulator.set(index, existing);
          }
        }

        // Обработка текстового контента
        if (delta.content) {
          sendEvent({
            type: 'message-delta',
            data: delta.content,
          });
        }

        // Когда stream завершён с tool_calls, обрабатываем их
        if (finishReason === 'tool_calls' && toolCallsAccumulator.size > 0) {
          for (const [index, toolCall] of toolCallsAccumulator.entries()) {
            try {
              const functionName = toolCall.name;
              const functionArgs = JSON.parse(toolCall.arguments);
              const toolCallId = toolCall.id || 'call_' + Date.now();

              // Отправляем событие о вызове функции
              sendEvent({
                type: 'function-call',
                data: {
                  id: toolCallId,
                  name: functionName,
                  arguments: functionArgs,
                },
              });

              // Выполняем функцию
              const result = executeTool(functionName, functionArgs);

              // Отправляем результат функции
              sendEvent({
                type: 'function-result',
                data: {
                  tool_call_id: toolCallId,
                  result: result,
                },
              });

              // Добавляем вызов функции и результат в историю
              const assistantMessage: AssistantMessageWithTools = {
                role: 'assistant',
                content: '',
                tool_calls: [
                  {
                    id: toolCallId,
                    type: 'function',
                    function: {
                      name: functionName,
                      arguments: JSON.stringify(functionArgs),
                    },
                  },
                ],
              };
              conversationMessages.push(assistantMessage);

              const toolMessage: ToolMessage = {
                role: 'tool',
                tool_call_id: toolCallId,
                content: JSON.stringify(result),
              };
              conversationMessages.push(toolMessage);

              shouldContinue = true;
            } catch (error) {
              console.error('Error executing tool:', error);
              sendEvent({
                type: 'error',
                data:
                  error instanceof Error ? error.message : 'Tool execution failed',
              });
            }
          }
        }
      }
    }

    // Завершаем stream
    sendEvent({ type: 'done' });
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    sendEvent({
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error',
    });
    res.end();
  }
}
