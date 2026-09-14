# @provenly/runtime

Framework-agnostic Adaptive runtime for rendered web applications. It observes
the browser DOM and CSSOM, compares layout states, reports meaningful changes,
and asks the Adaptive analysis service for a validated strategy before making a
visitor-scoped change.

```ts
import { init } from '@provenly/runtime';

const stop = init({
  projectKey: 'adp_pk_...',
  apiBaseUrl: 'https://api.example.com',
});
```

The runtime only executes allowlisted strategies and rolls back a change when
verification does not improve the rendered layout. Without an AI key on the
analysis service it observes and reports but does not autofix.

## Framework adapters

The runtime is the only package that owns DOM/CSSOM observation, layout graph
comparison, AI decisions, scoped adaptations, verification, and rollback. Use a
thin lifecycle adapter when one is useful:

| Application | Package |
| --- | --- |
| React, Next.js, Remix | `@provenly/react` or `@provenly/next` |
| Vue, Nuxt | `@provenly/vue` |
| Svelte, SvelteKit | `@provenly/svelte` |
| Angular | `@provenly/angular` |
| Astro, WordPress, Shopify, Django, Laravel, Rails, or plain HTML/JS | `@provenly/browser` |

Server-rendered frameworks do not need a server-specific integration: initialize
the browser entry after hydration and the same rendered-page observer works
regardless of which backend produced the HTML.
