import React, { useRef, useState } from 'react';
import { CustomSelect } from './common/CustomSelect';

export type ProjectEnvironment = 'Production' | 'Staging' | 'Preview';

interface CreateProjectFormProps {
  onSubmit: (name: string, environment: ProjectEnvironment, url: string, idempotencyKey?: string) => Promise<boolean | string> | boolean | string;
  onCancel?: () => void;
  submitLabel?: string;
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = 'Create project',
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState<ProjectEnvironment>('Production');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLock.current || isSubmitting) return;
    setError('');
    submitLock.current = true;
    const idempotencyKey = idempotencyKeyRef.current ?? (typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
    idempotencyKeyRef.current = idempotencyKey;
    setIsSubmitting(true);

    try {
      const result = await onSubmit(name.trim(), environment, url.trim(), idempotencyKey);
      if (result !== true) {
        setError(typeof result === 'string' ? result : 'The project could not be created.');
        return;
      }
      idempotencyKeyRef.current = null;
      onCancel?.();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The project could not be created.');
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
      {error && (
        <div role="alert" className="p-3 border border-[#0B0B0B]/15 rounded-md text-[#0B0B0B]/70">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="project-name" className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
          Project name
        </label>
        <input
          id="project-name"
          type="text"
          required
          autoFocus
          placeholder="e.g. Customer Portal"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[40px]"
        />
      </div>

      <div>
        <label htmlFor="production-url" className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
          Production URL
        </label>
        <input
          id="production-url"
          type="url"
          required
          inputMode="url"
          placeholder="https://app.domain.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[40px]"
        />
      </div>

      <div>
        <label htmlFor="project-environment" className="block text-[#0B0B0B]/60 uppercase tracking-wider mb-1">
          Environment
        </label>
        <CustomSelect
          id="project-environment"
          value={environment}
          onChange={(next) => setEnvironment(next as ProjectEnvironment)}
          ariaLabel="Project environment"
          className="w-full"
          buttonClassName="w-full min-h-[40px]"
          options={[
            { value: 'Production', label: 'Production' },
            { value: 'Staging', label: 'Staging' },
            { value: 'Preview', label: 'Preview' },
          ]}
        />
      </div>

      <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 border border-[#0B0B0B]/20 rounded-md text-[#0B0B0B] hover:bg-[#0B0B0B]/5 disabled:opacity-50 min-h-[38px]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2 bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 disabled:opacity-50 min-h-[38px]"
        >
          {isSubmitting ? 'Creating…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
