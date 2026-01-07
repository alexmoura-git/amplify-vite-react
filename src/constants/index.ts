/**
 * GenAI Book Studio - Constants
 *
 * Application-wide constants and default values
 */

import { AgentName, EditorialStage } from '../types';

// Project workflow steps
export const PROJECT_STEPS = [
  { id: 'brief', label: 'Book Brief', path: '/project/:id/brief' },
  { id: 'audience', label: 'Audience & Voice', path: '/project/:id/audience' },
  { id: 'outline', label: 'Outline / TOC', path: '/project/:id/outline' },
  { id: 'plan', label: 'Chapter Plan', path: '/project/:id/plan' },
  { id: 'draft', label: 'Draft Chapters', path: '/project/:id/draft' },
  { id: 'revise', label: 'Revision Passes', path: '/project/:id/revise' },
  { id: 'consistency', label: 'Consistency & Style', path: '/project/:id/consistency' },
  { id: 'export', label: 'Final Export', path: '/project/:id/export' },
];

// Genre options
export const GENRES = [
  'Fiction - Literary',
  'Fiction - Mystery/Thriller',
  'Fiction - Science Fiction',
  'Fiction - Fantasy',
  'Fiction - Romance',
  'Fiction - Historical',
  'Fiction - Contemporary',
  'Non-Fiction - Self-Help',
  'Non-Fiction - Business',
  'Non-Fiction - Biography/Memoir',
  'Non-Fiction - History',
  'Non-Fiction - Science',
  'Non-Fiction - Technical/How-To',
  'Non-Fiction - Educational',
];

// Tone options
export const TONES = [
  'Professional',
  'Conversational',
  'Academic',
  'Inspirational',
  'Humorous',
  'Serious',
  'Friendly',
  'Authoritative',
  'Playful',
  'Formal',
];

// POV options
export const POV_OPTIONS = [
  'First Person',
  'Second Person',
  'Third Person Limited',
  'Third Person Omniscient',
];

// Tense options
export const TENSE_OPTIONS = [
  'Present',
  'Past',
  'Future',
];

// Reading level options
export const READING_LEVELS = [
  'Elementary',
  'Middle School',
  'High School',
  'College',
  'General Adult',
  'Academic',
];

// Editorial passes with descriptions
export const EDITORIAL_PASSES = [
  {
    id: 'structural',
    name: 'Structural Edit',
    description: 'Review overall flow, chapter order, and missing sections',
    stage: EditorialStage.DEVELOPMENTAL,
    checklist: [
      { id: 'flow', text: 'Chapter flow and transitions', checked: false },
      { id: 'order', text: 'Logical chapter ordering', checked: false },
      { id: 'missing', text: 'Missing or redundant sections', checked: false },
      { id: 'pacing', text: 'Overall pacing', checked: false },
    ],
  },
  {
    id: 'developmental',
    name: 'Developmental Edit',
    description: 'Focus on clarity, argument strength, and narrative arc',
    stage: EditorialStage.DEVELOPMENTAL,
    checklist: [
      { id: 'clarity', text: 'Clarity of ideas', checked: false },
      { id: 'argument', text: 'Strength of arguments', checked: false },
      { id: 'narrative', text: 'Narrative arc', checked: false },
      { id: 'examples', text: 'Quality of examples', checked: false },
    ],
  },
  {
    id: 'line',
    name: 'Line Edit',
    description: 'Improve style, voice consistency, and sentence variety',
    stage: EditorialStage.LINE,
    checklist: [
      { id: 'style', text: 'Consistent style', checked: false },
      { id: 'voice', text: 'Voice consistency', checked: false },
      { id: 'variety', text: 'Sentence variety', checked: false },
      { id: 'readability', text: 'Overall readability', checked: false },
    ],
  },
  {
    id: 'copy',
    name: 'Copyedit',
    description: 'Fix grammar, consistency, spelling, and punctuation',
    stage: EditorialStage.COPY,
    checklist: [
      { id: 'grammar', text: 'Grammar and syntax', checked: false },
      { id: 'spelling', text: 'Spelling', checked: false },
      { id: 'punctuation', text: 'Punctuation', checked: false },
      { id: 'consistency', text: 'Terminology consistency', checked: false },
    ],
  },
  {
    id: 'proof',
    name: 'Proof Pass',
    description: 'Final polish and formatting check',
    stage: EditorialStage.PROOF,
    checklist: [
      { id: 'formatting', text: 'Formatting issues', checked: false },
      { id: 'typos', text: 'Remaining typos', checked: false },
      { id: 'layout', text: 'Layout consistency', checked: false },
      { id: 'final', text: 'Final review', checked: false },
    ],
  },
];

// AI Model options
export const AI_MODELS = [
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' },
];

// Default model settings
export const DEFAULT_MODEL_SETTINGS = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 4000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// Agent configurations
export const AGENT_CONFIGS = {
  [AgentName.ARCHITECT]: {
    name: AgentName.ARCHITECT,
    description: 'Transforms raw brief into structured creative brief',
    defaultPrompt: 'brief-structuring',
    defaultModel: 'gpt-4-turbo-preview',
    temperature: 0.7,
  },
  [AgentName.OUTLINER]: {
    name: AgentName.OUTLINER,
    description: 'Generates table of contents from brief',
    defaultPrompt: 'toc-generation',
    defaultModel: 'gpt-4-turbo-preview',
    temperature: 0.8,
  },
  [AgentName.WRITER]: {
    name: AgentName.WRITER,
    description: 'Writes chapter drafts from plans',
    defaultPrompt: 'chapter-drafting',
    defaultModel: 'gpt-4-turbo-preview',
    temperature: 0.9,
  },
  [AgentName.DEVELOPMENTAL_EDITOR]: {
    name: AgentName.DEVELOPMENTAL_EDITOR,
    description: 'Performs developmental editing',
    defaultPrompt: 'developmental-edit',
    defaultModel: 'gpt-4',
    temperature: 0.5,
  },
  [AgentName.LINE_EDITOR]: {
    name: AgentName.LINE_EDITOR,
    description: 'Performs line editing for style and voice',
    defaultPrompt: 'line-edit',
    defaultModel: 'gpt-4',
    temperature: 0.5,
  },
  [AgentName.COPYEDITOR]: {
    name: AgentName.COPYEDITOR,
    description: 'Performs copyediting for grammar and consistency',
    defaultPrompt: 'copyedit',
    defaultModel: 'gpt-3.5-turbo',
    temperature: 0.3,
  },
  [AgentName.CONTINUITY_ANALYST]: {
    name: AgentName.CONTINUITY_ANALYST,
    description: 'Checks for continuity and consistency issues',
    defaultPrompt: 'continuity-check',
    defaultModel: 'gpt-4',
    temperature: 0.3,
  },
  [AgentName.FACT_CHECKER]: {
    name: AgentName.FACT_CHECKER,
    description: 'Identifies claims that need verification',
    defaultPrompt: 'fact-check',
    defaultModel: 'gpt-4',
    temperature: 0.2,
  },
};

// Token cost per 1K tokens (in USD)
export const TOKEN_COSTS = {
  'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
};

// Default word counts
export const DEFAULT_WORD_COUNTS = {
  'Fiction - Literary': { min: 70000, max: 100000, chapters: 25 },
  'Fiction - Mystery/Thriller': { min: 70000, max: 90000, chapters: 30 },
  'Fiction - Science Fiction': { min: 90000, max: 120000, chapters: 30 },
  'Fiction - Fantasy': { min: 90000, max: 150000, chapters: 35 },
  'Fiction - Romance': { min: 50000, max: 90000, chapters: 20 },
  'Non-Fiction - Self-Help': { min: 40000, max: 60000, chapters: 15 },
  'Non-Fiction - Business': { min: 40000, max: 70000, chapters: 12 },
  'Non-Fiction - Biography/Memoir': { min: 70000, max: 100000, chapters: 25 },
  'Non-Fiction - Technical/How-To': { min: 30000, max: 60000, chapters: 12 },
};

// Autosave interval (milliseconds)
export const AUTOSAVE_INTERVAL = 30000; // 30 seconds

// Max retries for failed runs
export const MAX_RUN_RETRIES = 3;

// Export templates
export const FRONT_MATTER_TEMPLATE = `# {{title}}

By {{author}}

---

## Dedication

{{dedication}}

## Foreword

{{foreword}}

---
`;

export const BACK_MATTER_TEMPLATE = `---

## About the Author

{{aboutAuthor}}

## Resources

{{resources}}

## Acknowledgments

{{acknowledgments}}
`;
