/**
 * Export Service
 *
 * Handles exporting books to various formats (DOCX, PDF, Markdown)
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { ExportOptions, Chapter, ChapterDraft } from '../types';
import { FRONT_MATTER_TEMPLATE, BACK_MATTER_TEMPLATE } from '../constants';

const client = generateClient<Schema>();

export class ExportService {
  /**
   * Export book to specified format
   */
  async exportBook(
    projectId: string,
    options: ExportOptions
  ): Promise<void> {
    // Get project
    const projectResult = await client.models.Project.get({ id: projectId });
    if (!projectResult.data) {
      throw new Error('Project not found');
    }

    const project = projectResult.data;

    // Get chapters
    const chaptersResult = await client.models.Chapter.list({
      filter: { projectId: { eq: projectId } },
    });

    if (!chaptersResult.data || chaptersResult.data.length === 0) {
      throw new Error('No chapters found');
    }

    const chapters = chaptersResult.data.sort((a, b) => (a.number || 0) - (b.number || 0));

    // Get chapter drafts
    const chapterContents = await Promise.all(
      chapters.map(async (chapter) => {
        // Skip if not in selected chapters (if filter provided)
        if (options.selectedChapters && !options.selectedChapters.includes(chapter.id)) {
          return null;
        }

        const draftsResult = await client.models.ChapterDraft.list({
          filter: { chapterId: { eq: chapter.id } },
        });

        if (draftsResult.data && draftsResult.data.length > 0) {
          // Get the appropriate version
          let draft: ChapterDraft;
          if (options.version === 'latest' || !options.version) {
            draft = draftsResult.data.sort((a, b) =>
              (b.version || 0) - (a.version || 0)
            )[0] as ChapterDraft;
          } else {
            const versionNum = parseInt(options.version);
            draft = (draftsResult.data.find(d => d.version === versionNum) ||
              draftsResult.data[0]) as ChapterDraft;
          }

          return {
            chapter: chapter as Chapter,
            content: draft.content || '',
          };
        }

        return null;
      })
    );

    const filteredContents = chapterContents.filter(c => c !== null) as Array<{
      chapter: Chapter;
      content: string;
    }>;

    // Build front matter
    let frontMatter = '';
    if (options.includeFrontMatter) {
      frontMatter = this.compileFrontMatter(
        options.frontMatterTemplate || FRONT_MATTER_TEMPLATE,
        {
          title: project.title || 'Untitled',
          author: 'Author Name',
          dedication: '',
          foreword: '',
        }
      );
    }

    // Build back matter
    let backMatter = '';
    if (options.includeBackMatter) {
      backMatter = this.compileBackMatter(
        options.backMatterTemplate || BACK_MATTER_TEMPLATE,
        {
          aboutAuthor: '',
          resources: '',
          acknowledgments: '',
        }
      );
    }

    // Export based on format
    switch (options.format) {
      case 'docx':
        await this.exportDOCX(project.title || 'Book', frontMatter, filteredContents, backMatter);
        break;
      case 'pdf':
        await this.exportPDF(project.title || 'Book', frontMatter, filteredContents, backMatter);
        break;
      case 'markdown':
        await this.exportMarkdown(project.title || 'Book', frontMatter, filteredContents, backMatter);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Export to DOCX
   */
  private async exportDOCX(
    title: string,
    frontMatter: string,
    chapters: Array<{ chapter: Chapter; content: string }>,
    backMatter: string
  ): Promise<void> {
    const sections: Paragraph[] = [];

    // Add title
    sections.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
      })
    );

    // Add front matter
    if (frontMatter) {
      frontMatter.split('\n').forEach(line => {
        if (line.startsWith('# ')) {
          sections.push(
            new Paragraph({
              text: line.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
            })
          );
        } else if (line.startsWith('## ')) {
          sections.push(
            new Paragraph({
              text: line.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
            })
          );
        } else {
          sections.push(new Paragraph({ text: line }));
        }
      });
    }

    // Add chapters
    chapters.forEach(({ chapter, content }) => {
      // Chapter heading
      sections.push(
        new Paragraph({
          text: `Chapter ${chapter.number}: ${chapter.title}`,
          heading: HeadingLevel.HEADING_1,
        })
      );

      // Chapter content
      content.split('\n').forEach(line => {
        sections.push(new Paragraph({ text: line }));
      });
    });

    // Add back matter
    if (backMatter) {
      backMatter.split('\n').forEach(line => {
        if (line.startsWith('# ')) {
          sections.push(
            new Paragraph({
              text: line.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
            })
          );
        } else if (line.startsWith('## ')) {
          sections.push(
            new Paragraph({
              text: line.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
            })
          );
        } else {
          sections.push(new Paragraph({ text: line }));
        }
      });
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title}.docx`);
  }

  /**
   * Export to PDF
   */
  private async exportPDF(
    title: string,
    frontMatter: string,
    chapters: Array<{ chapter: Chapter; content: string }>,
    backMatter: string
  ): Promise<void> {
    const doc = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Helper to add text with pagination
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const lines = doc.splitTextToSize(text, doc.internal.pageSize.width - 2 * margin);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Add title
    addText(title, 24, true);
    yPosition += 10;

    // Add front matter
    if (frontMatter) {
      frontMatter.split('\n').forEach(line => {
        if (line.startsWith('# ')) {
          addText(line.replace('# ', ''), 18, true);
        } else if (line.startsWith('## ')) {
          addText(line.replace('## ', ''), 14, true);
        } else if (line.trim()) {
          addText(line);
        }
      });
      yPosition += 10;
    }

    // Add chapters
    chapters.forEach(({ chapter, content }) => {
      addText(`Chapter ${chapter.number}: ${chapter.title}`, 16, true);
      yPosition += 5;

      content.split('\n').forEach(line => {
        if (line.trim()) {
          addText(line);
        }
      });
      yPosition += 10;
    });

    // Add back matter
    if (backMatter) {
      backMatter.split('\n').forEach(line => {
        if (line.startsWith('# ')) {
          addText(line.replace('# ', ''), 18, true);
        } else if (line.startsWith('## ')) {
          addText(line.replace('## ', ''), 14, true);
        } else if (line.trim()) {
          addText(line);
        }
      });
    }

    // Save PDF
    doc.save(`${title}.pdf`);
  }

  /**
   * Export to Markdown
   */
  private async exportMarkdown(
    title: string,
    frontMatter: string,
    chapters: Array<{ chapter: Chapter; content: string }>,
    backMatter: string
  ): Promise<void> {
    let markdown = `# ${title}\n\n`;

    // Add front matter
    if (frontMatter) {
      markdown += frontMatter + '\n\n';
    }

    // Add chapters
    chapters.forEach(({ chapter, content }) => {
      markdown += `# Chapter ${chapter.number}: ${chapter.title}\n\n`;
      markdown += content + '\n\n';
    });

    // Add back matter
    if (backMatter) {
      markdown += backMatter + '\n';
    }

    // Save as file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    saveAs(blob, `${title}.md`);
  }

  /**
   * Compile front matter template
   */
  private compileFrontMatter(template: string, variables: Record<string, string>): string {
    let compiled = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      compiled = compiled.replace(placeholder, value);
    });
    return compiled;
  }

  /**
   * Compile back matter template
   */
  private compileBackMatter(template: string, variables: Record<string, string>): string {
    let compiled = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      compiled = compiled.replace(placeholder, value);
    });
    return compiled;
  }
}
