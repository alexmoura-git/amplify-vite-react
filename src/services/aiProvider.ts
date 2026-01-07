/**
 * AI Provider Service
 *
 * Abstraction layer for AI model providers (OpenAI, Anthropic, etc.)
 * Supports swapping models without refactoring
 */

import { ModelSettings, TokenUsage } from '../types';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface AICompletionResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason: string;
}

/**
 * Base AI Provider interface
 */
export interface AIProvider {
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  estimateCost(tokens: number, model: string, type: 'prompt' | 'completion'): number;
}

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseURL = baseURL || 'https://api.openai.com/v1';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment.');
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        top_p: request.topP ?? 1,
        frequency_penalty: request.frequencyPenalty ?? 0,
        presence_penalty: request.presencePenalty ?? 0,
        stop: request.stop,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        estimatedCost: this.calculateCost(
          data.usage.prompt_tokens,
          data.usage.completion_tokens,
          request.model
        ),
      },
      model: data.model,
      finishReason: choice.finish_reason,
    };
  }

  estimateCost(tokens: number, model: string, type: 'prompt' | 'completion'): number {
    const costs: Record<string, { prompt: number; completion: number }> = {
      'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    };

    const modelCost = costs[model] || costs['gpt-4-turbo-preview'];
    return (tokens / 1000) * modelCost[type];
  }

  private calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    return (
      this.estimateCost(promptTokens, model, 'prompt') +
      this.estimateCost(completionTokens, model, 'completion')
    );
  }
}

/**
 * Anthropic Provider Implementation (stub - can be fully implemented)
 */
export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || '';
    this.baseURL = baseURL || 'https://api.anthropic.com/v1';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured. Please set VITE_ANTHROPIC_API_KEY in your environment.');
    }

    // Convert OpenAI-style messages to Anthropic format
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const userMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        system: systemMessage,
        messages: userMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        estimatedCost: this.calculateCost(
          data.usage.input_tokens,
          data.usage.output_tokens,
          request.model
        ),
      },
      model: data.model,
      finishReason: data.stop_reason,
    };
  }

  estimateCost(tokens: number, model: string, type: 'prompt' | 'completion'): number {
    const costs: Record<string, { prompt: number; completion: number }> = {
      'claude-3-opus': { prompt: 0.015, completion: 0.075 },
      'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
      'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
    };

    const modelCost = costs[model] || costs['claude-3-sonnet'];
    return (tokens / 1000) * modelCost[type];
  }

  private calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    return (
      this.estimateCost(promptTokens, model, 'prompt') +
      this.estimateCost(completionTokens, model, 'completion')
    );
  }
}

/**
 * AI Provider Factory
 * Returns the appropriate provider based on model name
 */
export class AIProviderFactory {
  private static openaiProvider: OpenAIProvider;
  private static anthropicProvider: AnthropicProvider;

  static getProvider(model: string): AIProvider {
    if (model.startsWith('gpt-')) {
      if (!this.openaiProvider) {
        this.openaiProvider = new OpenAIProvider();
      }
      return this.openaiProvider;
    } else if (model.startsWith('claude-')) {
      if (!this.anthropicProvider) {
        this.anthropicProvider = new AnthropicProvider();
      }
      return this.anthropicProvider;
    }

    // Default to OpenAI
    if (!this.openaiProvider) {
      this.openaiProvider = new OpenAIProvider();
    }
    return this.openaiProvider;
  }

  static async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const provider = this.getProvider(request.model);
    return provider.complete(request);
  }

  static estimateCost(tokens: number, model: string, type: 'prompt' | 'completion'): number {
    const provider = this.getProvider(model);
    return provider.estimateCost(tokens, model, type);
  }
}

/**
 * Convenience function for making AI completions
 */
export async function createCompletion(
  prompt: string,
  settings: ModelSettings,
  systemPrompt?: string
): Promise<AICompletionResponse> {
  const messages: AIMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  return AIProviderFactory.complete({
    messages,
    model: settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    topP: settings.topP,
    frequencyPenalty: settings.frequencyPenalty,
    presencePenalty: settings.presencePenalty,
  });
}
