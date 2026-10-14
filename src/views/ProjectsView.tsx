import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight, ExternalLink, X, ArrowRight } from 'lucide-react';
import { PageType, ProjectItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { CustomSelect } from '../components/common/CustomSelect';

interface ProjectsViewProps {
  projects: ProjectItem[];
  currentProjectId: string | null;
  onSelectProject: (p: ProjectItem) => void;
  onCreateProject: (name: string, env: 'Production' | 'Staging' | 'Preview', url: string) => Promise<boolean | string> | boolean | string;
  onNavigate: (page: PageType) => void;
  projectLimit: number | null;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
  onNavigate,
  projectLimit,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [newProjectEnv, setNewProjectEnv] = useState<'Production' | 'Staging' | 'Preview'>('Production');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const projectLimitReached = projectLimit !== null && projects.length >= projectLimit;

  useEffect(() => {
    if (!showModal) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating) setShowModal(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showModal, isCreating]);

  const openCreateModal = () => {
    setCreateError('');
    setShowModal(true);
  };

  const closeCreateModal = () => {
    if (!isCreating) setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || projectLimitReached || !newProjectName.trim() || !newProjectUrl.trim()) return;
    setCreateError('');
    setIsCreating(true);
    try {
      const created = await onCreateProject(newProjectName.trim(), newProjectEnv, newProjectUrl.trim());
      if (created !== true) {
        setCreateError(typeof created === 'string' ? created : 'The project could not be created.');
        return;
      }
      setShowModal(false);
      setNewProjectName('');
      setNewProjectUrl('');
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'The project could not be created.');
    } finally {
      setIsCreating(false);
    }
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
          onClick={openCreateModal}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 transition-colors min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Refined Data List (NOT giant cards) */}
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Connect your first application to begin monitoring responsive behavior."
          actionLabel="New Project" onAction={openCreateModal} />
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
        <div className="modal-layer fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom">
          <div 
            onClick={closeCreateModal}
            aria-hidden="true"
            className="modal-backdrop fixed inset-0 bg-[#0B0B0B]/40 transition-opacity"
          />

          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            aria-describedby="new-project-description"
            aria-busy={isCreating}
            className="modal-panel relative w-full max-w-md bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-lg shadow-2xl p-5 sm:p-6 z-10 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#0B0B0B]/10">
              <div>
                <h3 id="new-project-title" className="text-base sm:text-lg font-semibold text-[#0B0B0B]">New Monitored Project</h3>
                <p id="new-project-description" className="mt-1 text-[11px] font-mono text-[#0B0B0B]/55">Connect a production URL to begin observing it.</p>
              </div>
              <button 
                type="button"
                onClick={closeCreateModal}
                aria-label="Close modal"
                disabled={isCreating}
                className="p-1.5 -mr-1 rounded text-[#0B0B0B]/40 hover:text-[#0B0B0B] disabled:opacity-40 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              {projectLimitReached ? (
                <div role="alert" className="space-y-3 rounded-md border border-[#0B0B0B]/15 bg-[#0B0B0B]/[0.03] p-3 text-[#0B0B0B]/70">
                  <p>You have reached your current plan&apos;s project limit. Please upgrade for more projects.</p>
                  <button type="button" onClick={() => { setShowModal(false); onNavigate('pricing'); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B0B0B] underline underline-offset-4">
                    View plans <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : createError && <div role="status" className="p-3 border border-[#0B0B0B]/15 rounded-md text-[#0B0B0B]/60">{createError}</div>}
              {!projectLimitReached && (
                <>
              <div>
                <label className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Portal"
                  autoFocus
                  disabled={isCreating}
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
                  disabled={isCreating}
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[38px]"
                />
              </div>

              <div>
                <label className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
                  Target Environment
                </label>
                <CustomSelect
                  value={newProjectEnv}
                  disabled={isCreating}
                  onChange={(next) => setNewProjectEnv(next as any)}
                  ariaLabel="Target environment"
                  className="w-full"
                  buttonClassName="w-full"
                  options={[
                    { value: 'Production', label: 'Production' },
                    { value: 'Staging', label: 'Staging' },
                    { value: 'Preview', label: 'Preview' },
                  ]}
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                  className="w-full sm:w-auto px-4 py-2 border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] hover:bg-[#0B0B0B]/5 disabled:opacity-40 min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 disabled:opacity-60 min-h-[36px] inline-flex items-center justify-center gap-2"
                >
                  {isCreating && <span className="h-3 w-3 rounded-full border-2 border-[#F5F3EE]/35 border-t-[#F5F3EE] animate-spin" aria-hidden="true" />}
                  {isCreating ? 'Creating project…' : 'Create Project'}
                </button>
              </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
