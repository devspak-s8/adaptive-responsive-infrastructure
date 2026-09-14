'use client';

export { AdaptiveProvider, init, startAdaptiveRuntime } from '@adaptive/react';
export type { AdaptiveProviderProps, AdaptiveRuntimeOptions, LayoutAnomaly, LayoutTarget, StopAdaptiveRuntime } from '@adaptive/react';

/** Alias that makes the client boundary explicit in Next.js applications. */
export { AdaptiveProvider as AdaptiveNextProvider } from '@adaptive/react';
