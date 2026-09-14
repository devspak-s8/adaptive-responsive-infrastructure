# @adaptive/next

Next.js client integration. Use `AdaptiveNextProvider` once in a client
boundary such as `app/providers.tsx`; the observer itself remains in
`@adaptive/runtime` and works across route transitions.

```tsx
'use client';
import { AdaptiveNextProvider } from '@adaptive/next';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AdaptiveNextProvider projectId="..." runtimeKey="adp_pk_..." apiBaseUrl="https://api.example.com">{children}</AdaptiveNextProvider>;
}
```
