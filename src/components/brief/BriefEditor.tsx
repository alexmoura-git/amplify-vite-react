/**
 * Brief Editor Component
 *
 * Structured form for creating book brief
 */

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Brief } from '../../types';
import { generateTOC } from '../../services/orchestrator';
import { ContextService } from '../../services/contextService';
import { DEFAULT_MODEL_SETTINGS } from '../../constants';
import '../../styles/BriefEditor.css';

const client = generateClient<Schema>();

interface BriefEditorProps {
  projectId: string;
}

export default function BriefEditor({ projectId }: BriefEditorProps) {
  const [brief, setBrief] = useState<Partial<Brief>>({
    workingTitle: '',
    hook: '',
    targetReader: '',
    keyPromise: '',
    compTitles: [],
    topicsInclude: [],
    topicsExclude: [],
    tone: '',
    voice: '',
    lengthTarget: '',
    constraints: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const contextService = new ContextService();

  useEffect(() => {
    loadBrief();
  }, [projectId]);

  async function loadBrief() {
    try {
      const result = await client.models.Brief.list({
        filter: { projectId: { eq: projectId } },
      });
      if (result.data && result.data.length > 0) {
        setBrief(result.data[0] as Brief);
      }
    } catch (error) {
      console.error('Error loading brief:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await client.models.Brief.list({
        filter: { projectId: { eq: projectId } },
      });

      if (result.data && result.data.length > 0) {
        // Update existing
        await client.models.Brief.update({
          id: result.data[0].id,
          ...brief,
          version: (result.data[0].version || 0) + 1,
        });
      } else {
        // Create new
        await client.models.Brief.create({
          projectId,
          ...brief,
          version: 1,
          createdAt: new Date().toISOString(),
        });
      }
      alert('Brief saved successfully!');
    } catch (error) {
      console.error('Error saving brief:', error);
      alert('Error saving brief');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateTOC() {
    setGenerating(true);
    try {
      const context = await contextService.getTOCContext(projectId);
      const result = await generateTOC(projectId, context, DEFAULT_MODEL_SETTINGS);

      if (result.success) {
        alert('TOC generated successfully! Check the Outline tab.');
      } else {
        alert('Error generating TOC: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating TOC:', error);
      alert('Error generating TOC');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading brief...</div>;
  }

  return (
    <div className="brief-editor">
      <div className="editor-header">
        <h1>Book Brief</h1>
        <div className="actions">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Brief'}
          </button>
          <button onClick={handleGenerateTOC} disabled={generating} className="btn-secondary">
            {generating ? 'Generating...' : 'Generate TOC →'}
          </button>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label>Working Title</label>
          <input
            type="text"
            value={brief.workingTitle || ''}
            onChange={(e) => setBrief({ ...brief, workingTitle: e.target.value })}
            placeholder="The title of your book"
          />
        </div>

        <div className="form-field">
          <label>One-Sentence Hook</label>
          <input
            type="text"
            value={brief.hook || ''}
            onChange={(e) => setBrief({ ...brief, hook: e.target.value })}
            placeholder="A captivating one-sentence description"
          />
        </div>

        <div className="form-field full-width">
          <label>Target Reader</label>
          <textarea
            value={brief.targetReader || ''}
            onChange={(e) => setBrief({ ...brief, targetReader: e.target.value })}
            placeholder="Who is your ideal reader? What are their interests, challenges, etc.?"
            rows={3}
          />
        </div>

        <div className="form-field full-width">
          <label>Key Promise / Transformation</label>
          <textarea
            value={brief.keyPromise || ''}
            onChange={(e) => setBrief({ ...brief, keyPromise: e.target.value })}
            placeholder="What will readers gain from this book?"
            rows={3}
          />
        </div>

        <div className="form-field">
          <label>Tone</label>
          <select
            value={brief.tone || ''}
            onChange={(e) => setBrief({ ...brief, tone: e.target.value })}
          >
            <option value="">Select tone...</option>
            <option value="Professional">Professional</option>
            <option value="Conversational">Conversational</option>
            <option value="Academic">Academic</option>
            <option value="Inspirational">Inspirational</option>
            <option value="Humorous">Humorous</option>
          </select>
        </div>

        <div className="form-field">
          <label>Voice</label>
          <input
            type="text"
            value={brief.voice || ''}
            onChange={(e) => setBrief({ ...brief, voice: e.target.value })}
            placeholder="First person, third person omniscient, etc."
          />
        </div>

        <div className="form-field">
          <label>Length Target</label>
          <input
            type="text"
            value={brief.lengthTarget || ''}
            onChange={(e) => setBrief({ ...brief, lengthTarget: e.target.value })}
            placeholder="e.g., 70,000 words, 25 chapters"
          />
        </div>

        <div className="form-field full-width">
          <label>Topics to Include</label>
          <textarea
            value={brief.topicsInclude?.join('\n') || ''}
            onChange={(e) =>
              setBrief({ ...brief, topicsInclude: e.target.value.split('\n').filter((t) => t) })
            }
            placeholder="One topic per line"
            rows={4}
          />
        </div>

        <div className="form-field full-width">
          <label>Topics to Exclude</label>
          <textarea
            value={brief.topicsExclude?.join('\n') || ''}
            onChange={(e) =>
              setBrief({ ...brief, topicsExclude: e.target.value.split('\n').filter((t) => t) })
            }
            placeholder="One topic per line"
            rows={4}
          />
        </div>

        <div className="form-field full-width">
          <label>Comparable Titles</label>
          <textarea
            value={brief.compTitles?.join('\n') || ''}
            onChange={(e) =>
              setBrief({ ...brief, compTitles: e.target.value.split('\n').filter((t) => t) })
            }
            placeholder="One title per line"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
