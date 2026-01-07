/**
 * Context Service
 *
 * Manages project memory and context retrieval for AI generations
 * Implements RAG-lite pattern by pulling only relevant context
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  Brief,
  TOC,
  Chapter,
  ChapterPlan,
  ChapterDraft,
  StyleGuide,
  PromptContext,
  TOCStructure,
} from '../types';

const client = generateClient<Schema>();

export class ContextService {
  /**
   * Build complete context for brief generation
   */
  async getBriefContext(projectId: string): Promise<PromptContext> {
    const context: PromptContext = {};

    // Get project
    const projectResult = await client.models.Project.get({ id: projectId });
    if (projectResult.data) {
      context.customVariables = {
        projectTitle: projectResult.data.title,
        genre: projectResult.data.genre,
        tone: projectResult.data.tone,
      };
    }

    return context;
  }

  /**
   * Build context for TOC generation
   */
  async getTOCContext(projectId: string): Promise<PromptContext> {
    const context: PromptContext = {};

    // Get brief
    const briefResult = await client.models.Brief.list({
      filter: { projectId: { eq: projectId } },
    });
    if (briefResult.data && briefResult.data.length > 0) {
      context.brief = briefResult.data[0] as Brief;
    }

    // Get style guide if exists
    const styleGuideResult = await client.models.StyleGuide.list({
      filter: { projectId: { eq: projectId } },
    });
    if (styleGuideResult.data && styleGuideResult.data.length > 0) {
      context.styleGuide = styleGuideResult.data[0] as StyleGuide;
    }

    return context;
  }

  /**
   * Build context for chapter plan generation
   */
  async getChapterPlanContext(
    projectId: string,
    chapterId: string
  ): Promise<PromptContext> {
    const context: PromptContext = {};

    // Get brief
    const briefResult = await client.models.Brief.list({
      filter: { projectId: { eq: projectId } },
    });
    if (briefResult.data && briefResult.data.length > 0) {
      context.brief = briefResult.data[0] as Brief;
    }

    // Get TOC
    const tocResult = await client.models.TOC.list({
      filter: {
        projectId: { eq: projectId },
        approved: { eq: true },
      },
    });
    if (tocResult.data && tocResult.data.length > 0) {
      const latestTOC = tocResult.data.sort((a, b) =>
        (b.version || 0) - (a.version || 0)
      )[0];
      context.toc = latestTOC.structureJson as TOCStructure;
    }

    // Get current chapter
    const chapterResult = await client.models.Chapter.get({ id: chapterId });
    if (chapterResult.data) {
      context.chapter = chapterResult.data as Chapter;

      // Get neighboring chapters from TOC
      if (context.toc) {
        const currentNumber = chapterResult.data.number;
        context.nextChapters = context.toc.chapters.filter(
          c => c.number > currentNumber && c.number <= currentNumber + 2
        );
      }
    }

    // Get style guide
    const styleGuideResult = await client.models.StyleGuide.list({
      filter: { projectId: { eq: projectId } },
    });
    if (styleGuideResult.data && styleGuideResult.data.length > 0) {
      const styleGuide = styleGuideResult.data[0] as StyleGuide;
      context.styleGuide = styleGuide;
      context.glossary = styleGuide.glossary as Record<string, string>;
      context.characterBible = styleGuide.characterBible as Record<string, any>;
    }

    return context;
  }

  /**
   * Build context for chapter drafting
   */
  async getChapterDraftContext(
    projectId: string,
    chapterId: string
  ): Promise<PromptContext> {
    const context = await this.getChapterPlanContext(projectId, chapterId);

    // Get chapter plan
    const planResult = await client.models.ChapterPlan.list({
      filter: { chapterId: { eq: chapterId } },
    });
    if (planResult.data && planResult.data.length > 0) {
      const latestPlan = planResult.data.sort((a, b) =>
        (b.version || 0) - (a.version || 0)
      )[0];
      context.chapterPlan = latestPlan as ChapterPlan;
    }

    // Get previous chapters (for continuity)
    if (context.chapter) {
      const previousChaptersResult = await client.models.Chapter.list({
        filter: {
          projectId: { eq: projectId },
          number: { lt: context.chapter.number },
        },
      });

      if (previousChaptersResult.data) {
        // Get the 2 most recent previous chapters
        const recentPrevious = previousChaptersResult.data
          .sort((a, b) => (b.number || 0) - (a.number || 0))
          .slice(0, 2);

        // Get their latest drafts
        const previousDrafts = await Promise.all(
          recentPrevious.map(async (ch) => {
            const draftsResult = await client.models.ChapterDraft.list({
              filter: { chapterId: { eq: ch.id } },
            });
            if (draftsResult.data && draftsResult.data.length > 0) {
              return draftsResult.data.sort((a, b) =>
                (b.version || 0) - (a.version || 0)
              )[0];
            }
            return null;
          })
        );

        context.previousChapters = previousDrafts.filter(d => d !== null) as ChapterDraft[];
      }
    }

    return context;
  }

  /**
   * Build context for editorial pass
   */
  async getEditorialContext(
    projectId: string,
    chapterId: string
  ): Promise<PromptContext> {
    const context = await this.getChapterDraftContext(projectId, chapterId);

    // Context already includes everything needed for editorial passes
    return context;
  }

  /**
   * Build context for continuity check
   */
  async getContinuityContext(projectId: string): Promise<PromptContext> {
    const context: PromptContext = {};

    // Get brief
    const briefResult = await client.models.Brief.list({
      filter: { projectId: { eq: projectId } },
    });
    if (briefResult.data && briefResult.data.length > 0) {
      context.brief = briefResult.data[0] as Brief;
    }

    // Get style guide
    const styleGuideResult = await client.models.StyleGuide.list({
      filter: { projectId: { eq: projectId } },
    });
    if (styleGuideResult.data && styleGuideResult.data.length > 0) {
      const styleGuide = styleGuideResult.data[0] as StyleGuide;
      context.styleGuide = styleGuide;
      context.glossary = styleGuide.glossary as Record<string, string>;
      context.characterBible = styleGuide.characterBible as Record<string, any>;
    }

    // Get all chapters
    const chaptersResult = await client.models.Chapter.list({
      filter: { projectId: { eq: projectId } },
    });

    if (chaptersResult.data) {
      // Get latest draft for each chapter
      const allDrafts = await Promise.all(
        chaptersResult.data.map(async (chapter) => {
          const draftsResult = await client.models.ChapterDraft.list({
            filter: { chapterId: { eq: chapter.id } },
          });
          if (draftsResult.data && draftsResult.data.length > 0) {
            return draftsResult.data.sort((a, b) =>
              (b.version || 0) - (a.version || 0)
            )[0];
          }
          return null;
        })
      );

      context.previousChapters = allDrafts.filter(d => d !== null) as ChapterDraft[];
    }

    return context;
  }

  /**
   * Update continuity notes in style guide
   */
  async updateContinuityNotes(
    projectId: string,
    continuityNotes: Record<string, any>
  ): Promise<void> {
    const styleGuideResult = await client.models.StyleGuide.list({
      filter: { projectId: { eq: projectId } },
    });

    if (styleGuideResult.data && styleGuideResult.data.length > 0) {
      const styleGuide = styleGuideResult.data[0];
      await client.models.StyleGuide.update({
        id: styleGuide.id,
        continuityNotes: continuityNotes as any,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}
