'use client';

export { AdaptiveProvider, init, startAdaptiveRuntime } from '@provenly/adaptive-react';
export type { AdaptiveProviderProps, AdaptiveRuntimeOptions, LayoutAnomaly, LayoutTarget, StopAdaptiveRuntime } from '@provenly/adaptive-react';

/** Alias that makes the client boundary explicit in Next.js applications. */
export { AdaptiveProvider as AdaptiveNextProvider } from '@provenly/adaptive-react';
