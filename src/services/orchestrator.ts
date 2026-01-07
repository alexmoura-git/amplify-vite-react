/**
 * Multi-Agent Orchestrator
 *
 * Manages the execution of multi-agent workflows with queuing,
 * status tracking, and retry logic.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  AgentName,
  RunStatus,
  PromptContext,
  ModelSettings,
  QueueTask,
} from '../types';
import { AIProviderFactory } from './aiProvider';
import { PromptService } from './promptService';
import { AGENT_CONFIGS, MAX_RUN_RETRIES } from '../constants';

const client = generateClient<Schema>();

export interface OrchestrationTask {
  agentName: AgentName;
  projectId: string;
  chapterId?: string;
  context: PromptContext;
  settings?: ModelSettings;
  retryCount?: number;
}

export interface OrchestrationResult {
  success: boolean;
  output?: string;
  runId?: string;
  error?: string;
  usage?: {
    tokens: number;
    cost: number;
  };
}

/**
 * Orchestrator class for managing multi-agent workflows
 */
export class Orchestrator {
  private queue: Map<string, QueueTask> = new Map();
  private activeRuns: Set<string> = new Set();

  /**
   * Execute a single agent task
   */
  async executeTask(task: OrchestrationTask): Promise<OrchestrationResult> {
    const { agentName, projectId, chapterId, context, settings, retryCount = 0 } = task;

    try {
      // Get agent configuration
      const agentConfig = AGENT_CONFIGS[agentName];
      if (!agentConfig) {
        throw new Error(`Unknown agent: ${agentName}`);
      }

      // Get prompt template
      const promptService = new PromptService();
      const promptTemplate = await promptService.getPromptByName(
        agentConfig.defaultPrompt,
        projectId
      );

      if (!promptTemplate) {
        throw new Error(`Prompt template not found: ${agentConfig.defaultPrompt}`);
      }

      // Compile prompt with context
      const compiledPrompt = promptService.compilePrompt(promptTemplate.template || '', context);

      // Prepare model settings
      const modelSettings: ModelSettings = settings || {
        model: agentConfig.defaultModel,
        temperature: agentConfig.temperature,
        maxTokens: 4000,
      };

      // Create run record
      const runResult = await client.models.Run.create({
        projectId,
        chapterId,
        agentName,
        promptId: promptTemplate.id,
        promptVersion: promptTemplate.version,
        inputsJson: context as any,
        model: modelSettings.model,
        temperature: modelSettings.temperature,
        maxTokens: modelSettings.maxTokens,
        status: RunStatus.RUNNING,
        startedAt: new Date().toISOString(),
      });

      if (!runResult.data) {
        throw new Error('Failed to create run record');
      }

      const runId = runResult.data.id;

      try {
        // Execute AI completion
        const response = await AIProviderFactory.complete({
          messages: [
            {
              role: 'system',
              content: `You are a ${agentName} for a book writing project. Follow the instructions carefully and provide high-quality output.`,
            },
            {
              role: 'user',
              content: compiledPrompt,
            },
          ],
          model: modelSettings.model,
          temperature: modelSettings.temperature,
          maxTokens: modelSettings.maxTokens,
        });

        // Update run record with success
        await client.models.Run.update({
          id: runId,
          outputText: response.content,
          tokensUsed: response.usage.totalTokens,
          status: RunStatus.COMPLETED,
          completedAt: new Date().toISOString(),
        });

        return {
          success: true,
          output: response.content,
          runId,
          usage: {
            tokens: response.usage.totalTokens,
            cost: response.usage.estimatedCost,
          },
        };
      } catch (error) {
        // Handle execution error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Retry logic
        if (retryCount < MAX_RUN_RETRIES) {
          console.warn(`Task failed, retrying (${retryCount + 1}/${MAX_RUN_RETRIES}):`, errorMessage);
          return this.executeTask({
            ...task,
            retryCount: retryCount + 1,
          });
        }

        // Update run record with failure
        await client.models.Run.update({
          id: runId,
          status: RunStatus.FAILED,
          error: errorMessage,
          completedAt: new Date().toISOString(),
        });

        return {
          success: false,
          error: errorMessage,
          runId,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Task execution error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute multiple tasks in sequence
   */
  async executeSequence(tasks: OrchestrationTask[]): Promise<OrchestrationResult[]> {
    const results: OrchestrationResult[] = [];

    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);

      // Stop sequence if a required task fails
      if (!result.success) {
        console.error('Sequence halted due to task failure:', result.error);
        break;
      }
    }

    return results;
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeParallel(tasks: OrchestrationTask[]): Promise<OrchestrationResult[]> {
    const promises = tasks.map(task => this.executeTask(task));
    return Promise.all(promises);
  }

  /**
   * Add task to queue
   */
  addToQueue(task: OrchestrationTask): string {
    const taskId = crypto.randomUUID();
    const queueTask: QueueTask = {
      id: taskId,
      type: 'generate',
      agentName: task.agentName,
      status: RunStatus.QUEUED,
      progress: 0,
      projectId: task.projectId,
      chapterId: task.chapterId,
      createdAt: new Date(),
    };

    this.queue.set(taskId, queueTask);

    // Start processing queue
    this.processQueue();

    return taskId;
  }

  /**
   * Process queued tasks
   */
  private async processQueue() {
    // Process tasks one at a time (can be enhanced for parallel processing)
    for (const [taskId, queueTask] of this.queue.entries()) {
      if (queueTask.status === RunStatus.QUEUED && !this.activeRuns.has(taskId)) {
        this.activeRuns.add(taskId);

        // Update status
        queueTask.status = RunStatus.RUNNING;
        queueTask.startedAt = new Date();

        // Execute task (implementation would retrieve full task details)
        // This is a simplified version
        try {
          queueTask.status = RunStatus.COMPLETED;
          queueTask.completedAt = new Date();
          queueTask.progress = 100;
        } catch (error) {
          queueTask.status = RunStatus.FAILED;
          queueTask.error = error instanceof Error ? error.message : 'Unknown error';
          queueTask.completedAt = new Date();
        }

        this.activeRuns.delete(taskId);
        this.queue.delete(taskId);
      }
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): QueueTask[] {
    return Array.from(this.queue.values());
  }

  /**
   * Cancel a queued task
   */
  cancelTask(taskId: string): boolean {
    if (this.queue.has(taskId)) {
      this.queue.delete(taskId);
      return true;
    }
    return false;
  }
}

/**
 * Global orchestrator instance
 */
export const orchestrator = new Orchestrator();

/**
 * Convenience functions for common workflows
 */

/**
 * Generate TOC from brief
 */
export async function generateTOC(
  projectId: string,
  context: PromptContext,
  settings?: ModelSettings
): Promise<OrchestrationResult> {
  return orchestrator.executeTask({
    agentName: AgentName.OUTLINER,
    projectId,
    context,
    settings,
  });
}

/**
 * Draft a chapter
 */
export async function draftChapter(
  projectId: string,
  chapterId: string,
  context: PromptContext,
  settings?: ModelSettings
): Promise<OrchestrationResult> {
  return orchestrator.executeTask({
    agentName: AgentName.WRITER,
    projectId,
    chapterId,
    context,
    settings,
  });
}

/**
 * Run editorial pass
 */
export async function runEditorialPass(
  agentName: AgentName,
  projectId: string,
  chapterId: string,
  context: PromptContext,
  settings?: ModelSettings
): Promise<OrchestrationResult> {
  return orchestrator.executeTask({
    agentName,
    projectId,
    chapterId,
    context,
    settings,
  });
}

/**
 * Batch draft all chapters
 */
export async function batchDraftChapters(
  projectId: string,
  chapters: Array<{ id: string; context: PromptContext }>,
  settings?: ModelSettings
): Promise<OrchestrationResult[]> {
  const tasks = chapters.map(chapter => ({
    agentName: AgentName.WRITER,
    projectId,
    chapterId: chapter.id,
    context: chapter.context,
    settings,
  }));

  return orchestrator.executeSequence(tasks);
}
