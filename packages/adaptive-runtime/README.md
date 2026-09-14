# @provenly/adaptive-runtime

Framework-agnostic Adaptive runtime for rendered web applications. It observes
the browser DOM and CSSOM, compares layout states, reports meaningful changes,
and asks the Adaptive analysis service for a validated strategy before making a
visitor-scoped change.

```ts
import { init } from '@provenly/adaptive-runtime';

const stop = init({
  projectKey: 'adp_pk_...',
  apiBaseUrl: 'https://api.example.com',
});
```

The runtime only executes allowlisted strategies and rolls back a change when
verification does not improve the rendered layout. Without an AI key on the
analysis service it observes and reports but does not autofix.

## Visual evidence

When a meaningful layout anomaly is observed, the runtime generates a bounded,
text-free SVG layout snapshot. If an adaptation is attempted, it captures the
post-adaptation snapshot and sends both as visual evidence with the issue and
adaptation event. The console can show the before/after comparison without
capturing page text, form values, passwords, or arbitrary HTML. Evidence is
visitor-scoped and only generated for detected anomalies, not every session.
Add `data-adaptive-ignore` or `data-adaptive-private` to a region that should
not be included in layout evidence.

## Framework adapters

The runtime is the only package that owns DOM/CSSOM observation, layout graph
comparison, AI decisions, scoped adaptations, verification, and rollback. Use a
thin lifecycle adapter when one is useful:

| Application | Package |
| --- | --- |
| React, Next.js, Remix | `@provenly/adaptive-react` or `@provenly/adaptive-next` |
| Vue, Nuxt | `@provenly/adaptive-vue` |
| Svelte, SvelteKit | `@provenly/adaptive-svelte` |
| Angular | `@provenly/adaptive-angular` |
| Astro, WordPress, Shopify, Django, Laravel, Rails, or plain HTML/JS | `@provenly/adaptive-browser` |

Server-rendered frameworks do not need a server-specific integration: initialize
the browser entry after hydration and the same rendered-page observer works
regardless of which backend produced the HTML.
