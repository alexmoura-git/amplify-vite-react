# GenAI Book Studio

**Transform your ideas into published books with AI-powered writing assistance**

GenAI Book Studio is a comprehensive web application that guides authors through the entire book creation process, from initial brief to final export. It uses structured GenAI workflows that mirror real-world writing and editorial best practices, with human-in-the-loop review at every stage.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Writing Pipeline](#writing-pipeline)
- [Multi-Agent System](#multi-agent-system)
- [Data Model](#data-model)
- [Prompt Library](#prompt-library)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Security & Permissions](#security--permissions)
- [Cost Controls](#cost-controls)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Overview

GenAI Book Studio is built for:
- **Authors & Ghostwriters**: Individual writers crafting books with AI assistance
- **Content Teams**: Organizations producing multiple books simultaneously
- **Indie Publishers**: Small publishing houses managing editorial workflows
- **Educators**: Teaching structured writing and the book creation process

**Core Principles:**
1. **Human-in-the-Loop**: Nothing is "final" without user review and approval
2. **Traceability**: Every generated text has full provenance (prompt version, agent, model, inputs)
3. **Editorial Workflow**: Professional draft → revise → edit → copyedit → proof workflow
4. **Versioning**: Full version control with diff comparison and revert capabilities

---

## Features

### 1. Dashboard
- Project list with status indicators (Brief, Outline, Drafting, Revising, Exported)
- Quick actions: Continue Writing, Export, Duplicate Project
- Project metadata: genre, word count target, chapter count, last updated

### 2. Book Brief Editor
Structured form for capturing:
- Working title and one-sentence hook
- Target reader profile
- Key promise/transformation
- Comparable titles
- Topics to include/exclude
- Tone, voice, and style preferences
- Length targets and constraints

### 3. Outline / TOC Builder
- **AI Generation**: Automatically generate table of contents from brief
- **Drag & Drop**: Reorder chapters visually
- **Inline Editing**: Edit chapter titles and summaries directly
- **Version Control**: Save multiple TOC versions with approval gates
- **Structure**: Support for parts/sections with nested chapters

### 4. Chapter Planning
For each chapter, define:
- Goals, key points, examples
- Opening hooks and transitions
- Callbacks to earlier chapters
- Character development notes (fiction)
- Learning objectives (non-fiction)
- Continuity constraints

### 5. Chapter Drafting
- **Split Layout**: Plan on left, draft editor on right
- **AI Draft Generation**: Generate full chapter drafts from plans
- **Version Control**: Save multiple draft versions with stage tracking
- **Word Count Tracking**: Real-time word count display
- **Context-Aware**: Uses brief, style guide, and previous chapters for continuity

### 6. Revision Passes
Guided editorial passes with AI assistance:
- **Structural Edit**: Flow, chapter order, missing sections
- **Developmental Edit**: Clarity, argument strength, narrative arc
- **Line Edit**: Style, voice consistency, sentence variety
- **Copyedit**: Grammar, spelling, punctuation, consistency
- **Proof Pass**: Final polish and formatting

Each pass provides:
- Scored checklist (0-100)
- Specific suggestions with explanations
- Accept/reject interface for suggestions
- Before/after version comparison

### 7. Consistency & Style
- **Global Style Guide**: Project-level writing guidelines (editable)
- **Glossary**: Term definitions and preferred usage
- **Character/Entity Bible**: Names, attributes, relationships
- **Continuity Checker**: Flags contradictions across chapters
- **Repetition Checker**: Highlights repeated phrases/ideas

### 8. Export
Export formats:
- **Microsoft Word (.docx)**: Fully formatted with heading styles
- **PDF (.pdf)**: Print-ready with pagination
- **Markdown (.md)**: Plain text with markdown formatting

Options:
- Include/exclude front matter (dedication, foreword)
- Include/exclude back matter (about author, resources)
- Choose version (latest, approved, or specific version)
- Select specific chapters to export

### 9. Prompt Library
- **Template Management**: Create, edit, and version prompt templates
- **Scope Control**: Global prompts vs. project-specific overrides
- **Version History**: Track all changes with changelog
- **Test Sandbox**: Test prompts with sample data
- **Tags & Categories**: Organize by genre, workflow stage, etc.
- **Seed Function**: Load default prompts for all agents

---

## Writing Pipeline

The GenAI Book Studio workflow follows a structured 8-step process:

```
1. Book Brief → Define project scope, audience, and goals
              ↓
2. Audience & Voice → Refine target reader and writing style
              ↓
3. Outline / TOC → Generate and approve table of contents
              ↓ (Approval Gate)
4. Chapter Plan → Detail each chapter's structure
              ↓
5. Draft Chapters → Write first drafts (AI-assisted or manual)
              ↓
6. Revision Passes → Developmental → Line → Copy → Proof
              ↓
7. Consistency & Style → Final continuity check
              ↓
8. Export → Generate final book files
```

**Gates & Validation:**
- TOC must be approved before chapter drafting
- Each editorial pass can be run independently or in sequence
- Version control allows reverting to any previous state

---

## Multi-Agent System

The orchestrator manages specialized AI agents for different writing tasks:

### Agent Roles

| Agent | Purpose | Default Model | Temperature |
|-------|---------|---------------|-------------|
| **Architect** | Transforms raw brief into structured creative brief | GPT-4 Turbo | 0.7 |
| **Outliner** | Generates table of contents from brief | GPT-4 Turbo | 0.8 |
| **Writer** | Writes chapter drafts from plans | GPT-4 Turbo | 0.9 |
| **Developmental Editor** | Performs developmental editing | GPT-4 | 0.5 |
| **Line Editor** | Performs line editing for style/voice | GPT-4 | 0.5 |
| **Copyeditor** | Grammar and consistency checks | GPT-3.5 Turbo | 0.3 |
| **Continuity Analyst** | Checks continuity across chapters | GPT-4 | 0.3 |
| **Fact Checker** | Identifies claims needing verification | GPT-4 | 0.2 |

### Execution Rules

1. **Single Task**: Execute one generation (e.g., draft one chapter)
2. **Batch Run**: Execute multiple tasks sequentially
3. **Queue System**: Queue tasks with status tracking and retry logic
4. **Context Retrieval**: RAG-lite system pulls only relevant context per task

### Orchestration Flow

```
User Request
     ↓
Orchestrator
     ↓
1. Retrieve Context (brief, style guide, relevant chapters)
2. Load Prompt Template (versioned)
3. Compile Prompt with Context Variables
4. Execute AI Completion (OpenAI/Anthropic)
5. Save Run Record (inputs, outputs, metadata)
6. Return Result to User
```

---

## Data Model

### Core Entities

#### Project
Top-level container for a book.
- `title`, `genre`, `tone`, `targetWordCount`, `targetChapters`
- `status`: brief | outline | drafting | revising | exported
- Relationships: Brief, TOCs, Chapters, Prompts, Runs, Comments, StyleGuide

#### Brief
Structured book brief.
- `workingTitle`, `hook`, `targetReader`, `keyPromise`
- `compTitles[]`, `topicsInclude[]`, `topicsExclude[]`
- `tone`, `voice`, `lengthTarget`, `constraints[]`
- `version`, `lockedFields[]`

#### TOC (Table of Contents)
Versioned table of contents.
- `structureJson`: { parts[], chapters[] }
- `version`, `approved`, `approvedAt`, `approvedBy`

#### Chapter
Individual chapter metadata.
- `number`, `title`, `summary`, `status`
- `wordCountTarget`, `pacing`, `pov`, `tense`, `readingLevel`
- Relationships: ChapterPlan, ChapterDrafts, Comments

#### ChapterPlan
Detailed plan for a chapter.
- `goals[]`, `keyPoints[]`, `examples[]`, `transitions`
- `callbacks[]`, `requiredElements`, `continuityConstraints`
- `version`

#### ChapterDraft
Versioned chapter drafts.
- `content`, `version`, `stage` (draft | developmental | line | copy | proof)
- `wordCount`, `diff`, `createdBy`, `createdAt`

#### Prompt
Versioned prompt templates.
- `name`, `description`, `template`
- `scope`: global | project
- `inputSchema`, `outputSchema`
- `version`, `tags[]`, `genre`, `isActive`

#### Run
Execution log of AI generations.
- `agentName`, `promptId`, `promptVersion`
- `inputsJson`, `outputText`
- `model`, `temperature`, `maxTokens`, `tokensUsed`
- `status`: queued | running | completed | failed
- `startedAt`, `completedAt`, `error`

#### Comment
User annotations and suggestions.
- `text`, `rangeStart`, `rangeEnd`
- `type`: comment | suggestion | flag
- `resolved`, `resolvedBy`, `resolvedAt`

#### StyleGuide
Project-level writing guidelines.
- `content`, `glossary`, `characterBible`
- `continuityNotes`, `preferredUsage`
- `bannedWords[]`, `writingRules[]`
- `version`

### Relationships Diagram

```
Project
  ├── Brief (1:1)
  ├── TOCs (1:N, versioned)
  ├── Chapters (1:N)
  │     ├── ChapterPlan (1:1, versioned)
  │     ├── ChapterDrafts (1:N, versioned)
  │     └── Comments (1:N)
  ├── StyleGuide (1:1, versioned)
  ├── Prompts (1:N, project-specific)
  └── Runs (1:N, execution log)
```

---

## Prompt Library

### Default Prompts Included

1. **brief-structuring**: Transforms raw input into structured creative brief
2. **toc-generation**: Generates table of contents from brief
3. **chapter-planning**: Creates detailed plan for a single chapter
4. **chapter-drafting**: Writes chapter draft from plan
5. **developmental-edit**: Performs developmental editing pass
6. **line-edit**: Performs line editing for style and voice
7. **copyedit**: Performs copyediting for grammar and consistency
8. **continuity-check**: Checks for continuity across chapters
9. **fact-check**: Identifies claims that need verification

### Prompt Template Syntax

Prompts use `{{variable}}` syntax for context variables:

```
You are an expert {{agentName}}.

Book Context:
Title: {{brief.workingTitle}}
Genre: {{customVariables.genre}}
Tone: {{brief.tone}}

Style Guide:
{{styleGuide.content}}

Task: Write Chapter {{chapter.number}} - {{chapter.title}}

Instructions: ...
```

### Creating Custom Prompts

1. Navigate to **Prompt Library**
2. Click "Create New Prompt" (or edit existing)
3. Define:
   - Name (e.g., "mystery-chapter-opening")
   - Description
   - Template with {{variables}}
   - Scope (global or project-specific)
   - Tags (genre, workflow stage)
4. Test with sample data
5. Save (creates version 1)

Updates create new versions while preserving history.

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **AWS Account** (for Amplify backend)
- **OpenAI API Key** (or Anthropic API key for Claude models)

### 1. Clone Repository

```bash
git clone <repository-url>
cd amplify-vite-react
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Amplify Backend

```bash
npx ampx sandbox
```

This starts the Amplify sandbox environment, which deploys:
- **Cognito** for authentication
- **DynamoDB** tables for data storage
- **AppSync** GraphQL API

### 4. Set Environment Variables

Create `.env` file in project root:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
# OR
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 5. Seed Default Prompts

On first run, navigate to **Prompt Library** and click "Seed Default Prompts" to load the built-in prompt templates.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_OPENAI_API_KEY` | Yes* | OpenAI API key for GPT models |
| `VITE_ANTHROPIC_API_KEY` | Yes* | Anthropic API key for Claude models |

*At least one AI provider key is required. The app defaults to OpenAI.

**Security Note**: Never commit API keys to version control. Use environment variables or AWS Secrets Manager in production.

---

## Running Locally

### Development Mode

```bash
npm run dev
```

App runs at `http://localhost:5173`

The Amplify sandbox must be running concurrently:

```bash
npx ampx sandbox
```

### Build for Production

```bash
npm run build
```

Outputs to `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## Deployment

### Deploy to AWS Amplify Hosting

1. **Connect Repository** to AWS Amplify Console
2. **Configure Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
   ```
3. **Set Environment Variables** in Amplify Console:
   - `VITE_OPENAI_API_KEY`
4. **Deploy**: Amplify auto-deploys on git push

### Alternative: Deploy to Vercel/Netlify

GenAI Book Studio can deploy to any static hosting service:

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Ensure environment variables are set in the hosting platform's dashboard.

---

## Security & Permissions

### Authentication

- **AWS Cognito** handles user authentication
- Email/password login (can extend to OAuth/Google)
- User sessions managed automatically

### Authorization Rules

All data models use **owner-based authorization**:

```typescript
.authorization((allow) => [
  allow.owner(),
  allow.authenticated().to(['read'])
])
```

- **Owner**: Full CRUD on their own projects
- **Authenticated**: Read access to other users' public data

### API Key Security

- API keys stored in **environment variables** only
- Never stored in database
- Backend services retrieve keys from environment

### Production Recommendations

1. Use **AWS Secrets Manager** for API keys
2. Enable **CloudFront** for CDN and DDoS protection
3. Configure **CORS** restrictions
4. Enable **MFA** for admin accounts
5. Regular **security audits** of dependencies

---

## Cost Controls

### Token Usage Tracking

Every AI generation is logged in the **Run** table:
- `tokensUsed`: Actual tokens consumed
- `estimatedCost`: Calculated cost in USD
- Aggregated by project, agent, and date

### Cost Estimates Before Execution

Before batch runs, the app estimates token usage based on:
- Average prompt length
- Target word count
- Historical usage patterns

### Rate Limiting

Configure hard caps in orchestrator:

```typescript
const MAX_TOKENS_PER_PROJECT_PER_DAY = 100000;
const MAX_COST_PER_PROJECT = 50.00; // USD
```

### Model Selection

Choose cost-effective models per agent:
- **Copyeditor**: GPT-3.5 Turbo ($0.002/1K tokens)
- **Writer**: GPT-4 Turbo ($0.01-0.03/1K tokens)

### Observability

- **Run History**: View all generations with timestamps, costs
- **Daily Usage Reports**: Aggregated token usage per day
- **Project Cost Summary**: Total cost per project

---

## Known Limitations

1. **RAG-lite Context**: Currently uses simple artifact retrieval, not full vector search. Advanced semantic search can be added via Pinecone/Weaviate.

2. **Single User per Project**: Projects are owner-only. Team collaboration with roles (Owner, Editor, Viewer) planned for future release.

3. **Export Formatting**: Basic formatting only. Users may need to do final styling in Word/InDesign.

4. **No Real-time Collaboration**: Multiple users can't edit the same chapter simultaneously (planned).

5. **Fact Checking**: The Fact Checker agent identifies claims but doesn't auto-verify them (manual verification required).

6. **Image Support**: No support for illustrations, diagrams, or images in chapters (text-only).

---

## Roadmap

### Short Term (v1.1)
- [ ] Diff viewer with side-by-side comparison
- [ ] Chapter Plan editor UI
- [ ] Revision Passes UI with accept/reject suggestions
- [ ] Continuity & Style checker UI
- [ ] Sample project with demo book

### Medium Term (v1.2)
- [ ] Team collaboration (Owner, Editor, Viewer roles)
- [ ] Real-time co-editing with WebSockets
- [ ] Advanced analytics dashboard (token usage, productivity metrics)
- [ ] Integration with Grammarly/ProWritingAid APIs
- [ ] Custom AI model fine-tuning per project

### Long Term (v2.0)
- [ ] Full vector search for RAG (Pinecone integration)
- [ ] Support for illustrations and diagrams
- [ ] Multi-language support
- [ ] Publishing platform integrations (Amazon KDP, IngramSpark)
- [ ] Mobile app (React Native)

---

## Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router (routing)
- AWS Amplify UI Components

**Backend:**
- AWS Amplify Gen 2
- Amazon Cognito (auth)
- AWS AppSync (GraphQL API)
- Amazon DynamoDB (database)

**AI Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3 - optional)

**Libraries:**
- `@hello-pangea/dnd` (drag & drop)
- `docx` (Word export)
- `jspdf` (PDF export)
- `react-markdown` (Markdown rendering)

### Folder Structure

```
amplify-vite-react/
├── amplify/
│   ├── auth/resource.ts         # Cognito config
│   ├── data/resource.ts         # Data schema
│   └── backend.ts               # Backend definition
├── src/
│   ├── components/              # React components
│   │   ├── brief/
│   │   ├── toc/
│   │   ├── chapter/
│   │   ├── prompts/
│   │   └── export/
│   ├── pages/                   # Page components
│   │   ├── Dashboard.tsx
│   │   ├── ProjectWorkspace.tsx
│   │   ├── PromptLibrary.tsx
│   │   └── Onboarding.tsx
│   ├── services/                # Business logic
│   │   ├── aiProvider.ts        # AI API abstraction
│   │   ├── orchestrator.ts      # Multi-agent orchestration
│   │   ├── promptService.ts     # Prompt management
│   │   ├── contextService.ts    # RAG-lite context retrieval
│   │   └── exportService.ts     # Export to DOCX/PDF/MD
│   ├── types/                   # TypeScript types
│   ├── constants/               # App constants
│   ├── utils/                   # Utility functions
│   ├── data/                    # Seed data
│   │   └── defaultPrompts.ts
│   ├── styles/                  # CSS files
│   └── App.tsx                  # Root component
├── package.json
├── vite.config.ts
└── README.md
```

---

## Support & Contributing

**Issues:** Report bugs or request features via GitHub Issues

**Contributing:** Pull requests welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit PR with description of changes

**License:** MIT-0 (see LICENSE file)

---

## Credits

Built with:
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [React](https://react.dev/)
- [OpenAI](https://openai.com/)
- [Anthropic](https://www.anthropic.com/)

---

**GenAI Book Studio** - Empowering authors to create better books, faster.