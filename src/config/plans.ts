export type PlanId = 'free' | 'developer' | 'autopilot';

export type PlanFeature =
  | 'autofix'
  | 'deploymentMonitoring'
  | 'automaticRollback'
  | 'runtimeAdaptation';

export interface PlanLimits {
  id: PlanId;
  name: string;
  priceMonthly: number;
  projects: number;
  monthlySessions: number;
  codeRecommendations: number;
  historyDays: number;
  runtimeAdaptation: 'basic' | 'standard' | 'advanced';
  autofix: boolean;
  deploymentMonitoring: boolean;
  automaticRollback: boolean;
  verification: boolean;
}

/**
 * The shared entitlement contract. The server must use this same contract when
 * it evaluates a request; the client copy is for display and interaction only.
 */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    projects: 2,
    monthlySessions: 2_500,
    codeRecommendations: 5,
    historyDays: 7,
    runtimeAdaptation: 'basic',
    autofix: false,
    deploymentMonitoring: false,
    automaticRollback: false,
    verification: false,
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    priceMonthly: 5,
    projects: 10,
    monthlySessions: 25_000,
    codeRecommendations: Number.POSITIVE_INFINITY,
    historyDays: 30,
    runtimeAdaptation: 'standard',
    autofix: false,
    deploymentMonitoring: true,
    automaticRollback: false,
    verification: false,
  },
  autopilot: {
    id: 'autopilot',
    name: 'Autopilot',
    priceMonthly: 15,
    projects: Number.POSITIVE_INFINITY,
    monthlySessions: 100_000,
    codeRecommendations: Number.POSITIVE_INFINITY,
    historyDays: 90,
    runtimeAdaptation: 'advanced',
    autofix: true,
    deploymentMonitoring: true,
    automaticRollback: true,
    verification: true,
  },
};

export const getPlanLimits = (plan: PlanId = 'free'): PlanLimits => PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

export const canCreateProject = (plan: PlanId, projectCount: number): boolean =>
  projectCount < getPlanLimits(plan).projects;

export const canUseAutofix = (plan: PlanId): boolean => getPlanLimits(plan).autofix;

export const canUseDeploymentMonitoring = (plan: PlanId): boolean =>
  getPlanLimits(plan).deploymentMonitoring;

export const canGenerateRecommendation = (plan: PlanId, generatedThisPeriod: number): boolean => {
  const allowance = getPlanLimits(plan).codeRecommendations;
  return allowance === Number.POSITIVE_INFINITY || generatedThisPeriod < allowance;
};

export const hasExceededSessionLimit = (plan: PlanId, monitoredSessions: number): boolean =>
  monitoredSessions >= getPlanLimits(plan).monthlySessions;

export const formatMonthlyPrice = (plan: PlanId): string => {
  const price = getPlanLimits(plan).priceMonthly;
  return price === 0 ? '$0' : `$${price}`;
};
