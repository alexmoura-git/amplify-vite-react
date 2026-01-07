/**
 * Prompt Service
 *
 * Manages prompt templates, versioning, and compilation with context
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Prompt, PromptContext } from '../types';

const client = generateClient<Schema>();

export class PromptService {
  /**
   * Get prompt by name (prioritizes project-specific, falls back to global)
   */
  async getPromptByName(name: string, projectId?: string): Promise<Prompt | null> {
    try {
      // First try project-specific prompt
      if (projectId) {
        const projectPromptResult = await client.models.Prompt.list({
          filter: {
            name: { eq: name },
            projectId: { eq: projectId },
            scope: { eq: 'project' },
            isActive: { eq: true },
          },
        });

        if (projectPromptResult.data && projectPromptResult.data.length > 0) {
          // Get the latest version
          const sorted = projectPromptResult.data.sort((a, b) =>
            (b.version || 0) - (a.version || 0)
          );
          return sorted[0] as Prompt;
        }
      }

      // Fall back to global prompt
      const globalPromptResult = await client.models.Prompt.list({
        filter: {
          name: { eq: name },
          scope: { eq: 'global' },
          isActive: { eq: true },
        },
      });

      if (globalPromptResult.data && globalPromptResult.data.length > 0) {
        // Get the latest version
        const sorted = globalPromptResult.data.sort((a, b) =>
          (b.version || 0) - (a.version || 0)
        );
        return sorted[0] as Prompt;
      }

      return null;
    } catch (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }
  }

  /**
   * Compile prompt template with context variables
   */
  compilePrompt(template: string, context: PromptContext): string {
    let compiled = template;

    // Replace all {{variable}} placeholders
    compiled = compiled.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      // Check if variable exists in context
      if (variable in context) {
        const value = (context as any)[variable];

        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }

        return String(value);
      }

      return match; // Keep placeholder if no value found
    });

    // Handle nested objects (e.g., {{brief.title}})
    compiled = compiled.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, prop) => {
      if (obj in context) {
        const value = (context as any)[obj];
        if (value && typeof value === 'object' && prop in value) {
          return String(value[prop]);
        }
      }
      return match;
    });

    // Handle custom variables
    if (context.customVariables) {
      Object.entries(context.customVariables).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        compiled = compiled.replace(placeholder, String(value));
      });
    }

    return compiled;
  }

  /**
   * Create new prompt
   */
  async createPrompt(
    name: string,
    template: string,
    description?: string,
    scope: 'global' | 'project' = 'global',
    projectId?: string,
    tags?: string[],
    genre?: string
  ): Promise<Prompt | null> {
    try {
      const result = await client.models.Prompt.create({
        name,
        template,
        description,
        scope,
        projectId: scope === 'project' ? projectId : undefined,
        version: 1,
        tags,
        genre,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return result.data as Prompt;
    } catch (error) {
      console.error('Error creating prompt:', error);
      return null;
    }
  }

  /**
   * Update prompt (creates new version)
   */
  async updatePrompt(
    promptId: string,
    template: string,
    changelog?: string
  ): Promise<Prompt | null> {
    try {
      // Get existing prompt
      const existingResult = await client.models.Prompt.get({ id: promptId });
      if (!existingResult.data) {
        throw new Error('Prompt not found');
      }

      const existing = existingResult.data;

      // Deactivate old version
      await client.models.Prompt.update({
        id: promptId,
        isActive: false,
      });

      // Create new version
      const result = await client.models.Prompt.create({
        name: existing.name,
        description: existing.description,
        template,
        scope: existing.scope,
        projectId: existing.projectId,
        version: (existing.version || 0) + 1,
        tags: existing.tags,
        genre: existing.genre,
        isActive: true,
        changelog,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return result.data as Prompt;
    } catch (error) {
      console.error('Error updating prompt:', error);
      return null;
    }
  }

  /**
   * Get all versions of a prompt
   */
  async getPromptVersions(name: string, projectId?: string): Promise<Prompt[]> {
    try {
      const filter: any = { name: { eq: name } };

      if (projectId) {
        filter.projectId = { eq: projectId };
      }

      const result = await client.models.Prompt.list({ filter });

      if (result.data) {
        return result.data.sort((a, b) => (b.version || 0) - (a.version || 0)) as Prompt[];
      }

      return [];
    } catch (error) {
      console.error('Error fetching prompt versions:', error);
      return [];
    }
  }

  /**
   * List all prompts
   */
  async listPrompts(scope?: 'global' | 'project', projectId?: string): Promise<Prompt[]> {
    try {
      const filter: any = { isActive: { eq: true } };

      if (scope) {
        filter.scope = { eq: scope };
      }

      if (projectId && scope === 'project') {
        filter.projectId = { eq: projectId };
      }

      const result = await client.models.Prompt.list({ filter });

      return (result.data || []) as Prompt[];
    } catch (error) {
      console.error('Error listing prompts:', error);
      return [];
    }
  }

  /**
   * Delete prompt
   */
  async deletePrompt(promptId: string): Promise<boolean> {
    try {
      await client.models.Prompt.delete({ id: promptId });
      return true;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      return false;
    }
  }

  /**
   * Test prompt with sample data
   */
  async testPrompt(template: string, sampleContext: PromptContext): Promise<string> {
    return this.compilePrompt(template, sampleContext);
  }
}
