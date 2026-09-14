import { onBeforeUnmount, onMounted } from 'vue';
import { startAdaptiveRuntime, type AdaptiveRuntimeOptions, type StopAdaptiveRuntime } from '@provenly/runtime';

export const useAdaptiveRuntime = (options: AdaptiveRuntimeOptions): { stop: () => void } => {
  let stop: StopAdaptiveRuntime = () => undefined;
  onMounted(() => { stop = startAdaptiveRuntime(options); });
  onBeforeUnmount(() => { stop(); stop = () => undefined; });
  return { stop: () => stop() };
};

export { init, startAdaptiveRuntime } from '@provenly/runtime';
export type { AdaptiveRuntimeOptions, LayoutAnomaly, LayoutTarget, StopAdaptiveRuntime } from '@provenly/runtime';
