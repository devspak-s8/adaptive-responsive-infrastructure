export type PageType = 
  | 'landing'
  | 'login'
  | 'pricing'
  | 'docs'
  | 'overview'
  | 'projects'
  | 'issues'
  | 'autofix'
  | 'viewport-lab'
  | 'deployments'
  | 'activity'
  | 'settings'
  | 'billing'
  | 'setup';

export interface UserSession {
  id: string;
  isAuthenticated: boolean;
  provider: 'github';
  githubLogin: string;
  name: string;
  email: string;
  avatarUrl?: string;
  githubConnectedAt?: string;
}

export type ViewportStatus = 'healthy' | 'warning' | 'broken';

export interface ViewportItem {
  id: string;
  name: string;
  dimensions: string; // e.g. "360 × 800"
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  status: ViewportStatus;
  issuesCount: number;
  lastChecked: string;
}

export type IssueSeverity = 'High' | 'Medium' | 'Low';
export type IssueStatus = 'Open' | 'Autofixed' | 'Resolved' | 'Ignored';

export interface ResponsiveIssue {
  id: string;
  title: string;
  route: string;
  viewport: string;
  element: string;
  severity: IssueSeverity;
  status: IssueStatus;
  detected: string;
  detectedWidth?: string;
  availableWidth?: string;
  cause?: string;
  currentCss?: string;
  recommendedFix?: string;
  category: 'overflow' | 'collision' | 'wrapping' | 'modal' | 'container';
}

export interface AutofixRecord {
  id: string;
  fix: string;
  route: string;
  viewport: string;
  result: 'Verified' | 'Monitoring' | 'Rolled Back';
  time: string;
  diffSummary?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  environment: 'Production' | 'Staging' | 'Preview';
  responsiveHealth: number | null;
  issuesCount: number | null;
  runtimeMode: 'Autofix On' | 'Monitor Only' | 'Disabled';
  lastCheck: string | null;
  url: string;
}

export interface DeploymentItem {
  id: string;
  environment: 'Production' | 'Preview' | 'Staging';
  commit: string;
  branch: string;
  status: 'Passed' | 'Regression detected' | 'Running';
  responsiveScore: number | null;
  time: string;
  previousScore?: number;
  newIssuesCount?: number;
  resolvedIssuesCount?: number;
  regressionDetails?: {
    viewport: string;
    before: string;
    after: string;
    element: string;
  }[];
}

export interface ActivityEvent {
  id: string;
  type: 'autofix' | 'issue' | 'deployment' | 'config' | 'rollback';
  title: string;
  description: string;
  route?: string;
  viewport?: string;
  time: string;
  metadata?: string;
}

export interface ProjectSettings {
  projectName: string;
  productionUrl: string;
  environment: string;
  monitoringEnabled: boolean;
  autofixEnabled: boolean;
  automaticRollback: boolean;
  scanFrequency: 'continuous' | 'hourly' | 'daily';
  notifyRegression: boolean;
  notifyCritical: boolean;
  notifyAutofix: boolean;
  protectionLevel: 'safe' | 'balanced' | 'aggressive';
}
