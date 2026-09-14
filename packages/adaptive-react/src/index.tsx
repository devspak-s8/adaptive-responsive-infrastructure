import { useEffect, type ReactNode } from 'react';
import { startAdaptiveRuntime, type AdaptiveRuntimeOptions, type StopAdaptiveRuntime } from '@provenly/adaptive-runtime';

export interface AdaptiveProviderProps extends Omit<AdaptiveRuntimeOptions, 'projectId' | 'runtimeKey' | 'projectKey'> {
  projectId: string;
  runtimeKey: string;
  children: ReactNode;
}

/** React integration for the framework-agnostic Adaptive runtime. */
export const AdaptiveProvider = ({ children, ...runtimeOptions }: AdaptiveProviderProps): ReactNode => {
  useEffect(() => {
    const stop: StopAdaptiveRuntime = startAdaptiveRuntime(runtimeOptions);
    return stop;
  }, [runtimeOptions.apiBaseUrl, runtimeOptions.autoAdapt, runtimeOptions.enabled, runtimeOptions.projectId, runtimeOptions.runtimeKey]);

  return children;
};

export { init, startAdaptiveRuntime } from '@provenly/adaptive-runtime';
export type { AdaptiveRuntimeOptions, LayoutAnomaly, LayoutTarget, StopAdaptiveRuntime } from '@provenly/adaptive-runtime';
export default AdaptiveProvider;
