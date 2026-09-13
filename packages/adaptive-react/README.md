# @adaptive/react

The Adaptive React runtime observes viewport, route, DOM, and horizontal-overflow
conditions. New issues can be analyzed by the server-side AI adapter, which may
return one safe scoped CSS patch. The SDK verifies the result and rolls the
patch back if the layout does not improve. Adaptations stay in the current
visitor session and are reported as telemetry.

```tsx
import { AdaptiveProvider } from '@adaptive/react';

export default function App({ children }) {
  return (
    <AdaptiveProvider
      projectId="project-id"
      runtimeKey="adp_pk_..."
      apiBaseUrl="https://console.example.com"
    >
      {children}
    </AdaptiveProvider>
  );
}
```
