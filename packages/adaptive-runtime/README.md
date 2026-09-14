# @adaptive/runtime

Framework-agnostic Adaptive runtime for rendered web applications. It observes
the browser DOM and CSSOM, compares layout states, reports meaningful changes,
and asks the Adaptive analysis service for a validated strategy before making a
visitor-scoped change.

```ts
import { init } from '@adaptive/runtime';

const stop = init({
  projectKey: 'adp_pk_...',
  apiBaseUrl: 'https://api.example.com',
});
```

The runtime only executes allowlisted strategies and rolls back a change when
verification does not improve the rendered layout. Without an AI key on the
analysis service it observes and reports but does not autofix.
