/**
 * GenAI Book Studio - Type Definitions
 *
 * Core types for the application that extend the Amplify schema types
 */

import type { Schema } from '../../amplify/data/resource';

// Re-export Amplify schema types
export type Project = Schema['Project']['type'];
export type Brief = Schema['Brief']['type'];
export type TOC = Schema['TOC']['type'];
export type Chapter = Schema['Chapter']['type'];
export type ChapterPlan = Schema['ChapterPlan']['type'];
export type ChapterDraft = Schema['ChapterDraft']['type'];
export type Prompt = Schema['Prompt']['type'];
export type Run = Schema['Run']['type'];
export type Comment = Schema['Comment']['type'];
export type StyleGuide = Schema['StyleGuide']['type'];
export type UserProfile = Schema['UserProfile']['type'];

// Project status enum
export enum ProjectStatus {
  BRIEF = 'brief',
  OUTLINE = 'outline',
  DRAFTING = 'drafting',
  REVISING = 'revising',
  EXPORTED = 'exported',
}

// Chapter status enum
export enum ChapterStatus {
  PLANNING = 'planning',
  DRAFTING = 'drafting',
  REVISING = 'revising',
  COMPLETE = 'complete',
}

// Editorial stage enum
export enum EditorialStage {
  DRAFT = 'draft',
  DEVELOPMENTAL = 'developmental',
  LINE = 'line',
  COPY = 'copy',
  PROOF = 'proof',
}

// Run status enum
export enum RunStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Agent names enum
export enum AgentName {
  ARCHITECT = 'Architect',
  OUTLINER = 'Outliner',
  WRITER = 'Writer',
  DEVELOPMENTAL_EDITOR = 'Developmental Editor',
  LINE_EDITOR = 'Line Editor',
  COPYEDITOR = 'Copyeditor',
  CONTINUITY_ANALYST = 'Continuity Analyst',
  FACT_CHECKER = 'Fact Checker',
}

// Comment type enum
export enum CommentType {
  COMMENT = 'comment',
  SUGGESTION = 'suggestion',
  FLAG = 'flag',
}

// TOC structure types
export interface TOCPart {
  number: number;
  title: string;
  chapters: number[]; // chapter numbers
}

export interface TOCChapter {
  number: number;
  title: string;
  summary: string;
  partNumber?: number;
  learningObjectives?: string[];
  takeaways?: string[];
}

export interface TOCStructure {
  parts?: TOCPart[];
  chapters: TOCChapter[];
}

// UI state types
export interface ProjectWorkspaceStep {
  id: string;
  label: string;
  path: string;
  completed: boolean;
  current: boolean;
}

export interface EditorialPass {
  id: string;
  name: string;
  description: string;
  stage: EditorialStage;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  score?: number;
}

export interface Suggestion {
  id: string;
  chapterId: string;
  rangeStart: number;
  rangeEnd: number;
  original: string;
  suggested: string;
  explanation: string;
  accepted: boolean;
}

// AI Model settings
export interface ModelSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Prompt template variables
export interface PromptContext {
  brief?: Brief;
  styleGuide?: StyleGuide;
  toc?: TOCStructure;
  chapter?: Chapter;
  chapterPlan?: ChapterPlan;
  previousChapters?: ChapterDraft[];
  nextChapters?: TOCChapter[];
  glossary?: Record<string, string>;
  characterBible?: Record<string, any>;
  customVariables?: Record<string, any>;
}

// Export options
export interface ExportOptions {
  format: 'docx' | 'pdf' | 'markdown';
  includeFrontMatter: boolean;
  includeBackMatter: boolean;
  frontMatterTemplate?: string;
  backMatterTemplate?: string;
  chapterHeadingStyle?: string;
  selectedChapters?: string[]; // chapter IDs
  version?: 'latest' | 'approved' | string; // version number
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultModel: string;
  defaultTemperature: number;
  autosaveInterval: number;
  showLineNumbers: boolean;
  editorFontSize: number;
}

// Queue task
export interface QueueTask {
  id: string;
  type: 'generate' | 'revise' | 'analyze';
  agentName: AgentName;
  status: RunStatus;
  progress: number;
  projectId: string;
  chapterId?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Cost tracking
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ProjectCostSummary {
  projectId: string;
  totalTokens: number;
  totalCost: number;
  runsByAgent: Record<AgentName, number>;
  dailyUsage: Record<string, TokenUsage>;
}
