import React, { useEffect, useState } from 'react';
import { ProjectSettings } from '../types';
import type { PlanId } from '../config/plans';
import { CustomSelect } from '../components/common/CustomSelect';

interface SettingsViewProps {
  settings: ProjectSettings;
  currentPlan: PlanId | null;
  onSave: (newSettings: ProjectSettings) => Promise<void>;
  onUpgrade: () => void;
  onDelete: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings: initialSettings,
  currentPlan,
  onSave,
  onUpgrade,
  onDelete,
}) => {
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setSettings(initialSettings), [initialSettings]);

  const canUseDeveloper = currentPlan === 'developer' || currentPlan === 'autopilot';
  const canUseAutopilot = currentPlan === 'autopilot';
  const paidLabel = (plan: 'Developer' | 'Autopilot') => (
    <button type="button" onClick={onUpgrade} className="ml-2 text-[10px] font-mono uppercase tracking-wider underline underline-offset-2 text-[#0B0B0B]/55 hover:text-[#0B0B0B]">
      Requires {plan}
    </button>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionFeedback(null);
    try {
      await onSave(settings);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch (error) {
      setActionFeedback(error instanceof Error ? error.message : 'Settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const disableRuntime = async () => {
    const nextSettings = { ...settings, monitoringEnabled: false };
    setSettings(nextSettings);
    try {
      await onSave(nextSettings);
      triggerFeedback('Runtime monitoring disabled for this project.');
    } catch (error) {
      setSettings(settings);
      setActionFeedback(error instanceof Error ? error.message : 'Runtime could not be disabled.');
    }
  };

  const deleteCurrentProject = async () => {
    if (!window.confirm('Delete this project and all of its telemetry? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      setDeleting(false);
      setActionFeedback(error instanceof Error ? error.message : 'Project could not be deleted.');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 sm:space-y-12 max-w-4xl mx-auto pb-24 min-w-0 max-w-full">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#0B0B0B]/10 pb-5 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-0.5 sm:mt-1">
            Configure layout monitoring thresholds, automated rollbacks, and notification policies.
          </p>
        </div>

        <button
          type="submit"
          className="self-start sm:self-auto px-4 py-2 bg-[#0B0B0B] text-[#F5F3EE] font-mono text-xs rounded-md hover:bg-[#0B0B0B]/85 transition-colors min-h-[36px]"
        >
          {saving ? 'Saving...' : savedFeedback ? 'Settings saved' : 'Save changes'}
        </button>
      </div>

      {actionFeedback && (
        <div className="p-3 border border-[#0B0B0B] bg-[#0B0B0B] text-[#F5F3EE] rounded text-xs font-mono">
          {actionFeedback}
        </div>
      )}

      {/* SECTION 1: GENERAL */}
      <section className="space-y-5 sm:space-y-6">
        <div className="border-b border-[#0B0B0B]/10 pb-2">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#0B0B0B]">
            General
          </h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-0.5 font-mono">
            Basic deployment identity and targets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs font-mono">
          <div className="space-y-2">
            <label className="block text-[#0B0B0B]/60 uppercase tracking-wider">
              Project Name
            </label>
            <input
              type="text"
              value={settings.projectName}
              onChange={(e) => setSettings({ ...settings, projectName: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/15 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[38px]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[#0B0B0B]/60 uppercase tracking-wider">
              Environment
            </label>
            <CustomSelect
              ariaLabel="Environment"
              value={settings.environment}
              onChange={(next) => setSettings({ ...settings, environment: next })}
              className="w-full"
              buttonClassName="w-full min-h-[38px]"
              options={[
                { value: 'Production', label: 'Production' },
                { value: 'Staging', label: 'Staging' },
                { value: 'Preview', label: 'Preview' },
              ]}
            />
          </div>

          <div className="col-span-full space-y-2">
            <label className="block text-[#0B0B0B]/60 uppercase tracking-wider">
              Production URL
            </label>
            <input
              type="url"
              value={settings.productionUrl}
              onChange={(e) => setSettings({ ...settings, productionUrl: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/15 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[38px]"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: RUNTIME */}
      <section className="space-y-5 sm:space-y-6 pt-2">
        <div className="border-b border-[#0B0B0B]/10 pb-2">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#0B0B0B]">
            Runtime
          </h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-0.5 font-mono">
            Observer hooks and heuristic execution policies
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Monitoring Enabled */}
          <div className="flex items-center justify-between gap-3 py-3 border-b border-[#0B0B0B]/10">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#0B0B0B]">Monitoring Enabled</div>
              <div className="text-xs text-[#0B0B0B]/60">Allow synthetic and user-session viewport observation.</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, monitoringEnabled: !settings.monitoringEnabled })}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.monitoringEnabled 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.monitoringEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Autofix Enabled */}
          <div className="flex items-center justify-between gap-3 py-3 border-b border-[#0B0B0B]/10">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#0B0B0B]">Autofix Enabled {!canUseAutopilot && paidLabel('Autopilot')}</div>
              <div className="text-xs text-[#0B0B0B]/60">Permit verified CSS injection for low-risk responsive defects.</div>
            </div>
            <button
              type="button"
              onClick={() => canUseAutopilot || settings.autofixEnabled ? setSettings({ ...settings, autofixEnabled: !settings.autofixEnabled }) : onUpgrade()}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.autofixEnabled 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
              >
              {settings.autofixEnabled ? canUseAutopilot ? 'ON' : 'DISABLE' : canUseAutopilot ? 'OFF' : 'UPGRADE'}
            </button>
          </div>

          {/* Automatic Rollback */}
          <div className="flex items-center justify-between gap-3 py-3 border-b border-[#0B0B0B]/10">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#0B0B0B]">Automatic Rollback {!canUseAutopilot && paidLabel('Autopilot')}</div>
              <div className="text-xs text-[#0B0B0B]/60">Instantly revert patch if downstream elements trigger collision.</div>
            </div>
            <button
              type="button"
              onClick={() => canUseAutopilot || settings.automaticRollback ? setSettings({ ...settings, automaticRollback: !settings.automaticRollback }) : onUpgrade()}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.automaticRollback 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.automaticRollback ? canUseAutopilot ? 'ON' : 'DISABLE' : canUseAutopilot ? 'OFF' : 'UPGRADE'}
            </button>
          </div>

          {/* Scan Frequency */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
            <div>
              <div className="text-sm font-medium text-[#0B0B0B]">Scan Frequency {!canUseDeveloper && paidLabel('Developer')}</div>
              <div className="text-xs text-[#0B0B0B]/60">Interval between automated headless synthetic viewport audits.</div>
            </div>
            <CustomSelect
              ariaLabel="Scan Frequency"
              value={settings.scanFrequency}
              onChange={(next) => next === 'continuous' && !canUseDeveloper ? onUpgrade() : setSettings({ ...settings, scanFrequency: next as ProjectSettings['scanFrequency'] })}
              className="self-start sm:self-auto"
              buttonClassName="min-w-[220px]"
              options={[
                { value: 'continuous', label: 'Continuous (Every commit + 10m)' },
                { value: 'hourly', label: 'Hourly' },
                { value: 'daily', label: 'Daily' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Protection level */}
      <section className="space-y-5 sm:space-y-6 pt-2">
        <div className="border-b border-[#0B0B0B]/10 pb-2">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#0B0B0B]">Protection level</h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-0.5 font-mono">Choose how much automation the runtime may apply.</p>
        </div>
        <CustomSelect
          ariaLabel="Protection level"
          value={settings.protectionLevel}
          onChange={(next) => {
            if (next === 'balanced' && !canUseDeveloper) return onUpgrade();
            if (next === 'aggressive' && !canUseAutopilot) return onUpgrade();
            setSettings({ ...settings, protectionLevel: next as ProjectSettings['protectionLevel'] });
          }}
          className="w-full sm:w-auto"
          buttonClassName="w-full sm:min-w-[260px]"
          options={[
            { value: 'safe', label: 'Safe - deterministic checks only' },
            { value: 'balanced', label: 'Balanced - Developer' },
            { value: 'aggressive', label: 'Aggressive - Autopilot' },
          ]}
        />
      </section>

      {/* SECTION 3: NOTIFICATIONS */}
      <section className="space-y-5 sm:space-y-6 pt-2">
        <div className="border-b border-[#0B0B0B]/10 pb-2">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#0B0B0B]">
            Notifications
          </h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-0.5 font-mono">
            Dispatch webhooks and email digests to engineering on-call
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3 py-3 border-b border-[#0B0B0B]/10">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#0B0B0B]">Deployment regression alerts {!canUseDeveloper && paidLabel('Developer')}</div>
              <div className="text-xs text-[#0B0B0B]/60">Send immediate high-priority alert if commit score degrades.</div>
            </div>
            <button
              type="button"
              onClick={() => canUseDeveloper || settings.notifyRegression ? setSettings({ ...settings, notifyRegression: !settings.notifyRegression }) : onUpgrade()}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.notifyRegression 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.notifyRegression ? canUseDeveloper ? 'ON' : 'DISABLE' : canUseDeveloper ? 'OFF' : 'UPGRADE'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 py-3 border-b border-[#0B0B0B]/10">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#0B0B0B]">Critical issue alerts</div>
              <div className="text-xs text-[#0B0B0B]/60">Trigger webhook when element overflow exceeds 50px boundary.</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, notifyCritical: !settings.notifyCritical })}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.notifyCritical 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.notifyCritical ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#0B0B0B]">Autofix reports {!canUseAutopilot && paidLabel('Autopilot')}</div>
              <div className="text-xs text-[#0B0B0B]/60">Weekly summary of automated fixes and verified responsive scores.</div>
            </div>
            <button
              type="button"
              onClick={() => canUseAutopilot || settings.notifyAutofix ? setSettings({ ...settings, notifyAutofix: !settings.notifyAutofix }) : onUpgrade()}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.notifyAutofix 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.notifyAutofix ? canUseAutopilot ? 'ON' : 'DISABLE' : canUseAutopilot ? 'OFF' : 'UPGRADE'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: DANGER ZONE */}
      <section className="space-y-5 sm:space-y-6 pt-2">
        <div className="border-b border-[#0B0B0B]/20 pb-2">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#0B0B0B]">
            Danger Zone
          </h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-0.5 font-mono">
            Irreversible cluster and telemetry actions
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-[#0B0B0B]/20 rounded-md">
            <div>
              <div className="text-sm font-medium text-[#0B0B0B]">Disable Runtime</div>
              <div className="text-xs text-[#0B0B0B]/60 mt-0.5">Disconnect SDK observers from all client instances.</div>
            </div>
            <button
              type="button"
              onClick={() => void disableRuntime()}
              className="px-3.5 py-1.5 border border-[#0B0B0B] text-[#0B0B0B] font-mono text-xs rounded hover:bg-[#0B0B0B]/5 self-start sm:self-auto min-h-[36px]"
            >
              {settings.monitoringEnabled ? 'Disable Runtime' : 'Runtime Disabled'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-[#0B0B0B]/20 rounded-md">
            <div>
              <div className="text-sm font-medium text-[#0B0B0B]">Delete Project</div>
              <div className="text-xs text-[#0B0B0B]/60 mt-0.5">Permanently delete this project and all historical telemetry.</div>
            </div>
            <button
              type="button"
              onClick={() => void deleteCurrentProject()}
              disabled={deleting}
              className="px-3.5 py-1.5 bg-[#0B0B0B] text-[#F5F3EE] font-mono text-xs rounded hover:bg-[#0B0B0B]/85 self-start sm:self-auto min-h-[36px] disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
};
