import React, { useState } from 'react';
import { Plus, ChevronRight, ExternalLink, X } from 'lucide-react';
import { ProjectItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';

interface ProjectsViewProps {
  projects: ProjectItem[];
  currentProjectId: string | null;
  onSelectProject: (p: ProjectItem) => void;
  onCreateProject: (name: string, env: 'Production' | 'Staging' | 'Preview', url: string) => Promise<boolean | string> | boolean | string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [newProjectEnv, setNewProjectEnv] = useState<'Production' | 'Staging' | 'Preview'>('Production');
  const [createError, setCreateError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectUrl.trim()) return;
    const created = await onCreateProject(newProjectName.trim(), newProjectEnv, newProjectUrl.trim());
    if (created !== true) {
      setCreateError(typeof created === 'string' ? created : 'The project could not be created.');
      return;
    }
    setShowModal(false);
    setNewProjectName('');
    setNewProjectUrl('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-16 min-w-0 max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-0.5 sm:mt-1">
            Monitored web applications and frontend environments.
          </p>
        </div>

        <button
          id="new-project-btn"
          type="button"
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 transition-colors min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Refined Data List (NOT giant cards) */}
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Connect your first application to begin monitoring responsive behavior."
          actionLabel="New Project" onAction={() => setShowModal(true)} />
      ) : <div className="border border-[#0B0B0B]/10 rounded-md overflow-hidden bg-[#F5F3EE]">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#0B0B0B]/10 bg-[#0B0B0B]/[0.02] text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                <th className="py-3 px-4 font-normal">Project Name</th>
                <th className="py-3 px-4 font-normal">Environment</th>
                <th className="py-3 px-4 font-normal">Responsive Health</th>
                <th className="py-3 px-4 font-normal">Issues</th>
                <th className="py-3 px-4 font-normal">Runtime Mode</th>
                <th className="py-3 px-4 font-normal">Last Check</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B0B0B]/10 text-xs font-mono">
              {projects.map((proj) => {
                const isCurrent = proj.id === currentProjectId;
                return (
                  <tr
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className={`hover:bg-[#0B0B0B]/[0.03] transition-colors cursor-pointer group ${
                      isCurrent ? 'bg-[#0B0B0B]/[0.02]' : ''
                    }`}
                  >
                    {/* Project Name */}
                    <td className="py-3.5 px-4 font-sans font-medium text-sm text-[#0B0B0B]">
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0B]" title="Active project" />
                        )}
                        <span>{proj.name}</span>
                      </div>
                    </td>

                    {/* Environment */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded border border-[#0B0B0B]/20 text-[#0B0B0B] text-[11px]">
                        {proj.environment}
                      </span>
                    </td>

                    {/* Responsive Health */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-sm text-[#0B0B0B]">
                          {proj.responsiveHealth ?? '—'}
                        </span>
                        {proj.responsiveHealth != null && <span className="text-[10px] text-[#0B0B0B]/40">/ 100</span>}
                      </div>
                    </td>

                    {/* Issues */}
                    <td className="py-3.5 px-4">
                      <span className={proj.issuesCount != null && proj.issuesCount > 0 ? 'font-semibold text-[#0B0B0B]' : 'text-[#0B0B0B]/40'}>
                        {proj.issuesCount == null ? '—' : `${proj.issuesCount} ${proj.issuesCount === 1 ? 'issue' : 'issues'}`}
                      </span>
                    </td>

                    {/* Runtime Mode */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-mono ${
                        proj.runtimeMode === 'Autofix On'
                          ? 'border-[#0B0B0B] text-[#0B0B0B] font-bold bg-[#0B0B0B]/5'
                          : 'border-[#0B0B0B]/30 text-[#0B0B0B]/60'
                      }`}>
                        {proj.runtimeMode}
                      </span>
                    </td>

                    {/* Last Check */}
                    <td className="py-3.5 px-4 text-[#0B0B0B]/60">
                      {proj.lastCheck ?? '—'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[#0B0B0B]/40 group-hover:text-[#0B0B0B] group-hover:underline">
                        Open →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom">
          <div 
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-[#0B0B0B]/40 transition-opacity" 
          />

          <div 
            role="dialog"
            aria-modal="true"
            aria-label="New Monitored Project"
            className="relative w-full max-w-md bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-lg shadow-2xl p-5 sm:p-6 z-10 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#0B0B0B]/10">
              <h3 className="text-base sm:text-lg font-semibold text-[#0B0B0B]">New Monitored Project</h3>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                className="p-1.5 -mr-1 rounded text-[#0B0B0B]/40 hover:text-[#0B0B0B] min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              {createError && <div role="status" className="p-3 border border-[#0B0B0B]/15 rounded-md text-[#0B0B0B]/60">{createError}</div>}
              <div>
                <label className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Portal"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[38px] text-xs sm:text-xs"
                />
              </div>

              <div>
                <label className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
                  Production URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://app.domain.com"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
                  Target Environment
                </label>
                <select
                  value={newProjectEnv}
                  onChange={(e) => setNewProjectEnv(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[38px]"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Preview">Preview</option>
                </select>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] hover:bg-[#0B0B0B]/5 min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 min-h-[36px]"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
