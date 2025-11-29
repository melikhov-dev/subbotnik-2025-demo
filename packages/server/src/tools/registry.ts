import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { getChartDataTool, executeGetChartData } from './getChartData.js';

export const tools: ChatCompletionTool[] = [getChartDataTool];

export function executeTool(name: string, args: unknown) {
  switch (name) {
    case 'getChartData':
      return executeGetChartData(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
