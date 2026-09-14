# @provenly/adaptive-browser

Browser/vanilla HTML and JavaScript entry point for the framework-agnostic
`@provenly/adaptive-runtime` package.

```js
import { init } from '@provenly/adaptive-browser';

const stop = init({
  projectKey: 'adp_pk_...',
  apiBaseUrl: 'https://app.example.com',
  autoAdapt: true,
});

window.addEventListener('pagehide', stop, { once: true });
```

This is also the base for a future CDN/IIFE distribution. The intelligence and
DOM observation remain in the shared runtime rather than in a framework adapter.
