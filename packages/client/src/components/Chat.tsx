import { useState } from 'react';
import {
  ChatContainer,
  type TChatMessage,
  type TUserMessage,
  type TAssistantMessage,
  type TSubmitData,
  type ChatStatus,
  type ToolMessageContent,
  type TToolStatus,
} from '@gravity-ui/aikit';
import '@gravity-ui/aikit/styles';
import { Icon } from '@gravity-ui/uikit';
import { ChartColumn } from '@gravity-ui/icons';
import type { ChatMessage as ApiChatMessage } from '@subbotnik/shared';
import { sendMessage } from '../api/chat';
import './Chat.css';

function Chat() {
  const [messages, setMessages] = useState<TChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('ready');

  const handleSendMessage = async (data: TSubmitData) => {
    if (!data.content.trim()) return;

    // Создаем user message в формате aikit
    const userMessage: TUserMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: data.content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus('streaming');

    try {
      // Преобразуем aikit messages в API формат
      const apiMessages: ApiChatMessage[] = messages
        .concat(userMessage)
        .map((m) => {
          if (m.role === 'user') {
            return {
              role: 'user',
              content: m.content,
            };
          } else {
            // Для assistant messages нужно преобразовать content
            const content = typeof m.content === 'string'
              ? m.content
              : Array.isArray(m.content)
                ? m.content.find(c => typeof c !== 'string' && c.type === 'text')?.data?.text || ''
                : typeof m.content === 'object' && m.content.type === 'text'
                  ? m.content.data.text
                  : '';
            return {
              role: 'assistant',
              content,
            };
          }
        });

      let assistantMessageId = (Date.now() + 1).toString();
      let assistantContent = '';
      let assistantMessage: TAssistantMessage | null = null;

      await sendMessage(apiMessages, (event) => {
        switch (event.type) {
          case 'function-call':
            // Создаем assistant message с tool content
            const toolContent: ToolMessageContent = {
              type: 'tool',
              data: {
                toolName: event.data.name,
                bodyContent: (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      📊 Параметры:
                    </div>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(event.data.arguments, null, 2)}
                    </pre>
                  </div>
                ),
                status: 'loading' as TToolStatus,
                expandable: true,
                initialExpanded: true,
              },
            };

            assistantMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: [toolContent],
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage!]);
            break;

          case 'function-result':
            // Обновляем tool message со статусом success и результатом
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === assistantMessage?.id && m.role === 'assistant') {
                  const content = Array.isArray(m.content)
                    ? m.content
                    : typeof m.content === 'string'
                      ? []
                      : [m.content];

                  const updatedContent = content.map((c) => {
                    if (typeof c !== 'string' && c.type === 'tool') {
                      return {
                        ...c,
                        data: {
                          ...c.data,
                          status: 'success' as TToolStatus,
                          autoCollapseOnSuccess: true,
                          footerContent: (
                            <div>
                              <div style={{ marginBottom: '8px', color: '#4CAF50' }}>
                                ✅ Данные получены
                              </div>
                              <pre style={{
                                background: '#f5f5f5',
                                padding: '8px',
                                borderRadius: '4px',
                                overflow: 'auto',
                                maxHeight: '200px'
                              }}>
                                {JSON.stringify(event.data.result, null, 2)}
                              </pre>
                            </div>
                          ),
                        },
                      };
                    }
                    return c;
                  });
                  return { ...m, content: updatedContent };
                }
                return m;
              })
            );
            break;

          case 'message-delta':
            assistantContent += event.data;
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantMessageId);

              if (existing) {
                return prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantContent }
                    : m
                );
              } else {
                const newMessage: TAssistantMessage = {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: assistantContent,
                  timestamp: new Date().toISOString(),
                };
                return [...prev, newMessage];
              }
            });
            break;

          case 'done':
            setStatus('ready');
            break;

          case 'error':
            console.error('Stream error:', event.data);
            setStatus('error');
            break;
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="chatWrapper">
      <div className="chat">
        <ChatContainer
          messages={messages}
          status={status}
          onSendMessage={handleSendMessage}
          showHistory={false}
          showNewChat={false}
          showClose={false}
          i18nConfig={{
            promptInput: {
              placeholder: 'Задайте вопрос о данных...',
            },
          }}
          promptInputProps={{
            view: 'simple',
          }}
          welcomeConfig={{
            title: 'Добро пожаловать в AI BI Analyst',
            description: 'Начните диалог, задав вопрос или выбрав один из предложенных вариантов.',
            image: <Icon data={ChartColumn} size={48} />,
            suggestionTitle: 'Попробуйте эти вопросы:',
            suggestions: [
              {
                title: 'Покажи общую выручку по всем продуктам',
              },
              {
                title: 'Какой продукт принес наибольшую прибыль?',
              },
              {
                title: 'Сравни продажи разных категорий продуктов',
              },
              {
                title: 'Покажи динамику продаж за последние месяцы',
              },
            ],
            layout: 'grid',
            wrapText: true,
          }}
        />
      </div>
    </div>
  );
}

export default Chat;
