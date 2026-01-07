/**
 * Dashboard Page
 *
 * Lists all projects with quick actions
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Project, ProjectStatus } from '../types';
import '../styles/Dashboard.css';

const client = generateClient<Schema>();

export default function Dashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuthenticator();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectGenre, setNewProjectGenre] = useState('Fiction - Literary');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const result = await client.models.Project.list();
      if (result.data) {
        setProjects(result.data as Project[]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!newProjectTitle.trim()) return;

    try {
      const result = await client.models.Project.create({
        title: newProjectTitle,
        genre: newProjectGenre,
        status: ProjectStatus.BRIEF,
        targetWordCount: 70000,
        targetChapters: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (result.data) {
        navigate(`/project/${result.data.id}/brief`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await client.models.Project.delete({ id });
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      brief: '📝 Brief',
      outline: '📋 Outline',
      drafting: '✍️ Drafting',
      revising: '✏️ Revising',
      exported: '✅ Exported',
    };
    return badges[status] || status;
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>GenAI Book Studio</h1>
          <p>Welcome, {user?.signInDetails?.loginId || 'Author'}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/prompts')} className="btn-secondary">
            Prompt Library
          </button>
          <button onClick={signOut} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="projects-header">
          <h2>Your Projects</h2>
          <button onClick={() => setShowNewProject(true)} className="btn-primary">
            + New Project
          </button>
        </div>

        {showNewProject && (
          <div className="new-project-modal">
            <div className="modal-content">
              <h3>Create New Project</h3>
              <input
                type="text"
                placeholder="Project Title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                className="input"
              />
              <select
                value={newProjectGenre}
                onChange={(e) => setNewProjectGenre(e.target.value)}
                className="select"
              >
                <option>Fiction - Literary</option>
                <option>Fiction - Mystery/Thriller</option>
                <option>Fiction - Science Fiction</option>
                <option>Fiction - Fantasy</option>
                <option>Non-Fiction - Self-Help</option>
                <option>Non-Fiction - Business</option>
                <option>Non-Fiction - Biography/Memoir</option>
              </select>
              <div className="modal-actions">
                <button onClick={createProject} className="btn-primary">
                  Create
                </button>
                <button onClick={() => setShowNewProject(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first book project to get started</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.title}</h3>
                  <span className="status-badge">{getStatusBadge(project.status)}</span>
                </div>
                <p className="project-genre">{project.genre}</p>
                <div className="project-meta">
                  <span>Target: {project.targetWordCount?.toLocaleString()} words</span>
                  <span>{project.targetChapters} chapters</span>
                </div>
                <div className="project-actions">
                  <button
                    onClick={() => navigate(`/project/${project.id}/brief`)}
                    className="btn-primary"
                  >
                    Continue Writing
                  </button>
                  <button
                    onClick={() => navigate(`/project/${project.id}/export`)}
                    className="btn-secondary"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
