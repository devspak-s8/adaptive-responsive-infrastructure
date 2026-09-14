# @provenly/adaptive-svelte

Thin Svelte/SvelteKit integration for the framework-agnostic `@provenly/adaptive-runtime`.

```svelte
<script lang="ts">
  import { adaptiveRuntime } from '@provenly/adaptive-svelte';

  const runtime = {
    projectId: 'project-id',
    runtimeKey: 'adp_pk_...',
    apiBaseUrl: 'https://app.example.com',
    autoAdapt: true,
  };
</script>

<div use:adaptiveRuntime={runtime}>
  <slot />
</div>
```

The action only manages mount/update/unmount lifecycle. The observer, AI decision
layer, adaptation verification, and rollback remain in `@provenly/adaptive-runtime`.
