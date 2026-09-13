import React, { useState } from 'react';
import { Check, Shield, RotateCcw, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { AutofixRecord } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { UpgradePrompt } from '../components/common/UpgradePrompt';

interface AutofixViewProps {
  hasProject: boolean;
  canUseAutofix: boolean;
  onUpgrade: () => void;
  autofixActive: boolean;
  onToggleAutofix: (active: boolean) => void;
  autofixes: AutofixRecord[];
}

export const AutofixView: React.FC<AutofixViewProps> = ({
  hasProject, canUseAutofix, onUpgrade,
  autofixActive,
  onToggleAutofix,
  autofixes,
}) => {
  const [protectionLevel, setProtectionLevel] = useState<'safe' | 'balanced' | 'aggressive'>('safe');
  const [automaticRollback, setAutomaticRollback] = useState(true);

  // Allowed fixes checkboxes state
  const [allowedFixes, setAllowedFixes] = useState<Record<string, boolean>>({
    'Horizontal overflow': true,
    'Fixed-width containers': true,
    'Image overflow': true,
    'Modal positioning': true,
    'Viewport height issues': true,
    'Text wrapping': true,
    'Grid compression': false, // Unsafe fixes should not be automatically enabled
    'Navigation collisions': false, // Unsafe fixes should not be automatically enabled
  });

  const toggleFix = (key: string) => {
    setAllowedFixes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getProtectionExplanation = () => {
    switch (protectionLevel) {
      case 'safe':
        return 'Only low-risk layout corrections are applied automatically. Heuristics enforce zero chance of visual overlap or unintended reflow.';
      case 'balanced':
        return 'Standard layout adjustments applied automatically. Complex nested flexbox/grid containers are verified via headless browser diffing.';
      case 'aggressive':
        return 'Broad automatic reflow modifications enabled. Recommended only for rapid staging test suites.';
      default:
        return 'Only low-risk layout corrections are applied automatically.';
    }
  };

  if (!hasProject) {
    return <div className="space-y-6 max-w-6xl mx-auto pb-16"><div><h1 className="text-3xl font-semibold tracking-tight text-[#0B0B0B]">Autofix</h1></div>
      <EmptyState title="Autofix is not configured" description="Connect a project before enabling automatic responsive protection." /></div>;
  }

  if (!canUseAutofix) {
    return <div className="space-y-6 max-w-6xl mx-auto pb-16"><div><h1 className="text-3xl font-semibold tracking-tight text-[#0B0B0B]">Autofix</h1><p className="text-sm text-[#0B0B0B]/60 mt-1">Automatic responsive protection for production interfaces.</p></div><UpgradePrompt eyebrow="Autopilot feature" title="Automatic fixing" description="Autopilot automatically adapts, verifies, and rolls back responsive fixes in production. Your current plan can still detect issues and provide recommendations, but it cannot activate autonomous fixes." actionLabel="Upgrade to Autopilot" onUpgrade={onUpgrade} /></div>;
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0B0B0B]">
          Autofix
        </h1>
        <p className="text-sm text-[#0B0B0B]/60 mt-1">
          Allow the runtime to safely resolve responsive issues automatically.
        </p>
      </div>

      {/* Large Minimal Control Section */}
      <section 
        aria-label="Autofix Runtime Control"
        className="border border-[#0B0B0B]/10 rounded-md p-6 bg-[#F5F3EE] space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                Status
              </span>
              <span className="text-xs text-[#0B0B0B]/30">•</span>
              <span className="font-mono text-xs font-semibold text-[#0B0B0B]">
                Autofix
              </span>
              <span className="px-2 py-0.5 rounded border border-[#0B0B0B] bg-[#0B0B0B] text-[#F5F3EE] text-[10px] font-mono font-bold tracking-wider">
                {autofixActive ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-sm text-[#0B0B0B] max-w-2xl leading-relaxed pt-1">
              The runtime is monitoring production layouts and applying verified responsive corrections automatically.
            </p>
          </div>

          {/* Large toggle: ON / OFF */}
          <button
            type="button"
            onClick={() => onToggleAutofix(!autofixActive)}
            className={`px-5 py-2.5 rounded-md font-mono text-sm font-semibold transition-all border ${
              autofixActive
                ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]'
                : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30 hover:border-[#0B0B0B]'
            }`}
          >
            {autofixActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </section>

      {/* Protection Level Section */}
      <section className="space-y-3 pt-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[#0B0B0B]">
            Protection Level
          </h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-0.5">
            Define algorithmic boundaries for layout correction heuristics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['safe', 'balanced', 'aggressive'] as const).map((level) => {
            const isSelected = protectionLevel === level;
            const label = level === 'safe' ? 'Safe Only' : level === 'balanced' ? 'Balanced' : 'Aggressive';
            const subtitle = level === 'safe' 
              ? 'Zero-regression risk' 
              : level === 'balanced' 
              ? 'Automated visual verification' 
              : 'Experimental broad reflow';

            return (
              <button
                key={level}
                type="button"
                onClick={() => setProtectionLevel(level)}
                className={`p-4 rounded-md border text-left transition-all ${
                  isSelected
                    ? 'border-[#0B0B0B] bg-[#0B0B0B]/5 shadow-xs'
                    : 'border-[#0B0B0B]/10 hover:border-[#0B0B0B]/30 bg-[#F5F3EE]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-[#0B0B0B]">{label}</span>
                  {isSelected && (
                    <span className="text-[11px] font-mono border border-[#0B0B0B] px-1.5 py-0.2 rounded font-semibold text-[#0B0B0B]">
                      Selected
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#0B0B0B]/60 mt-1 font-mono">
                  {subtitle}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 border border-[#0B0B0B]/10 rounded-md bg-[#0B0B0B]/[0.02] text-xs font-mono text-[#0B0B0B]/70 flex items-start gap-2">
          <Info className="w-4 h-4 text-[#0B0B0B]/50 flex-shrink-0 mt-0.5" />
          <span>{getProtectionExplanation()}</span>
        </div>
      </section>

      {/* Allowed Fixes Section */}
      <section className="space-y-4 pt-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[#0B0B0B]">
            Allowed Fixes
          </h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-0.5">
            Select the specific layout defects that may be patched in real time. Unsafe fixes should not be automatically enabled.
          </p>
        </div>

        <div className="border border-[#0B0B0B]/10 rounded-md divide-y divide-[#0B0B0B]/10 bg-[#F5F3EE]">
          {Object.entries(allowedFixes).map(([name, enabled]) => {
            const isUnsafe = name === 'Grid compression' || name === 'Navigation collisions';
            return (
              <div
                key={name}
                onClick={() => toggleFix(name)}
                className="p-4 flex items-center justify-between hover:bg-[#0B0B0B]/[0.02] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Monochrome checkbox */}
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      enabled
                        ? 'bg-[#0B0B0B] border-[#0B0B0B] text-[#F5F3EE]'
                        : 'border-[#0B0B0B]/30 bg-transparent'
                    }`}
                  >
                    {enabled && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div>
                    <span className="text-sm font-medium text-[#0B0B0B]">{name}</span>
                    {isUnsafe && (
                      <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 border border-[#0B0B0B]/20 px-1 rounded">
                        Requires Balanced+
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-mono text-[#0B0B0B]/50">
                  {enabled ? 'Allowed' : 'Disabled'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Automatic Rollback Setting */}
      <section className="border border-[#0B0B0B]/10 rounded-md p-5 bg-[#F5F3EE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#0B0B0B]">
              Automatic rollback
            </span>
            <span className="px-1.5 py-0.2 rounded border border-[#0B0B0B]/30 text-[10px] font-mono text-[#0B0B0B]">
              HIGH SAFETY
            </span>
          </div>
          <p className="text-xs text-[#0B0B0B]/60 leading-relaxed max-w-xl">
            Rollback a fix immediately if it introduces a new layout regression.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAutomaticRollback(!automaticRollback)}
          className={`px-4 py-1.5 rounded font-mono text-xs font-semibold border transition-all ${
            automaticRollback
              ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B]'
              : 'bg-transparent text-[#0B0B0B] border-[#0B0B0B]/30'
          }`}
        >
          {automaticRollback ? 'ON' : 'OFF'}
        </button>
      </section>

      {/* Recent Autofixes Table */}
      <section className="space-y-4 pt-2 min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#0B0B0B]">
              Recent Autofixes
            </h2>
            <p className="text-xs text-[#0B0B0B]/60 mt-0.5">
              Live layout patches verified against synthetic viewport suites
            </p>
          </div>

          <span className="text-xs font-mono text-[#0B0B0B]/50">
            Last 24 hours
          </span>
        </div>

        {autofixes.length === 0 ? (
          <EmptyState title="No autofixes yet" description="Automatic adaptations will appear here when the runtime safely resolves a responsive issue." />
        ) : <div className="border border-[#0B0B0B]/10 rounded-md overflow-x-auto bg-[#F5F3EE] max-w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-[#0B0B0B]/10 bg-[#0B0B0B]/[0.02] text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                <th className="py-3 px-4 font-normal">Fix</th>
                <th className="py-3 px-4 font-normal">Route</th>
                <th className="py-3 px-4 font-normal">Viewport</th>
                <th className="py-3 px-4 font-normal">Result</th>
                <th className="py-3 px-4 font-normal text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B0B0B]/10 text-xs font-mono">
              {autofixes.map((af) => (
                <tr key={af.id} className="hover:bg-[#0B0B0B]/[0.03] transition-colors">
                  <td className="py-3.5 px-4 font-sans font-medium text-[#0B0B0B]">
                    {af.fix}
                  </td>
                  <td className="py-3.5 px-4 text-[#0B0B0B]/70">
                    {af.route}
                  </td>
                  <td className="py-3.5 px-4 text-[#0B0B0B]">
                    {af.viewport}
                  </td>
                  <td className="py-3.5 px-4">
                    {/* Monochrome verification icon */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#0B0B0B] bg-[#0B0B0B] text-[#F5F3EE] font-medium text-[11px]">
                      <span className="font-bold">✓</span>
                      <span>{af.result}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#0B0B0B]/60">
                    {af.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </section>
    </div>
  );
};
