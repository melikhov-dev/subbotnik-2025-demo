import { useState, useEffect, useRef } from 'react';
import { Card, TextInput, Button } from '@gravity-ui/uikit';
import type {
  ChatMessage as ApiChatMessage,
  AssistantMessageWithTools,
  ToolMessage,
} from '@subbotnik/shared';
import { sendMessage } from '../api/chat';
import ChatMessage from './ChatMessage';
import './Chat.css';

// Клиентский тип сообщения с дополнительными полями для UI
type ClientChatMessage = (ApiChatMessage | AssistantMessageWithTools | ToolMessage) & {
  id: string;
  streaming?: boolean;
};

function Chat() {
  const [messages, setMessages] = useState<ClientChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка вниз при добавлении сообщений
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ClientChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Преобразуем клиентские сообщения в API формат (убираем id и streaming)
      const apiMessages: ApiChatMessage[] = messages
        .concat(userMessage)
        .map((m) => {
          const { id, streaming, ...rest } = m;
          return rest as ApiChatMessage;
        });

      let assistantMessageId = (Date.now() + 1).toString();
      let assistantContent = '';

      await sendMessage(apiMessages, (event) => {
        switch (event.type) {
          case 'function-call':
            const assistantWithTools: ClientChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: '',
              tool_calls: [
                {
                  id: event.data.id,
                  type: 'function',
                  function: {
                    name: event.data.name,
                    arguments: JSON.stringify(event.data.arguments),
                  },
                },
              ],
            };
            setMessages((prev) => [...prev, assistantWithTools]);
            break;

          case 'function-result':
            const toolMessage: ClientChatMessage = {
              id: Date.now().toString(),
              role: 'tool',
              tool_call_id: event.data.tool_call_id,
              content: JSON.stringify(event.data.result),
            };
            setMessages((prev) => [...prev, toolMessage]);
            break;

          case 'message-delta':
            assistantContent += event.data;
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantMessageId);
              if (existing) {
                return prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantContent, streaming: true }
                    : m
                );
              } else {
                return [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: 'assistant' as const,
                    content: assistantContent,
                    streaming: true,
                  },
                ];
              }
            });
            break;

          case 'done':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId ? { ...m, streaming: false } : m
              )
            );
            break;

          case 'error':
            console.error('Stream error:', event.data);
            break;
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="chat">
      <h2>AI Ассистент</h2>
      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="loading">AI думает...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-input">
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Задайте вопрос о данных..."
          size="l"
          disabled={isLoading}
        />
        <Button type="submit" size="l" view="action" disabled={isLoading}>
          Отправить
        </Button>
      </form>
    </Card>
  );
}

export default Chat;
