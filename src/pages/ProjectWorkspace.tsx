/**
 * Project Workspace Page
 *
 * Main workspace with steps navigation
 */

import { useEffect, useState } from 'react';
import { useParams, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Project } from '../types';
import { PROJECT_STEPS } from '../constants';
import BriefEditor from '../components/brief/BriefEditor';
import TOCBuilder from '../components/toc/TOCBuilder';
import ChapterDrafter from '../components/chapter/ChapterDrafter';
import ExportView from '../components/export/ExportView';
import '../styles/ProjectWorkspace.css';

const client = generateClient<Schema>();

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  async function loadProject(id: string) {
    try {
      const result = await client.models.Project.get({ id });
      if (result.data) {
        setProject(result.data as Project);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCurrentStep() {
    const path = location.pathname;
    const stepId = path.split('/').pop();
    return PROJECT_STEPS.findIndex(s => s.id === stepId);
  }

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  const currentStepIndex = getCurrentStep();

  return (
    <div className="project-workspace">
      <aside className="workspace-sidebar">
        <div className="project-info">
          <button onClick={() => navigate('/')} className="back-button">
            ← Dashboard
          </button>
          <h2>{project.title}</h2>
          <p className="genre">{project.genre}</p>
        </div>

        <nav className="steps-nav">
          {PROJECT_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => navigate(`/project/${projectId}/${step.id}`)}
              className={`step-button ${index === currentStepIndex ? 'active' : ''} ${
                index < currentStepIndex ? 'completed' : ''
              }`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-label">{step.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace-main">
        <Routes>
          <Route path="brief" element={<BriefEditor projectId={projectId!} />} />
          <Route path="audience" element={<div>Audience & Voice (Coming Soon)</div>} />
          <Route path="outline" element={<TOCBuilder projectId={projectId!} />} />
          <Route path="plan" element={<div>Chapter Plan (Coming Soon)</div>} />
          <Route path="draft" element={<ChapterDrafter projectId={projectId!} />} />
          <Route path="revise" element={<div>Revision Passes (Coming Soon)</div>} />
          <Route path="consistency" element={<div>Consistency Check (Coming Soon)</div>} />
          <Route path="export" element={<ExportView projectId={projectId!} />} />
        </Routes>
      </main>

      <aside className="workspace-panel">
        <div className="panel-section">
          <h3>Comments</h3>
          <p className="placeholder">No comments yet</p>
        </div>
        <div className="panel-section">
          <h3>Style Guide</h3>
          <textarea className="style-guide-editor" placeholder="Add style guidelines..."></textarea>
        </div>
      </aside>
    </div>
  );
}
