declare module 'react' {
  export type ReactNode = unknown;
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useRef<T>(initialValue?: T): { current: T | undefined };
}
