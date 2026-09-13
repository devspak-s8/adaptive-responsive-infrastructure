import {
  canCreateProject,
  canGenerateRecommendation,
  canUseAutofix,
  canUseDeploymentMonitoring,
  getPlanLimits,
  hasExceededSessionLimit,
  type PlanId,
} from '../src/config/plans.js';

export type ServerPlan = 'FREE' | 'DEVELOPER' | 'AUTOPILOT';

export interface Entitlements {
  plan: PlanId;
  projectLimit: number;
  monthlySessions: number;
  codeRecommendations: number;
  historyDays: number;
  autofix: boolean;
  deploymentMonitoring: boolean;
  automaticRollback: boolean;
  verification: boolean;
}

export interface EntitlementSource {
  plan: ServerPlan;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
  currentPeriodEnd?: Date | null;
}

const effectivePlan = (source: EntitlementSource): PlanId => {
  // A canceled paid subscription remains effective until its paid period ends.
  if (source.status === 'CANCELED' && source.currentPeriodEnd && source.currentPeriodEnd > new Date()) {
    return source.plan.toLowerCase() as PlanId;
  }
  if (source.status === 'ACTIVE' || source.status === 'TRIALING' || source.status === 'PAST_DUE') {
    return source.plan.toLowerCase() as PlanId;
  }
  return 'free';
};

export const getEntitlements = (source: EntitlementSource): Entitlements => {
  const plan = effectivePlan(source);
  const limits = getPlanLimits(plan);
  return {
    plan,
    projectLimit: limits.projects,
    monthlySessions: limits.monthlySessions,
    codeRecommendations: limits.codeRecommendations,
    historyDays: limits.historyDays,
    autofix: limits.autofix,
    deploymentMonitoring: limits.deploymentMonitoring,
    automaticRollback: limits.automaticRollback,
    verification: limits.verification,
  };
};

export class EntitlementError extends Error {
  constructor(public readonly code: 'PLAN_PROJECT_LIMIT_REACHED' | 'FEATURE_NOT_AVAILABLE' | 'SESSION_LIMIT_REACHED' | 'RECOMMENDATION_LIMIT_REACHED') {
    super(code);
    this.name = 'EntitlementError';
  }
}

export const assertCanCreateProject = (entitlements: Entitlements, currentProjectCount: number): void => {
  if (!canCreateProject(entitlements.plan, currentProjectCount)) throw new EntitlementError('PLAN_PROJECT_LIMIT_REACHED');
};

export const assertCanUseAutofix = (entitlements: Entitlements): void => {
  if (!canUseAutofix(entitlements.plan)) throw new EntitlementError('FEATURE_NOT_AVAILABLE');
};

export const assertCanUseDeploymentMonitoring = (entitlements: Entitlements): void => {
  if (!canUseDeploymentMonitoring(entitlements.plan)) throw new EntitlementError('FEATURE_NOT_AVAILABLE');
};

export const assertUsageAvailable = (entitlements: Entitlements, monitoredSessions: number): void => {
  if (hasExceededSessionLimit(entitlements.plan, monitoredSessions)) throw new EntitlementError('SESSION_LIMIT_REACHED');
};

export const assertCanGenerateRecommendation = (entitlements: Entitlements, generatedThisPeriod: number): void => {
  if (!canGenerateRecommendation(entitlements.plan, generatedThisPeriod)) throw new EntitlementError('RECOMMENDATION_LIMIT_REACHED');
};
