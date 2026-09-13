/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityEvent, AutofixRecord, DeploymentItem, PageType, ProjectItem,
  ProjectSettings, ResponsiveIssue, UserSession, ViewportItem,
} from './types';
import { DEFAULT_SETTINGS } from './defaults';
import { getAuthSession, signInWithGitHub as redirectToGitHub, signOut as signOutFromAuth } from './lib/authClient';
import { createProject, fetchDashboardData, saveProjectSettings, updateIssueStatus } from './services/dashboardData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { IssueDetailPanel } from './components/IssueDetailPanel';
import { RegressionModal } from './components/RegressionModal';
import { LoadingState } from './components/common/LoadingState';
import { ErrorState } from './components/common/ErrorState';
import { OverviewView } from './views/OverviewView';
import { IssuesView } from './views/IssuesView';
import { AutofixView } from './views/AutofixView';
import { ProjectsView } from './views/ProjectsView';
import { SetupView } from './views/SetupView';
import { DeploymentsView } from './views/DeploymentsView';
import { ActivityView } from './views/ActivityView';
import { SettingsView } from './views/SettingsView';
import { ViewportLabView } from './views/ViewportLabView';
import { LoginView } from './views/LoginView';
import { AuthErrorView } from './views/AuthErrorView';
import { LandingView } from './views/LandingView';
import { PricingView } from './views/PricingView';
import { DocsView } from './views/DocsView';
import { BillingView } from './views/BillingView';
import type { PlanId } from './config/plans';

const routeByPath: Record<string, PageType> = {
  '/': 'landing', '/pricing': 'pricing', '/docs': 'docs', '/login': 'login', '/auth/error': 'auth-error',
  '/dashboard': 'overview', '/overview': 'overview', '/projects': 'projects', '/issues': 'issues', '/autofix': 'autofix',
  '/viewport-lab': 'viewport-lab', '/deployments': 'deployments', '/activity': 'activity',
  '/settings': 'settings', '/billing': 'billing', '/billing/success': 'billing', '/setup': 'setup',
};

const pathByRoute: Record<PageType, string> = Object.fromEntries(
  Object.entries(routeByPath).map(([path, page]) => [page, path]),
) as Record<PageType, string>;
pathByRoute.overview = '/dashboard';
pathByRoute.billing = '/billing';

const pageFromLocation = () => routeByPath[window.location.pathname] ?? 'landing';
const publicPages = new Set<PageType>(['landing', 'pricing', 'docs', 'login', 'auth-error']);

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>(() => pageFromLocation());
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(null);
  const [viewports, setViewports] = useState<ViewportItem[]>([]);
  const [issues, setIssues] = useState<ResponsiveIssue[]>([]);
  const [autofixes, setAutofixes] = useState<AutofixRecord[]>([]);
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [selectedIssue, setSelectedIssue] = useState<ResponsiveIssue | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentItem | null>(null);
  const [autofixActive, setAutofixActive] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);

  const navigate = useCallback((page: PageType) => {
    setCurrentPage(page);
    const path = pathByRoute[page];
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
  }, []);

  useEffect(() => {
    const handlePopState = () => setCurrentPage(pageFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const labels: Record<PageType, string> = {
      landing: 'Adaptive | Responsive Infrastructure', pricing: 'Pricing | Adaptive', docs: 'Docs | Adaptive',
      login: 'Sign in | Adaptive', 'auth-error': 'Server error | Adaptive', overview: 'Overview | Adaptive', projects: 'Projects | Adaptive',
      issues: 'Issues | Adaptive', autofix: 'Autofix | Adaptive', 'viewport-lab': 'Viewport Lab | Adaptive',
      deployments: 'Deployments | Adaptive', activity: 'Activity | Adaptive', settings: 'Settings | Adaptive', billing: 'Billing | Adaptive',
      setup: 'Setup & SDK | Adaptive',
    };
    document.title = labels[currentPage];
  }, [currentPage]);

  const applySession = useCallback((session: UserSession | null) => {
    if (session?.isAuthenticated) {
      setUserSession(session);
      navigate(currentPage === 'landing' || currentPage === 'login' || currentPage === 'auth-error' ? 'overview' : currentPage);
    } else {
      setUserSession(null);
      if (!publicPages.has(currentPage)) navigate('login');
      setProjects([]);
      setCurrentProject(null);
      setViewports([]);
      setIssues([]);
      setAutofixes([]);
      setDeployments([]);
      setActivities([]);
    }
  }, [currentPage, navigate]);

  useEffect(() => {
    let mounted = true;
    getAuthSession().then((session) => {
      if (mounted) applySession(session);
    }).catch((error) => {
      if (mounted) {
        setAuthError(error instanceof Error ? error.message : 'Authentication service is unavailable.');
        applySession(null);
      }
    }).finally(() => { if (mounted) setAuthLoading(false); });
    return () => { mounted = false; };
  }, [applySession]);

  const loadData = useCallback(async (projectId?: string) => {
    if (!userSession) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const data = await fetchDashboardData(projectId);
      setProjects(data.projects);
      const selected = data.projects.find((project) => project.id === projectId) ?? data.projects[0] ?? null;
      setCurrentProject(selected);
      setViewports(data.viewports);
      setIssues(data.issues);
      setAutofixes(data.autofixes);
      setDeployments(data.deployments);
      setActivities(data.activities);
      setSettings(data.settings ?? DEFAULT_SETTINGS);
      setAutofixActive(data.settings?.autofixEnabled ?? false);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'The dashboard request failed.');
    } finally {
      setDataLoading(false);
    }
  }, [userSession]);

  useEffect(() => {
    if (userSession) void loadData();
  }, [userSession, loadData]);

  useEffect(() => {
    if (!userSession) {
      setCurrentPlan(null);
      return;
    }
    fetch('/api/billing/status', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Billing status unavailable');
        return response.json() as Promise<{ plan?: PlanId }>;
      })
      .then((payload) => setCurrentPlan(payload.plan ?? null))
      .catch(() => setCurrentPlan(null));
  }, [userSession]);

  useEffect(() => {
    if (!authLoading && !userSession && !publicPages.has(currentPage)) navigate('login');
  }, [authLoading, userSession, currentPage, navigate]);

  const signInWithGitHub = async () => {
    setAuthError(null);
    try {
      await redirectToGitHub();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'GitHub sign in is unavailable.');
    }
  };

  const signOut = async () => {
    try {
      await signOutFromAuth();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign out failed.');
    }
    setUserSession(null);
    navigate('landing');
  };

  const handleCreateProject = async (name: string, environment: ProjectItem['environment'], url: string) => {
    if (!userSession) return false;
    try {
      const project = await createProject(name, environment, url);
      await loadData(project.id);
      navigate('overview');
      return true;
    } catch (error) {
      return error instanceof Error ? error.message : 'The project could not be created.';
    }
  };

  const updateIssue = async (id: string, status: ResponsiveIssue['status']) => {
    try {
      await updateIssueStatus(id, status);
      setIssues((items) => items.map((issue) => issue.id === id ? { ...issue, status } : issue));
      setSelectedIssue(null);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'The issue could not be updated.');
    }
  };

  if (authLoading && !publicPages.has(currentPage)) return <LoadingState label="Checking session…" />;
  if (!authLoading && !userSession && !publicPages.has(currentPage)) return <LoadingState label="Redirecting to sign in…" />;

  if (currentPage === 'landing') {
    return <LandingView onNavigate={navigate} userSession={userSession} />;
  }
  if (currentPage === 'pricing') {
    return <PricingView onNavigate={navigate} userSession={userSession} />;
  }
  if (currentPage === 'docs') {
    return <DocsView onNavigate={navigate} userSession={userSession} />;
  }
  if (currentPage === 'login') {
    return <LoginView onNavigate={navigate} onSignIn={signInWithGitHub} loading={authLoading} error={authError} />;
  }
  if (currentPage === 'auth-error') {
    return <AuthErrorView onNavigate={navigate} />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F5F3EE] text-[#0B0B0B] flex flex-row antialiased selection:bg-[#0B0B0B] selection:text-[#F5F3EE] max-w-full">
      <Sidebar currentPage={currentPage} onNavigate={navigate}
        openIssuesCount={issues.filter((issue) => issue.status === 'Open').length}
        autofixActive={Boolean(currentProject) && autofixActive} onShowLogin={signOut}
        isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} userSession={userSession} />
      <div className="flex-1 flex flex-col min-w-0 h-screen h-[100dvh] overflow-y-auto max-w-full">
        <Header currentPage={currentPage} currentProject={currentProject} projects={projects}
          onSelectProject={(project) => { setCurrentProject(project); void loadData(project.id); }} onNavigate={navigate} onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 min-w-0 max-w-full safe-bottom">
          {dataLoading ? <LoadingState /> : dataError ? <ErrorState message={dataError} onRetry={() => void loadData(currentProject?.id)} /> : <>
            {currentPage === 'overview' && <OverviewView project={currentProject} viewports={viewports} issues={issues}
              autofixCount={autofixes.length} onNavigate={navigate} onCreateProject={handleCreateProject} onSelectIssue={setSelectedIssue}
              onSelectViewportInLab={() => navigate('viewport-lab')} />}
            {currentPage === 'issues' && <IssuesView issues={issues} onSelectIssue={setSelectedIssue} />}
            {currentPage === 'autofix' && <AutofixView hasProject={Boolean(currentProject)} canUseAutofix={currentPlan === 'autopilot'}
              onUpgrade={() => navigate('pricing')} autofixActive={autofixActive}
              onToggleAutofix={setAutofixActive} autofixes={autofixes} />}
            {currentPage === 'projects' && <ProjectsView projects={projects} currentProjectId={currentProject?.id ?? null}
              onSelectProject={(project) => { setCurrentProject(project); void loadData(project.id); }} onCreateProject={handleCreateProject} />}
            {currentPage === 'setup' && <SetupView project={currentProject} />}
            {currentPage === 'deployments' && <DeploymentsView deployments={deployments}
              canUseDeploymentMonitoring={currentPlan === 'developer' || currentPlan === 'autopilot'}
              onUpgrade={() => navigate('pricing')} onSelectDeployment={setSelectedDeployment} />}
            {currentPage === 'activity' && <ActivityView activities={activities} onOpenIssue={() => navigate('issues')} />}
            {currentPage === 'settings' && <SettingsView settings={settings} onSave={async (next) => {
              if (!currentProject) return;
              try {
                await saveProjectSettings(currentProject.id, next);
                setSettings(next);
                setCurrentProject({ ...currentProject, name: next.projectName, url: next.productionUrl, environment: next.environment as ProjectItem['environment'] });
              } catch (error) {
                setDataError(error instanceof Error ? error.message : 'Settings could not be saved.');
              }
            }} />}
            {currentPage === 'viewport-lab' && <ViewportLabView onSelectIssue={setSelectedIssue} activeIssues={issues} autofixActive={autofixActive} />}
            {currentPage === 'billing' && <BillingView onNavigate={navigate} />}
          </>}
        </main>
      </div>
      <IssueDetailPanel issue={selectedIssue} onClose={() => setSelectedIssue(null)}
        onApplyFix={(id) => void updateIssue(id, 'Autofixed')}
        onIgnore={(id) => void updateIssue(id, 'Ignored')}
        onMarkResolved={(id) => void updateIssue(id, 'Resolved')}
        onViewInLab={() => { setSelectedIssue(null); navigate('viewport-lab'); }} />
      <RegressionModal deployment={selectedDeployment} onClose={() => setSelectedDeployment(null)} onOpenIssue={() => undefined} />
    </div>
  );
}
