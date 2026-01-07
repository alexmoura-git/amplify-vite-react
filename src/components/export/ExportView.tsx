/**
 * Export View Component
 *
 * Export book to various formats
 */

import { useState } from 'react';
import { ExportOptions } from '../../types';
import { ExportService } from '../../services/exportService';
import '../../styles/ExportView.css';

interface ExportViewProps {
  projectId: string;
}

export default function ExportView({ projectId }: ExportViewProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'docx',
    includeFrontMatter: false,
    includeBackMatter: false,
    version: 'latest',
  });
  const [exporting, setExporting] = useState(false);

  const exportService = new ExportService();

  async function handleExport() {
    setExporting(true);
    try {
      await exportService.exportBook(projectId, options);
      alert('Book exported successfully!');
    } catch (error) {
      console.error('Error exporting book:', error);
      alert('Error exporting book: ' + (error as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="export-view">
      <div className="export-header">
        <h1>Export Book</h1>
      </div>

      <div className="export-options">
        <div className="option-group">
          <h3>Format</h3>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="format"
                value="docx"
                checked={options.format === 'docx'}
                onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
              />
              Microsoft Word (.docx)
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={options.format === 'pdf'}
                onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
              />
              PDF (.pdf)
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="markdown"
                checked={options.format === 'markdown'}
                onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
              />
              Markdown (.md)
            </label>
          </div>
        </div>

        <div className="option-group">
          <h3>Content Options</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.includeFrontMatter}
              onChange={(e) =>
                setOptions({ ...options, includeFrontMatter: e.target.checked })
              }
            />
            Include front matter (title page, dedication, foreword)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.includeBackMatter}
              onChange={(e) => setOptions({ ...options, includeBackMatter: e.target.checked })}
            />
            Include back matter (about author, resources, acknowledgments)
          </label>
        </div>

        <div className="option-group">
          <h3>Version</h3>
          <select
            value={options.version}
            onChange={(e) => setOptions({ ...options, version: e.target.value })}
            className="select"
          >
            <option value="latest">Latest version of each chapter</option>
            <option value="approved">Last approved version</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary btn-large"
        >
          {exporting ? 'Exporting...' : `Export as ${options.format.toUpperCase()}`}
        </button>
      </div>

      <div className="export-info">
        <h3>Export Information</h3>
        <p>
          Your book will be exported with all selected chapters in the chosen format.
          The export includes:
        </p>
        <ul>
          <li>All chapter content from the selected version</li>
          <li>Chapter headings and numbering</li>
          <li>Front and back matter (if selected)</li>
          <li>Proper formatting for the chosen format</li>
        </ul>
        <p className="note">
          Note: After export, you may want to do final formatting and styling in your
          word processor or publishing software.
        </p>
      </div>
    </div>
  );
}
