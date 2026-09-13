import React, { useState } from 'react';
import { X, Check, Copy, AlertTriangle, Eye, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { ResponsiveIssue } from '../types';

interface IssueDetailPanelProps {
  issue: ResponsiveIssue | null;
  onClose: () => void;
  onApplyFix: (issueId: string) => void;
  onIgnore: (issueId: string) => void;
  onMarkResolved: (issueId: string) => void;
  onViewInLab: (viewport: string, selector: string) => void;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({
  issue,
  onClose,
  onApplyFix,
  onIgnore,
  onMarkResolved,
  onViewInLab,
}) => {
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!issue) return null;

  const handleCopyFix = () => {
    if (issue.recommendedFix) {
      navigator.clipboard.writeText(issue.recommendedFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      onApplyFix(issue.id);
    }, 450);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#0B0B0B]/30 z-40 transition-opacity duration-200"
      />

      {/* Slide-over / Fullscreen mobile sheet */}
      <aside 
        id="issue-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Issue detail for ${issue.title}`}
        className="fixed inset-y-0 right-0 w-full sm:max-w-lg lg:max-w-xl bg-[#F5F3EE] border-l border-[#0B0B0B]/15 shadow-2xl z-50 flex flex-col justify-between h-[100dvh] overflow-hidden transition-transform duration-200 safe-top"
      >
        {/* Panel Header */}
        <div className="p-4 sm:p-6 border-b border-[#0B0B0B]/10 flex items-start justify-between gap-3 bg-[#F5F3EE] flex-shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                Issue Detail • {issue.id}
              </span>
              <span 
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  issue.severity === 'High' 
                    ? 'border-[#0B0B0B] text-[#0B0B0B] font-semibold bg-[#0B0B0B]/5' 
                    : 'border-[#0B0B0B]/30 text-[#0B0B0B]/70'
                }`}
              >
                {issue.severity} Severity
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#0B0B0B]/20 text-[#0B0B0B]/60">
                {issue.status}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#0B0B0B] break-words">
              {issue.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-2 -mr-1 rounded text-[#0B0B0B]/60 hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/5 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Body - scrollable internally */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 overflow-y-auto text-sm min-w-0">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 pb-5 border-b border-[#0B0B0B]/10 font-mono text-xs">
            <div>
              <span className="text-[#0B0B0B]/40 block text-[11px] uppercase tracking-wider mb-1">
                Route
              </span>
              <span className="text-[#0B0B0B] font-medium bg-[#0B0B0B]/5 px-2 py-1 rounded block truncate">
                {issue.route}
              </span>
            </div>
            <div>
              <span className="text-[#0B0B0B]/40 block text-[11px] uppercase tracking-wider mb-1">
                Viewport
              </span>
              <span className="text-[#0B0B0B] font-medium bg-[#0B0B0B]/5 px-2 py-1 rounded block truncate">
                {issue.viewport}
              </span>
            </div>
            <div className="xs:col-span-2">
              <span className="text-[#0B0B0B]/40 block text-[11px] uppercase tracking-wider mb-1">
                Selector
              </span>
              <span className="text-[#0B0B0B] font-semibold bg-[#0B0B0B]/5 px-2 py-1 rounded block truncate">
                {issue.element}
              </span>
            </div>
          </div>

          {/* Width Detection Comparison */}
          {issue.detectedWidth && (
            <div className="space-y-2 pb-5 border-b border-[#0B0B0B]/10">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 block">
                Geometry Analysis
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-[#0B0B0B]/10 rounded-md bg-[#0B0B0B]/[0.02]">
                  <div className="text-[11px] font-mono text-[#0B0B0B]/50">Detected width</div>
                  <div className="text-base sm:text-lg font-mono font-semibold text-[#0B0B0B] mt-0.5">
                    {issue.detectedWidth}
                  </div>
                </div>
                <div className="p-3 border border-[#0B0B0B]/10 rounded-md bg-[#0B0B0B]/[0.02]">
                  <div className="text-[11px] font-mono text-[#0B0B0B]/50">Available width</div>
                  <div className="text-base sm:text-lg font-mono font-semibold text-[#0B0B0B] mt-0.5">
                    {issue.availableWidth}
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono text-[#0B0B0B]/60 pt-1">
                Delta: <span className="font-semibold text-[#0B0B0B]">+68px horizontal boundary overflow</span>
              </div>
            </div>
          )}

          {/* Cause description */}
          <div className="space-y-1.5 pb-5 border-b border-[#0B0B0B]/10">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 block">
              Cause
            </span>
            <p className="text-sm text-[#0B0B0B] leading-relaxed">
              {issue.cause || 'Fixed minimum width exceeds available viewport.'}
            </p>
          </div>

          {/* Current CSS snippet */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 block">
              Current CSS
            </span>
            <div className="bg-[#0B0B0B] text-[#F5F3EE] p-3 rounded-md font-mono text-xs border border-[#0B0B0B]/20 overflow-x-auto">
              <pre className="text-xs leading-relaxed whitespace-pre">{issue.currentCss}</pre>
            </div>
          </div>

          {/* Recommended Fix code block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 block">
                Recommended Fix
              </span>
              <button
                type="button"
                onClick={handleCopyFix}
                className="flex items-center gap-1 text-[11px] font-mono text-[#0B0B0B]/60 hover:text-[#0B0B0B] transition-colors p-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-[#0B0B0B] text-[#F5F3EE] p-3 rounded-md font-mono text-xs border border-[#0B0B0B]/20 overflow-x-auto relative">
              <pre className="text-xs leading-relaxed text-[#F5F3EE] whitespace-pre">{issue.recommendedFix}</pre>
            </div>
          </div>

          {/* Inspect link */}
          <button
            type="button"
            onClick={() => onViewInLab(issue.viewport, issue.element)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-[#0B0B0B]/20 text-xs font-mono text-[#0B0B0B] rounded-md hover:bg-[#0B0B0B]/5 transition-colors min-h-[40px]"
          >
            <Eye className="w-3.5 h-3.5 text-[#0B0B0B]/70 flex-shrink-0" />
            <span className="truncate">View Element in Viewport Lab</span>
            <ArrowRight className="w-3 h-3 text-[#0B0B0B]/40 flex-shrink-0" />
          </button>
        </div>

        {/* Panel Footer Actions - Sticky & Safe bottom */}
        <div className="p-4 sm:p-6 border-t border-[#0B0B0B]/10 bg-[#F5F3EE] flex flex-col gap-2.5 flex-shrink-0 safe-bottom">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isApplying || issue.status === 'Autofixed'}
              onClick={handleApply}
              className="w-full py-2.5 px-3 bg-[#0B0B0B] text-[#F5F3EE] text-xs font-medium rounded-md hover:bg-[#0B0B0B]/85 transition-all text-center disabled:opacity-50 min-h-[42px]"
            >
              {isApplying ? 'Verifying Layout...' : issue.status === 'Autofixed' ? 'Fix Applied' : 'Apply Fix'}
            </button>

            <button
              type="button"
              onClick={() => onMarkResolved(issue.id)}
              className="w-full py-2.5 px-3 border border-[#0B0B0B]/20 text-[#0B0B0B] text-xs font-medium rounded-md hover:bg-[#0B0B0B]/5 transition-all text-center min-h-[42px]"
            >
              Mark Resolved
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => onIgnore(issue.id)}
              className="text-xs font-mono text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors py-1"
            >
              Ignore this instance
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono text-[#0B0B0B]/70 hover:text-[#0B0B0B] transition-colors py-1"
            >
              Close Panel
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
