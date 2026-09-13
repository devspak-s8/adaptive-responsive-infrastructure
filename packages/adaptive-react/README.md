# @adaptive/react

The Adaptive React runtime observes viewport and horizontal-overflow conditions
and sends privacy-conscious telemetry to the project runtime API. It is
render-transparent and never receives Auth.js, database, or billing secrets.

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
