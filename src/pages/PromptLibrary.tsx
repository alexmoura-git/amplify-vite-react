/**
 * Prompt Library Page
 *
 * Manage prompt templates with versioning
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Prompt } from '../types';
import { PromptService } from '../services/promptService';
import { seedDefaultPrompts } from '../utils/seedPrompts';
import '../styles/PromptLibrary.css';

export default function PromptLibrary() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState('');

  const promptService = new PromptService();

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    try {
      const result = await promptService.listPrompts('global');
      setPrompts(result);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedPrompts() {
    try {
      await seedDefaultPrompts();
      loadPrompts();
    } catch (error) {
      console.error('Error seeding prompts:', error);
    }
  }

  function handleEditPrompt(prompt: Prompt) {
    setSelectedPrompt(prompt);
    setEditingTemplate(prompt.template || '');
    setShowEditor(true);
  }

  async function handleSavePrompt() {
    if (!selectedPrompt) return;

    try {
      await promptService.updatePrompt(
        selectedPrompt.id,
        editingTemplate,
        'Updated template'
      );
      setShowEditor(false);
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  }

  if (loading) {
    return <div className="loading">Loading prompts...</div>;
  }

  return (
    <div className="prompt-library">
      <header className="library-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Dashboard
        </button>
        <h1>Prompt Library</h1>
        <button onClick={handleSeedPrompts} className="btn-primary">
          Seed Default Prompts
        </button>
      </header>

      <div className="library-content">
        <div className="prompts-list">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`prompt-card ${selectedPrompt?.id === prompt.id ? 'selected' : ''}`}
              onClick={() => setSelectedPrompt(prompt)}
            >
              <h3>{prompt.name}</h3>
              <p>{prompt.description}</p>
              <div className="prompt-meta">
                <span>v{prompt.version}</span>
                {prompt.tags && (
                  <div className="tags">
                    {prompt.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedPrompt && !showEditor && (
          <div className="prompt-viewer">
            <div className="viewer-header">
              <h2>{selectedPrompt.name}</h2>
              <button onClick={() => handleEditPrompt(selectedPrompt)} className="btn-primary">
                Edit
              </button>
            </div>
            <p className="description">{selectedPrompt.description}</p>
            <div className="template-preview">
              <h3>Template</h3>
              <pre>{selectedPrompt.template}</pre>
            </div>
          </div>
        )}

        {showEditor && (
          <div className="prompt-editor">
            <div className="editor-header">
              <h2>Edit: {selectedPrompt?.name}</h2>
              <div>
                <button onClick={handleSavePrompt} className="btn-primary">
                  Save New Version
                </button>
                <button onClick={() => setShowEditor(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
            <textarea
              value={editingTemplate}
              onChange={(e) => setEditingTemplate(e.target.value)}
              className="template-editor"
            />
          </div>
        )}
      </div>
    </div>
  );
}
