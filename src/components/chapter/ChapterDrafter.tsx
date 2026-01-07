/**
 * Chapter Drafter Component
 *
 * Draft chapters with AI assistance
 */

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Chapter, ChapterDraft } from '../../types';
import { draftChapter } from '../../services/orchestrator';
import { ContextService } from '../../services/contextService';
import { DEFAULT_MODEL_SETTINGS } from '../../constants';
import '../../styles/ChapterDrafter.css';

const client = generateClient<Schema>();

interface ChapterDrafterProps {
  projectId: string;
}

export default function ChapterDrafter({ projectId }: ChapterDrafterProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [draft, setDraft] = useState('');
  const [versions, setVersions] = useState<ChapterDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);

  const contextService = new ContextService();

  useEffect(() => {
    loadChapters();
  }, [projectId]);

  useEffect(() => {
    if (selectedChapter) {
      loadDrafts(selectedChapter.id);
    }
  }, [selectedChapter]);

  async function loadChapters() {
    try {
      const result = await client.models.Chapter.list({
        filter: { projectId: { eq: projectId } },
      });
      if (result.data) {
        const sorted = result.data.sort((a, b) => (a.number || 0) - (b.number || 0));
        setChapters(sorted as Chapter[]);
        if (sorted.length > 0) {
          setSelectedChapter(sorted[0] as Chapter);
        }
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDrafts(chapterId: string) {
    try {
      const result = await client.models.ChapterDraft.list({
        filter: { chapterId: { eq: chapterId } },
      });
      if (result.data) {
        const sorted = result.data.sort((a, b) => (b.version || 0) - (a.version || 0));
        setVersions(sorted as ChapterDraft[]);
        if (sorted.length > 0) {
          setDraft(sorted[0].content || '');
        } else {
          setDraft('');
        }
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }

  async function handleDraftChapter() {
    if (!selectedChapter) return;

    setDrafting(true);
    try {
      const context = await contextService.getChapterDraftContext(projectId, selectedChapter.id);
      const result = await draftChapter(
        projectId,
        selectedChapter.id,
        context,
        DEFAULT_MODEL_SETTINGS
      );

      if (result.success && result.output) {
        // Save draft
        await client.models.ChapterDraft.create({
          chapterId: selectedChapter.id,
          content: result.output,
          version: versions.length + 1,
          stage: 'draft',
          wordCount: result.output.split(/\s+/).length,
          createdAt: new Date().toISOString(),
        });

        setDraft(result.output);
        loadDrafts(selectedChapter.id);
        alert('Chapter drafted successfully!');
      } else {
        alert('Error drafting chapter: ' + result.error);
      }
    } catch (error) {
      console.error('Error drafting chapter:', error);
      alert('Error drafting chapter');
    } finally {
      setDrafting(false);
    }
  }

  async function handleSaveDraft() {
    if (!selectedChapter) return;

    try {
      await client.models.ChapterDraft.create({
        chapterId: selectedChapter.id,
        content: draft,
        version: versions.length + 1,
        stage: 'draft',
        wordCount: draft.split(/\s+/).length,
        createdAt: new Date().toISOString(),
      });

      loadDrafts(selectedChapter.id);
      alert('Draft saved!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft');
    }
  }

  if (loading) {
    return <div className="loading">Loading chapters...</div>;
  }

  if (chapters.length === 0) {
    return (
      <div className="empty-state">
        <h3>No chapters yet</h3>
        <p>Create chapters from the Outline/TOC step first</p>
      </div>
    );
  }

  return (
    <div className="chapter-drafter">
      <aside className="chapters-sidebar">
        <h2>Chapters</h2>
        <div className="chapters-list">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className={`chapter-item ${
                selectedChapter?.id === chapter.id ? 'active' : ''
              }`}
            >
              <span className="chapter-number">{chapter.number}</span>
              <span className="chapter-title">{chapter.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="draft-editor">
        <div className="editor-header">
          <h1>
            Chapter {selectedChapter?.number}: {selectedChapter?.title}
          </h1>
          <div className="actions">
            <button onClick={handleDraftChapter} disabled={drafting} className="btn-secondary">
              {drafting ? 'Drafting...' : 'AI Draft Chapter'}
            </button>
            <button onClick={handleSaveDraft} className="btn-primary">
              Save Draft
            </button>
          </div>
        </div>

        <div className="word-count">Words: {draft.split(/\s+/).filter((w) => w).length}</div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="draft-textarea"
          placeholder="Write your chapter here..."
        />
      </main>

      <aside className="versions-panel">
        <h3>Versions</h3>
        {versions.length === 0 ? (
          <p className="placeholder">No versions yet</p>
        ) : (
          <div className="versions-list">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => setDraft(version.content || '')}
                className="version-item"
              >
                <div className="version-header">
                  <span>v{version.version}</span>
                  <span>{version.stage}</span>
                </div>
                <div className="version-meta">
                  {version.wordCount} words
                  <br />
                  {new Date(version.createdAt || '').toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
