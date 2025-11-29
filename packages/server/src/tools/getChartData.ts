import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { salesData } from '../data/mockData.js';

export interface GetChartDataArgs {
  chartId:
    | 'sales-current-month'
    | 'sales-previous-month'
    | 'revenue-by-category'
    | 'top-products';
}

export const getChartDataTool: ChatCompletionTool = {
  type: 'function' as const,
  function: {
    name: 'getChartData',
    description:
      'Получить данные конкретного графика для анализа продаж и бизнес-метрик',
    parameters: {
      type: 'object',
      properties: {
        chartId: {
          type: 'string',
          description:
            "ID графика. Доступные варианты:\n" +
            "- 'sales-current-month': продажи за текущий месяц (по дням)\n" +
            "- 'sales-previous-month': продажи за прошлый месяц (по дням)\n" +
            "- 'revenue-by-category': доход по категориям товаров\n" +
            "- 'top-products': топ-5 продуктов по продажам",
          enum: [
            'sales-current-month',
            'sales-previous-month',
            'revenue-by-category',
            'top-products',
          ],
        },
      },
      required: ['chartId'],
    },
  },
};

export function executeGetChartData(args: any) {
  const { chartId } = args as GetChartDataArgs;

  if (!chartId) {
    throw new Error('chartId is required');
  }

  const data = salesData[chartId];
  if (!data) {
    throw new Error(`Chart not found: ${chartId}`);
  }
  return data;
}
