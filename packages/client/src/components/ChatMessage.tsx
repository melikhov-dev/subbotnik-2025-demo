import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {
  ChatMessage as ApiChatMessage,
  AssistantMessageWithTools,
  ToolMessage,
} from '@subbotnik/shared';
import './ChatMessage.css';

type ClientChatMessage = (ApiChatMessage | AssistantMessageWithTools | ToolMessage) & {
  id: string;
  streaming?: boolean;
};

interface ChatMessageProps {
  message: ClientChatMessage;
}

function ChatMessage({ message }: ChatMessageProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Проверяем наличие tool_calls для определения типа сообщения
  const isAssistantWithTools = 'tool_calls' in message && message.tool_calls;
  const isToolMessage = message.role === 'tool';

  if (isAssistantWithTools) {
    const toolCall = message.tool_calls[0];
    const functionArgs = JSON.parse(toolCall.function.arguments);

    return (
      <div className="chat-message function-call">
        <div className="function-call-header">
          🔧 Вызываю функцию: <strong>{toolCall.function.name}</strong>
        </div>
        <div className="function-call-args">
          📊 Параметры: <code>{JSON.stringify(functionArgs, null, 2)}</code>
        </div>
      </div>
    );
  }

  if (isToolMessage) {
    const toolMsg = message as ToolMessage & { id: string };
    // content уже JSON string с результатом тула
    let resultData;
    try {
      resultData = JSON.parse(toolMsg.content);
    } catch (e) {
      resultData = toolMsg.content;
    }

    return (
      <div className="chat-message function-result">
        <div
          className="function-result-header clickable"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '▶' : '▼'} ✅ Получены данные
        </div>
        {!isCollapsed && (
          <pre className="function-result-data">
            {JSON.stringify(resultData, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="message-role">
        {message.role === 'user' ? '👤 Вы' : '🤖 AI'}
      </div>
      <div className="message-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        {'streaming' in message && message.streaming && <span className="cursor">▊</span>}
      </div>
    </div>
  );
}

export default ChatMessage;
