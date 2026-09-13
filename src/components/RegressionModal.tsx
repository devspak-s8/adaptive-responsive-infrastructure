import React from 'react';
import { X, ArrowRight, GitCommit, ShieldAlert, Check } from 'lucide-react';
import { DeploymentItem } from '../types';

interface RegressionModalProps {
  deployment: DeploymentItem | null;
  onClose: () => void;
  onOpenIssue: (viewport: string) => void;
}

export const RegressionModal: React.FC<RegressionModalProps> = ({
  deployment,
  onClose,
  onOpenIssue,
}) => {
  if (!deployment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#0B0B0B]/40 transition-opacity" 
      />

      {/* Modal Dialog */}
      <div 
        id="regression-report-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Responsive Regression Report"
        className="relative w-full max-w-2xl bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-lg shadow-2xl p-4 sm:p-6 overflow-hidden z-10 max-h-[92dvh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 sm:pb-5 border-b border-[#0B0B0B]/10 flex-shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                Observability Audit
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 border border-[#0B0B0B]/20 text-[#0B0B0B] rounded">
                commit {deployment.commit}
              </span>
              <span className="text-[11px] font-mono text-[#0B0B0B]/40 truncate max-w-[120px]">
                branch {deployment.branch}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[#0B0B0B] truncate">
              Responsive Regression Report
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 -mr-1 -mt-1 rounded text-[#0B0B0B]/60 hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/5 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto min-w-0 py-4 space-y-4">
          {/* Score delta & metrics */}
          <div className="border border-[#0B0B0B]/10 rounded-md bg-[#0B0B0B]/[0.02] grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x sm:divide-x divide-[#0B0B0B]/10 text-center">
            <div className="p-3">
              <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[#0B0B0B]/50">Previous score</div>
              <div className="text-xl sm:text-2xl font-mono font-medium text-[#0B0B0B] mt-0.5 sm:mt-1">
                {deployment.previousScore ?? '—'}
              </div>
            </div>
            <div className="p-3 border-l border-[#0B0B0B]/10">
              <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[#0B0B0B]/50">Current score</div>
              <div className="text-xl sm:text-2xl font-mono font-semibold text-[#0B0B0B] mt-0.5 sm:mt-1">
                {deployment.responsiveScore}
              </div>
            </div>
            <div className="p-3 border-t sm:border-t-0 border-[#0B0B0B]/10">
              <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[#0B0B0B]/50">New issues</div>
              <div className="text-xl sm:text-2xl font-mono font-semibold text-[#0B0B0B] mt-0.5 sm:mt-1">
                {deployment.newIssuesCount ?? '—'}
              </div>
            </div>
            <div className="p-3 border-t sm:border-t-0 border-l border-[#0B0B0B]/10">
              <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[#0B0B0B]/50">Resolved</div>
              <div className="text-xl sm:text-2xl font-mono font-medium text-[#0B0B0B] mt-0.5 sm:mt-1">
                {deployment.resolvedIssuesCount ?? '—'}
              </div>
            </div>
          </div>

          {/* Before / After results list */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
              Viewport Comparison Results
            </div>

            {deployment.regressionDetails && deployment.regressionDetails.length > 0 ? (
              <div className="space-y-2">
                {deployment.regressionDetails.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 sm:p-3.5 border border-[#0B0B0B]/10 rounded-md bg-[#0B0B0B]/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0B0B0B]">
                          {item.viewport}
                        </span>
                        <span className="text-xs text-[#0B0B0B]/30">•</span>
                        <span className="font-mono text-xs text-[#0B0B0B]/70 truncate max-w-[200px]">
                          {item.element}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="text-[#0B0B0B]/50 flex items-center gap-1">
                          Before: <span className="text-[#0B0B0B]">{item.before}</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#0B0B0B]/30" />
                        <span className="text-[#0B0B0B] font-medium underline underline-offset-2">
                          After: {item.after}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenIssue(item.viewport);
                      }}
                      className="self-start sm:self-center px-3 py-1.5 text-xs font-mono border border-[#0B0B0B]/20 text-[#0B0B0B] rounded hover:bg-[#0B0B0B]/5 transition-colors whitespace-nowrap min-h-[32px]"
                    >
                      View Issue →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-[#0B0B0B]/10 rounded-md text-xs font-mono text-[#0B0B0B]/60 text-center">
                No layout regressions were reported for this deployment.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#0B0B0B]/10 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-mono bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 transition-colors text-center min-h-[36px]"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
