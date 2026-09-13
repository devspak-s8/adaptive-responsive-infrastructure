import React, { useState } from 'react';
import { ProjectSettings } from '../types';

interface SettingsViewProps {
  settings: ProjectSettings;
  onSave: (newSettings: ProjectSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings: initialSettings,
  onSave,
}) => {
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
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
          {savedFeedback ? 'Settings Saved ✓' : 'Save Changes'}
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
            <input
              type="text"
              value={settings.environment}
              onChange={(e) => setSettings({ ...settings, environment: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F3EE] border border-[#0B0B0B]/15 rounded-md text-[#0B0B0B] focus:outline-none focus:border-[#0B0B0B] min-h-[38px]"
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
              <div className="text-sm font-medium text-[#0B0B0B]">Autofix Enabled</div>
              <div className="text-xs text-[#0B0B0B]/60">Permit verified CSS injection for low-risk responsive defects.</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, autofixEnabled: !settings.autofixEnabled })}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.autofixEnabled 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.autofixEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Automatic Rollback */}
          <div className="flex items-center justify-between gap-3 py-3 border-b border-[#0B0B0B]/10">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#0B0B0B]">Automatic Rollback</div>
              <div className="text-xs text-[#0B0B0B]/60">Instantly revert patch if downstream elements trigger collision.</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, automaticRollback: !settings.automaticRollback })}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.automaticRollback 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.automaticRollback ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Scan Frequency */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
            <div>
              <div className="text-sm font-medium text-[#0B0B0B]">Scan Frequency</div>
              <div className="text-xs text-[#0B0B0B]/60">Interval between automated headless synthetic viewport audits.</div>
            </div>
            <select
              aria-label="Scan Frequency"
              value={settings.scanFrequency}
              onChange={(e) => setSettings({ ...settings, scanFrequency: e.target.value as any })}
              className="bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded px-2.5 py-1.5 text-xs font-mono text-[#0B0B0B] min-h-[36px] self-start sm:self-auto"
            >
              <option value="continuous">Continuous (Every commit + 10m)</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
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
              <div className="text-sm font-medium text-[#0B0B0B]">Deployment regression alerts</div>
              <div className="text-xs text-[#0B0B0B]/60">Send immediate high-priority alert if commit score degrades.</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, notifyRegression: !settings.notifyRegression })}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.notifyRegression 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.notifyRegression ? 'ON' : 'OFF'}
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
              <div className="text-sm font-medium text-[#0B0B0B]">Autofix reports</div>
              <div className="text-xs text-[#0B0B0B]/60">Weekly summary of automated fixes and verified responsive scores.</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, notifyAutofix: !settings.notifyAutofix })}
              className={`px-3 py-1 font-mono text-xs rounded border min-h-[32px] min-w-[50px] flex-shrink-0 ${
                settings.notifyAutofix 
                  ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]' 
                  : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
              }`}
            >
              {settings.notifyAutofix ? 'ON' : 'OFF'}
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
              onClick={() => triggerFeedback('Runtime telemetry paused.')}
              className="px-3.5 py-1.5 border border-[#0B0B0B] text-[#0B0B0B] font-mono text-xs rounded hover:bg-[#0B0B0B]/5 self-start sm:self-auto min-h-[36px]"
            >
              Disable Runtime
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-[#0B0B0B]/20 rounded-md">
            <div>
              <div className="text-sm font-medium text-[#0B0B0B]">Delete Project</div>
              <div className="text-xs text-[#0B0B0B]/60 mt-0.5">Permanently delete this project and all historical telemetry.</div>
            </div>
            <button
              type="button"
              onClick={() => triggerFeedback('Project deletion is not connected yet.')}
              className="px-3.5 py-1.5 bg-[#0B0B0B] text-[#F5F3EE] font-mono text-xs rounded hover:bg-[#0B0B0B]/85 self-start sm:self-auto min-h-[36px]"
            >
              Delete Project
            </button>
          </div>
        </div>
      </section>
    </form>
  );
};
