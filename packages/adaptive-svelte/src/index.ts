import { startAdaptiveRuntime, type AdaptiveRuntimeOptions, type StopAdaptiveRuntime } from '@provenly/adaptive-runtime';

/**
 * Svelte action that owns one runtime instance for the mounted application.
 * The action is intentionally small: all observation and adaptation logic lives
 * in @provenly/adaptive-runtime and therefore works for SvelteKit and plain Svelte apps.
 */
export const adaptiveRuntime = (node: HTMLElement, options: AdaptiveRuntimeOptions): {
  update: (nextOptions: AdaptiveRuntimeOptions) => void;
  destroy: () => void;
} => {
  let stop: StopAdaptiveRuntime = startAdaptiveRuntime(options);

  return {
    update(nextOptions) {
      stop();
      stop = startAdaptiveRuntime(nextOptions);
    },
    destroy() {
      stop();
    },
  };
};

export { init, startAdaptiveRuntime } from '@provenly/adaptive-runtime';
export type { AdaptiveRuntimeOptions, LayoutAnomaly, LayoutTarget, StopAdaptiveRuntime } from '@provenly/adaptive-runtime';
