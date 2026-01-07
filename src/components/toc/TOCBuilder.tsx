/**
 * TOC Builder Component
 *
 * Table of contents builder with drag-drop and inline editing
 */

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TOC, TOCStructure, TOCChapter } from '../../types';
import '../../styles/TOCBuilder.css';

const client = generateClient<Schema>();

interface TOCBuilderProps {
  projectId: string;
}

export default function TOCBuilder({ projectId }: TOCBuilderProps) {
  const [toc, setToc] = useState<TOC | null>(null);
  const [structure, setStructure] = useState<TOCStructure>({ chapters: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);

  useEffect(() => {
    loadTOC();
  }, [projectId]);

  async function loadTOC() {
    try {
      const result = await client.models.TOC.list({
        filter: { projectId: { eq: projectId } },
      });
      if (result.data && result.data.length > 0) {
        const latest = result.data.sort((a, b) => (b.version || 0) - (a.version || 0))[0];
        setToc(latest as TOC);
        setStructure(latest.structureJson as TOCStructure);
      }
    } catch (error) {
      console.error('Error loading TOC:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (toc) {
        // Create new version
        await client.models.TOC.create({
          projectId,
          structureJson: structure as any,
          version: (toc.version || 0) + 1,
          approved: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Create first version
        await client.models.TOC.create({
          projectId,
          structureJson: structure as any,
          version: 1,
          approved: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Create chapters in database
      for (const chapter of structure.chapters) {
        const exists = await client.models.Chapter.list({
          filter: {
            projectId: { eq: projectId },
            number: { eq: chapter.number },
          },
        });

        if (!exists.data || exists.data.length === 0) {
          await client.models.Chapter.create({
            projectId,
            number: chapter.number,
            title: chapter.title,
            summary: chapter.summary,
            status: 'planning',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      alert('TOC saved successfully!');
      loadTOC();
    } catch (error) {
      console.error('Error saving TOC:', error);
      alert('Error saving TOC');
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!toc) return;

    try {
      await client.models.TOC.update({
        id: toc.id,
        approved: true,
        approvedAt: new Date().toISOString(),
      });
      alert('TOC approved! You can now proceed to chapter planning.');
      loadTOC();
    } catch (error) {
      console.error('Error approving TOC:', error);
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const items = Array.from(structure.chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Renumber chapters
    const renumbered = items.map((chapter, index) => ({
      ...chapter,
      number: index + 1,
    }));

    setStructure({ ...structure, chapters: renumbered });
  }

  function addChapter() {
    const newChapter: TOCChapter = {
      number: structure.chapters.length + 1,
      title: 'New Chapter',
      summary: '',
      learningObjectives: [],
      takeaways: [],
    };
    setStructure({
      ...structure,
      chapters: [...structure.chapters, newChapter],
    });
    setEditingChapter(newChapter.number);
  }

  function updateChapter(number: number, updates: Partial<TOCChapter>) {
    setStructure({
      ...structure,
      chapters: structure.chapters.map((ch) =>
        ch.number === number ? { ...ch, ...updates } : ch
      ),
    });
  }

  function deleteChapter(number: number) {
    if (!confirm('Delete this chapter?')) return;

    const filtered = structure.chapters.filter((ch) => ch.number !== number);
    const renumbered = filtered.map((ch, index) => ({ ...ch, number: index + 1 }));
    setStructure({ ...structure, chapters: renumbered });
  }

  if (loading) {
    return <div className="loading">Loading TOC...</div>;
  }

  return (
    <div className="toc-builder">
      <div className="editor-header">
        <h1>Table of Contents</h1>
        <div className="actions">
          <button onClick={addChapter} className="btn-secondary">
            + Add Chapter
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save TOC'}
          </button>
          <button
            onClick={handleApprove}
            disabled={!toc || toc.approved}
            className="btn-success"
          >
            {toc?.approved ? '✓ Approved' : 'Approve TOC'}
          </button>
        </div>
      </div>

      {structure.chapters.length === 0 ? (
        <div className="empty-state">
          <p>No chapters yet. Generate a TOC from the Brief step or add chapters manually.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="chapters">
            {(provided) => (
              <div className="chapters-list" {...provided.droppableProps} ref={provided.innerRef}>
                {structure.chapters.map((chapter, index) => (
                  <Draggable
                    key={chapter.number}
                    draggableId={String(chapter.number)}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="chapter-card"
                      >
                        <div className="chapter-header">
                          <div {...provided.dragHandleProps} className="drag-handle">
                            ⋮⋮
                          </div>
                          <span className="chapter-number">Chapter {chapter.number}</span>
                          {editingChapter === chapter.number ? (
                            <input
                              type="text"
                              value={chapter.title}
                              onChange={(e) =>
                                updateChapter(chapter.number, { title: e.target.value })
                              }
                              onBlur={() => setEditingChapter(null)}
                              autoFocus
                              className="chapter-title-input"
                            />
                          ) : (
                            <h3 onClick={() => setEditingChapter(chapter.number)}>
                              {chapter.title}
                            </h3>
                          )}
                          <button
                            onClick={() => deleteChapter(chapter.number)}
                            className="btn-icon"
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          value={chapter.summary}
                          onChange={(e) =>
                            updateChapter(chapter.number, { summary: e.target.value })
                          }
                          placeholder="Chapter summary..."
                          className="chapter-summary"
                          rows={3}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
