import React from 'react';
import { GitCommit, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { DeploymentItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { UpgradePrompt } from '../components/common/UpgradePrompt';

interface DeploymentsViewProps {
  deployments: DeploymentItem[];
  canUseDeploymentMonitoring: boolean;
  onUpgrade: () => void;
  onSelectDeployment: (dep: DeploymentItem) => void;
}

export const DeploymentsView: React.FC<DeploymentsViewProps> = ({
  deployments, canUseDeploymentMonitoring, onUpgrade,
  onSelectDeployment,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-16 min-w-0 max-w-full">
      {/* Top Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">
          Deployments
        </h1>
        <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">
          Automated layout regression audits triggered across Git pipelines.
        </p>
      </div>

      {/* Deployments Data Table */}
      {!canUseDeploymentMonitoring ? <UpgradePrompt title="Deployment monitoring" description="Deployment monitoring is available on Developer and Autopilot plans." onUpgrade={onUpgrade} /> : deployments.length === 0 ? (
        <EmptyState title="No deployments detected" description="Deployment scans will appear after a connected project begins reporting deployment activity." />
      ) : <div className="border border-[#0B0B0B]/10 rounded-md overflow-hidden bg-[#F5F3EE]">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#0B0B0B]/10 bg-[#0B0B0B]/[0.02] text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                <th className="py-3 px-4 font-normal">Environment</th>
                <th className="py-3 px-4 font-normal">Commit</th>
                <th className="py-3 px-4 font-normal">Branch</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Responsive Score</th>
                <th className="py-3 px-4 font-normal text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B0B0B]/10 text-xs font-mono">
              {deployments.map((dep) => {
                const isRegression = dep.status === 'Regression detected';
                return (
                  <tr
                    key={dep.id}
                    onClick={() => onSelectDeployment(dep)}
                    className="hover:bg-[#0B0B0B]/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* Environment */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded border border-[#0B0B0B]/20 text-[#0B0B0B] text-[11px]">
                        {dep.environment}
                      </span>
                    </td>

                    {/* Commit */}
                    <td className="py-3.5 px-4 font-mono font-medium text-[#0B0B0B]">
                      <div className="flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-[#0B0B0B]/40" />
                        <span>{dep.commit}</span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="py-3.5 px-4 text-[#0B0B0B]/70">
                      {dep.branch}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {isRegression ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#0B0B0B] bg-[#0B0B0B] text-[#F5F3EE] font-medium text-[11px]">
                          <span className="font-bold">!</span>
                          <span>Regression detected</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#0B0B0B]/20 bg-[#0B0B0B]/5 text-[#0B0B0B] font-medium text-[11px]">
                          <span className="font-bold">✓</span>
                          <span>Passed</span>
                        </div>
                      )}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-sm text-[#0B0B0B]">
                          {dep.responsiveScore ?? '—'}
                        </span>
                        <span className="text-[10px] text-[#0B0B0B]/40">score</span>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-right text-[#0B0B0B]/60">
                      {dep.time}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}

      {deployments.length > 0 && <div className="text-xs font-mono text-[#0B0B0B]/40 pt-1">
        Click any deployment row to inspect the complete Responsive Regression Report.
      </div>}
    </div>
  );
};
