# @provenly/angular

Angular-friendly lifecycle wrapper for `@provenly/runtime`.

```ts
import { AdaptiveRuntimeService } from '@provenly/angular';

export class AppComponent {
  constructor(runtime: AdaptiveRuntimeService) {
    runtime.start({
      projectId: 'project-id',
      runtimeKey: 'adp_pk_...',
      apiBaseUrl: 'https://app.example.com',
      autoAdapt: true,
    });
  }
}
```

Stop the returned handle (or call `service.stop()`) during application teardown.
The service is deliberately decorator-free so the intelligence engine is not
coupled to Angular internals.
