# @adaptive/react

React integration for the framework-agnostic `@adaptive/runtime`. The provider
is intentionally thin; the observer works from rendered DOM and CSSOM rather
than React internals.

The Adaptive React integration mounts the framework-agnostic runtime, which
observes viewport, route, DOM, CSSOM, layout state changes, and compact visual
snapshots. New states can be analyzed by the server-side AI adapter, which may
return one validated strategy. The runtime verifies the result and rolls the
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
