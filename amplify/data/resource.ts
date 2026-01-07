import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * GenAI Book Studio - Complete Data Schema
 *
 * This schema defines all entities for the book creation workflow:
 * - Projects: Top-level container for each book
 * - Briefs: Structured book brief with target audience, voice, etc.
 * - TOCs: Table of contents with versioning
 * - Chapters: Individual chapters with metadata
 * - ChapterPlans: Detailed plans for each chapter
 * - ChapterDrafts: Multiple draft versions with editorial stages
 * - Prompts: Versioned prompt templates for AI generation
 * - Runs: Execution log of all AI generations
 * - Comments: User annotations and suggestions
 * - StyleGuides: Project-level writing guidelines
 */
const schema = a.schema({
  // User profile extension (Amplify handles core auth)
  UserProfile: a
    .model({
      userId: a.string().required(),
      name: a.string(),
      role: a.string(), // standard, editor, admin
      preferences: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // Project: Top-level container for a book
  Project: a
    .model({
      title: a.string().required(),
      genre: a.string(),
      tone: a.string(),
      targetWordCount: a.integer(),
      targetChapters: a.integer(),
      status: a.string().required(), // brief, outline, drafting, revising, exported
      description: a.string(),
      metadata: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),

      // Relationships
      brief: a.hasOne('Brief', 'projectId'),
      tocs: a.hasMany('TOC', 'projectId'),
      chapters: a.hasMany('Chapter', 'projectId'),
      prompts: a.hasMany('Prompt', 'projectId'),
      runs: a.hasMany('Run', 'projectId'),
      comments: a.hasMany('Comment', 'projectId'),
      styleGuide: a.hasOne('StyleGuide', 'projectId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // Brief: Structured book brief
  Brief: a
    .model({
      projectId: a.id().required(),
      workingTitle: a.string(),
      hook: a.string(),
      targetReader: a.string(),
      keyPromise: a.string(),
      compTitles: a.string().array(),
      topicsInclude: a.string().array(),
      topicsExclude: a.string().array(),
      tone: a.string(),
      voice: a.string(),
      lengthTarget: a.string(),
      constraints: a.string().array(),
      contentJson: a.json(),
      lockedFields: a.string().array(),
      version: a.integer().required(),
      createdAt: a.datetime(),

      // Relationships
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // TOC: Table of Contents with versioning
  TOC: a
    .model({
      projectId: a.id().required(),
      structureJson: a.json().required(), // { parts: [], chapters: [] }
      version: a.integer().required(),
      approved: a.boolean(),
      approvedAt: a.datetime(),
      approvedBy: a.string(),
      notes: a.string(),
      createdAt: a.datetime(),

      // Relationships
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // Chapter: Individual chapter metadata
  Chapter: a
    .model({
      projectId: a.id().required(),
      number: a.integer().required(),
      title: a.string().required(),
      summary: a.string(),
      partNumber: a.integer(),
      partTitle: a.string(),
      status: a.string(), // planning, drafting, revising, complete
      wordCountTarget: a.integer(),
      pacing: a.string(),
      pov: a.string(),
      tense: a.string(),
      readingLevel: a.string(),
      metadata: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),

      // Relationships
      project: a.belongsTo('Project', 'projectId'),
      plan: a.hasOne('ChapterPlan', 'chapterId'),
      drafts: a.hasMany('ChapterDraft', 'chapterId'),
      comments: a.hasMany('Comment', 'chapterId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // ChapterPlan: Detailed plan for a chapter
  ChapterPlan: a
    .model({
      chapterId: a.id().required(),
      goals: a.string().array(),
      keyPoints: a.string().array(),
      examples: a.string().array(),
      transitions: a.string(),
      callbacks: a.string().array(),
      requiredElements: a.json(),
      continuityConstraints: a.json(),
      content: a.string(),
      version: a.integer().required(),
      createdAt: a.datetime(),

      // Relationships
      chapter: a.belongsTo('Chapter', 'chapterId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // ChapterDraft: Multiple versions with editorial stages
  ChapterDraft: a
    .model({
      chapterId: a.id().required(),
      content: a.string().required(),
      version: a.integer().required(),
      stage: a.string().required(), // draft, developmental, line, copy, proof
      wordCount: a.integer(),
      diff: a.string(),
      metadata: a.json(),
      createdBy: a.string(),
      createdAt: a.datetime(),

      // Relationships
      chapter: a.belongsTo('Chapter', 'chapterId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // Prompt: Versioned prompt templates
  Prompt: a
    .model({
      projectId: a.id(),
      scope: a.string().required(), // global, project
      name: a.string().required(),
      description: a.string(),
      template: a.string().required(),
      inputSchema: a.json(),
      outputSchema: a.json(),
      version: a.integer().required(),
      tags: a.string().array(),
      genre: a.string(),
      isActive: a.boolean(),
      safetyConstraints: a.string().array(),
      changelog: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),

      // Relationships
      project: a.belongsTo('Project', 'projectId'),
      runs: a.hasMany('Run', 'promptId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'create', 'update'])
    ]),

  // Run: Execution log of AI generations
  Run: a
    .model({
      projectId: a.id().required(),
      chapterId: a.id(),
      agentName: a.string().required(),
      promptId: a.id(),
      promptVersion: a.integer(),
      inputsJson: a.json().required(),
      outputText: a.string(),
      model: a.string().required(),
      temperature: a.float(),
      maxTokens: a.integer(),
      tokensUsed: a.integer(),
      status: a.string().required(), // queued, running, completed, failed
      error: a.string(),
      startedAt: a.datetime(),
      completedAt: a.datetime(),
      createdBy: a.string(),

      // Relationships
      project: a.belongsTo('Project', 'projectId'),
      prompt: a.belongsTo('Prompt', 'promptId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // Comment: User annotations and suggestions
  Comment: a
    .model({
      projectId: a.id().required(),
      chapterId: a.id(),
      text: a.string().required(),
      rangeStart: a.integer(),
      rangeEnd: a.integer(),
      type: a.string(), // comment, suggestion, flag
      resolved: a.boolean(),
      resolvedBy: a.string(),
      resolvedAt: a.datetime(),
      metadata: a.json(),
      createdBy: a.string(),
      createdAt: a.datetime(),

      // Relationships
      project: a.belongsTo('Project', 'projectId'),
      chapter: a.belongsTo('Chapter', 'chapterId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'create'])
    ]),

  // StyleGuide: Project-level writing guidelines
  StyleGuide: a
    .model({
      projectId: a.id().required(),
      content: a.string(),
      glossary: a.json(), // { term: definition }
      characterBible: a.json(), // { name: attributes }
      continuityNotes: a.json(),
      preferredUsage: a.json(),
      bannedWords: a.string().array(),
      writingRules: a.string().array(),
      version: a.integer().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),

      // Relationships
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // Use Cognito User Pool for authenticated access
  },
});
