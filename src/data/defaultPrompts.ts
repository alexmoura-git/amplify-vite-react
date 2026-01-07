/**
 * Default Prompts
 *
 * Seed content with built-in default prompts for all agents and workflows
 * These prompts can be customized per-project or used as-is
 */

export interface DefaultPrompt {
  name: string;
  description: string;
  template: string;
  tags: string[];
  genre?: string;
}

export const DEFAULT_PROMPTS: DefaultPrompt[] = [
  // Brief Structuring
  {
    name: 'brief-structuring',
    description: 'Transforms raw brief input into a structured creative brief',
    template: `You are an expert book architect. Transform the following raw book idea into a structured creative brief.

Raw Input:
{{customVariables.rawInput}}

Create a comprehensive creative brief that includes:
1. Working Title: A compelling working title for the book
2. One-Sentence Hook: A captivating one-sentence description
3. Target Reader: Detailed profile of the ideal reader
4. Key Promise/Transformation: What the reader will gain
5. Comparable Titles: 3-5 similar successful books
6. Topics to Include: Main themes and subjects to cover
7. Topics to Exclude: What to avoid or not emphasize
8. Tone & Voice: The writing style and narrative voice
9. Length Target: Estimated word count and chapter count
10. Constraints: Any special requirements or limitations

Format the output as a structured document with clear sections.`,
    tags: ['brief', 'planning', 'architecture'],
  },

  // TOC Generation - Fiction
  {
    name: 'toc-generation',
    description: 'Generates table of contents from creative brief',
    template: `You are an expert book outliner. Based on the creative brief below, generate a detailed table of contents.

Creative Brief:
Title: {{brief.workingTitle}}
Hook: {{brief.hook}}
Target Reader: {{brief.targetReader}}
Genre: {{customVariables.genre}}
Tone: {{customVariables.tone}}
Target Length: {{brief.lengthTarget}}

Key Topics:
{{brief.topicsInclude}}

Generate a table of contents with:
- {{customVariables.targetChapters}} chapters
- Each chapter should have:
  * Chapter number
  * Compelling chapter title
  * 2-3 paragraph summary of what happens/is covered
  * Key beats, revelations, or learning objectives
  * How it connects to previous and next chapters

For fiction, ensure:
- Clear story arc across chapters
- Rising action and tension
- Character development checkpoints
- Proper pacing

For non-fiction, ensure:
- Logical progression of ideas
- Building on previous concepts
- Clear learning outcomes
- Practical takeaways

Format as JSON with this structure:
{
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "summary": "Detailed summary...",
      "learningObjectives": ["objective 1", "objective 2"],
      "takeaways": ["takeaway 1", "takeaway 2"]
    }
  ]
}`,
    tags: ['toc', 'outline', 'planning'],
  },

  // Chapter Planning
  {
    name: 'chapter-planning',
    description: 'Creates detailed plan for a single chapter',
    template: `You are an expert chapter planner. Create a detailed plan for this chapter.

Chapter Information:
Number: {{chapter.number}}
Title: {{chapter.title}}
Summary: {{chapter.summary}}

Book Context:
Genre: {{customVariables.genre}}
Tone: {{brief.tone}}
Voice: {{brief.voice}}

Style Guide:
{{styleGuide.content}}

Previous Chapter Context:
{{customVariables.previousChapterSummary}}

Next Chapter Context:
{{customVariables.nextChapterSummary}}

Create a comprehensive chapter plan including:

1. Goals: What this chapter must accomplish
2. Key Points: Main ideas, events, or revelations
3. Opening Hook: How to grab attention in the first paragraph
4. Examples/Scenes: Specific examples, scenes, or anecdotes to include
5. Transitions: How to transition from previous chapter and to next
6. Callbacks: References to earlier chapters or setup for later
7. Character Development: (if fiction) How characters evolve
8. Pacing Notes: Where to speed up or slow down
9. Emotional Arc: The emotional journey through the chapter
10. Chapter Ending: How to close with impact

Required Elements:
- Word count target: {{chapter.wordCountTarget}}
- POV: {{chapter.pov}}
- Tense: {{chapter.tense}}
- Reading level: {{chapter.readingLevel}}

Continuity Constraints:
- Character consistency: {{characterBible}}
- Terminology: {{glossary}}
- Timeline: {{customVariables.timeline}}

Provide a detailed, actionable plan that a writer can follow.`,
    tags: ['planning', 'chapter', 'structure'],
  },

  // Chapter Drafting
  {
    name: 'chapter-drafting',
    description: 'Writes chapter draft from plan',
    template: `You are an expert writer. Write a compelling chapter based on the plan below.

Chapter Plan:
{{chapterPlan.content}}

Chapter Details:
Number: {{chapter.number}}
Title: {{chapter.title}}
Target Word Count: {{chapter.wordCountTarget}}
POV: {{chapter.pov}}
Tense: {{chapter.tense}}

Book Context:
Genre: {{customVariables.genre}}
Tone: {{brief.tone}}
Voice: {{brief.voice}}

Style Guide:
{{styleGuide.content}}

Previous Chapter Excerpt (for continuity):
{{customVariables.previousChapterExcerpt}}

Glossary & Terms:
{{glossary}}

Character Bible:
{{characterBible}}

Writing Instructions:
1. Follow the chapter plan closely
2. Maintain consistent voice and tone
3. Use the specified POV and tense
4. Include all key points and scenes from the plan
5. Ensure smooth transitions from previous chapter
6. Build tension and engagement
7. End with appropriate impact for next chapter
8. Stay within 10% of target word count
9. Use terminology from glossary consistently
10. Maintain character consistency

Write the complete chapter now. Focus on engaging prose, vivid descriptions, and emotional resonance.`,
    tags: ['writing', 'chapter', 'draft'],
  },

  // Developmental Edit
  {
    name: 'developmental-edit',
    description: 'Performs developmental editing pass',
    template: `You are an expert developmental editor. Review this chapter for structure, clarity, and impact.

Chapter Content:
{{customVariables.chapterContent}}

Chapter Context:
Number: {{chapter.number}}
Title: {{chapter.title}}
Genre: {{customVariables.genre}}

Book Context:
Target Reader: {{brief.targetReader}}
Key Promise: {{brief.keyPromise}}

Evaluate and provide feedback on:

1. Structure & Flow
   - Does the chapter flow logically?
   - Are transitions smooth?
   - Is the pacing appropriate?

2. Content Quality
   - Are the ideas clear and well-explained?
   - Are arguments convincing?
   - Are examples effective?

3. Reader Engagement
   - Does it hold the reader's attention?
   - Are there boring or slow sections?
   - Does it deliver on the promise?

4. Character Development (if fiction)
   - Do characters feel real and consistent?
   - Is dialogue natural?
   - Are motivations clear?

5. Narrative Arc
   - Does the chapter advance the story/argument?
   - Are there necessary elements missing?
   - Are there redundant sections?

Provide:
- Specific issues with line/paragraph references
- Severity rating (critical/moderate/minor)
- Suggested fixes for each issue
- An overall assessment score (0-100)
- A revised version with improvements (optional)

Format as JSON:
{
  "issues": [
    {
      "location": "paragraph 3",
      "severity": "moderate",
      "issue": "Description...",
      "suggestion": "Fix..."
    }
  ],
  "score": 85,
  "summary": "Overall assessment...",
  "revisedVersion": "Optional full revised text..."
}`,
    tags: ['editing', 'developmental', 'revision'],
  },

  // Line Edit
  {
    name: 'line-edit',
    description: 'Performs line editing for style and voice',
    template: `You are an expert line editor. Polish this chapter for style, voice, and sentence-level quality.

Chapter Content:
{{customVariables.chapterContent}}

Style Guide:
{{styleGuide.content}}

Voice & Tone:
{{brief.voice}}

Focus on:

1. Voice Consistency
   - Is the voice consistent throughout?
   - Does it match the style guide?
   - Are there jarring shifts?

2. Sentence Variety
   - Is there good variety in sentence length?
   - Are there too many similar structures?
   - Is rhythm engaging?

3. Word Choice
   - Are words precise and evocative?
   - Is there unnecessary jargon?
   - Are there clichés to remove?

4. Clarity & Concision
   - Can any sentences be tightened?
   - Are there redundancies?
   - Is meaning always clear?

5. Style Issues
   - Passive voice overuse
   - Weak verbs
   - Adverb overload
   - Show vs. tell balance

Provide:
- Specific line-by-line suggestions
- Before/after examples
- Pattern issues to watch
- Overall style score (0-100)
- Optional: polished version

Format as JSON with detailed suggestions.`,
    tags: ['editing', 'line-edit', 'style'],
  },

  // Copyedit
  {
    name: 'copyedit',
    description: 'Performs copyediting for grammar and consistency',
    template: `You are an expert copyeditor. Review this chapter for grammar, spelling, punctuation, and consistency.

Chapter Content:
{{customVariables.chapterContent}}

Glossary & Preferred Terms:
{{glossary}}

Check for:

1. Grammar & Syntax
   - Subject-verb agreement
   - Pronoun consistency
   - Proper verb tenses
   - Sentence fragments
   - Run-on sentences

2. Spelling & Punctuation
   - Spelling errors
   - Comma usage
   - Apostrophes
   - Quotation marks
   - Capitalization

3. Consistency
   - Character name spelling
   - Place name spelling
   - Term usage (per glossary)
   - Number formatting
   - Hyphenation

4. Technical Issues
   - Formatting inconsistencies
   - Paragraph breaks
   - Dialogue formatting
   - List formatting

Provide:
- Line-by-line corrections
- Pattern issues
- Consistency notes
- Clean copy with corrections

Format as JSON:
{
  "corrections": [
    {
      "line": "paragraph 5, sentence 2",
      "error": "their should be there",
      "correction": "there",
      "category": "spelling"
    }
  ],
  "consistencyIssues": [],
  "cleanVersion": "Corrected full text..."
}`,
    tags: ['editing', 'copyedit', 'grammar'],
  },

  // Continuity Check
  {
    name: 'continuity-check',
    description: 'Checks for continuity and consistency across chapters',
    template: `You are a continuity analyst. Check for inconsistencies across all chapters.

All Chapter Summaries:
{{customVariables.allChapters}}

Character Bible:
{{characterBible}}

Glossary:
{{glossary}}

Continuity Notes:
{{styleGuide.continuityNotes}}

Check for:

1. Character Consistency
   - Name spellings
   - Physical descriptions
   - Personality traits
   - Abilities/skills
   - Relationships

2. Timeline Consistency
   - Event order
   - Time references
   - Age progressions
   - Seasonal references

3. World/Setting Consistency
   - Place descriptions
   - Geography
   - Rules/laws
   - Technology level

4. Plot Consistency
   - Resolved plot threads
   - Dangling setups
   - Contradictions
   - Retcons

5. Terminology Consistency
   - Technical terms
   - Made-up words
   - Capitalization
   - Usage

Provide:
- List of all inconsistencies found
- Severity (critical/moderate/minor)
- Suggested resolutions
- Updated continuity notes

Format as JSON with detailed findings.`,
    tags: ['analysis', 'continuity', 'consistency'],
  },

  // Fact Checking
  {
    name: 'fact-check',
    description: 'Identifies claims that need verification',
    template: `You are a fact checker. Identify all factual claims in this chapter that should be verified.

Chapter Content:
{{customVariables.chapterContent}}

Genre: {{customVariables.genre}}

Identify:

1. Factual Claims
   - Historical facts
   - Scientific claims
   - Statistics
   - Quotes attributed to real people
   - Dates and events

2. Verifiable Details
   - Place descriptions
   - Technical specifications
   - Process descriptions
   - Legal/medical information

3. Risk Level
   - High: Could mislead readers seriously
   - Medium: Should be accurate but not critical
   - Low: Minor details

For each claim:
- Extract the exact claim
- Categorize the type
- Assess risk level
- Suggest verification sources
- Note if claim seems suspicious

Format as JSON:
{
  "claims": [
    {
      "text": "The exact claim...",
      "type": "historical fact",
      "risk": "high",
      "suggestedSources": ["source 1", "source 2"],
      "notes": "Any concerns..."
    }
  ]
}`,
    tags: ['analysis', 'fact-check', 'verification'],
  },
];
