import React from 'react';
import { ChevronRight, ExternalLink, Globe, Menu } from 'lucide-react';
import { PageType, ProjectItem } from '../types';

interface HeaderProps {
  currentPage: PageType;
  currentProject: ProjectItem | null;
  projects: ProjectItem[];
  onSelectProject: (project: ProjectItem) => void;
  onNavigate: (page: PageType) => void;
  onOpenMobileNav?: () => void;
}

const labels: Partial<Record<PageType, string>> = {
  overview: 'Overview', projects: 'Projects', issues: 'Issues', autofix: 'Autofix',
  'viewport-lab': 'Viewport Lab', deployments: 'Deployments', activity: 'Activity',
  settings: 'Settings', billing: 'Billing', setup: 'Setup & SDK',
};

export const Header: React.FC<HeaderProps> = ({
  currentPage, currentProject, projects, onSelectProject, onNavigate, onOpenMobileNav,
}) => (
  <header id="app-header" className="h-14 border-b border-[#0B0B0B]/10 bg-[#F5F3EE] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 w-full">
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-[#0B0B0B]/60 min-w-0 flex-1 mr-2">
      {onOpenMobileNav && (
        <button type="button" onClick={onOpenMobileNav} aria-label="Open navigation menu"
          className="lg:hidden p-1.5 -ml-1 text-[#0B0B0B] hover:bg-[#0B0B0B]/5 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center">
          <Menu className="w-4 h-4" />
        </button>
      )}
      <button type="button" onClick={() => onNavigate('projects')} className="hidden sm:inline hover:text-[#0B0B0B]">Projects</button>
      <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-[#0B0B0B]/30" />
      {projects.length > 0 ? (
        <select aria-label="Active Project" value={currentProject?.id ?? ''}
          onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); if (project) onSelectProject(project); }}
          className="bg-transparent text-[#0B0B0B] font-medium font-mono text-xs focus:outline-none border-b border-dashed border-[#0B0B0B]/30 max-w-[180px] truncate">
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name} ({project.environment})</option>)}
        </select>
      ) : <span className="text-[#0B0B0B]/50">No project selected</span>}
      {currentPage !== 'overview' && <><ChevronRight className="w-3.5 h-3.5 text-[#0B0B0B]/30" /><span className="text-[#0B0B0B] font-medium truncate">{labels[currentPage] ?? 'Dashboard'}</span></>}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <button type="button" onClick={() => onNavigate('landing')}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#0B0B0B]/70 hover:text-[#0B0B0B] min-h-[32px]">
        <Globe className="w-3.5 h-3.5" /><span className="hidden sm:inline">Landing Page</span>
      </button>
      {currentProject?.url && <a href={currentProject.url} target="_blank" rel="noreferrer" className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-[#0B0B0B]/70">
        <span className="truncate max-w-[120px]">{currentProject.url.replace(/^https?:\/\//, '')}</span><ExternalLink className="w-3 h-3" />
      </a>}
    </div>
  </header>
);
