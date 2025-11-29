// Типы сообщений чата
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  role: MessageRole;
  content: string;
}

// Расширенные типы для assistant с tool_calls
export interface AssistantMessageWithTools extends Message {
  role: 'assistant';
  tool_calls: ToolCall[];
}

// Тип для tool message (результат выполнения функции)
export interface ToolMessage extends Message {
  role: 'tool';
  tool_call_id: string;
}

// Типы для function calling
export interface FunctionCall {
  name: string;
  arguments: string; // JSON string
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

// Типы для streaming events
export type StreamEventType =
  | 'function-call'
  | 'function-result'
  | 'message-delta'
  | 'done'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  data?: any;
}

// Типы данных дашборда
export interface DailyData {
  date: string;
  sales: number;
  orders: number;
}

export interface ChartData {
  chartId: string;
  period: string;
  data: DailyData[];
  total: number;
  avgDaily: number;
}

// Union тип для всех возможных сообщений в истории чата
export type ChatMessage = Message | AssistantMessageWithTools | ToolMessage;

// API типы
export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  // Streaming response через ReadableStream
}
