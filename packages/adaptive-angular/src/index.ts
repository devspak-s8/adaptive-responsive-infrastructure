import { startAdaptiveRuntime, type AdaptiveRuntimeOptions, type StopAdaptiveRuntime } from '@provenly/adaptive-runtime';

/**
 * Injectable-style service without a hard dependency on Angular decorators.
 * Angular applications can extend/provide this class, while the package stays
 * compilable and the actual runtime remains framework neutral.
 */
export class AdaptiveRuntimeService {
  private stopRuntime: StopAdaptiveRuntime = () => undefined;

  start(options: AdaptiveRuntimeOptions): StopAdaptiveRuntime {
    this.stopRuntime();
    this.stopRuntime = startAdaptiveRuntime(options);
    return this.stopRuntime;
  }

  stop(): void {
    this.stopRuntime();
    this.stopRuntime = () => undefined;
  }
}

export const initAdaptiveRuntime = (options: AdaptiveRuntimeOptions): StopAdaptiveRuntime => startAdaptiveRuntime(options);

export { init, startAdaptiveRuntime } from '@provenly/adaptive-runtime';
export type { AdaptiveRuntimeOptions, LayoutAnomaly, LayoutTarget, StopAdaptiveRuntime } from '@provenly/adaptive-runtime';
