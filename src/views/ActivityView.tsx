import React from 'react';
import { ActivityEvent } from '../types';
import { EmptyState } from '../components/common/EmptyState';

interface ActivityViewProps {
  activities: ActivityEvent[];
  onOpenIssue?: (route?: string, viewport?: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  onOpenIssue,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-16 min-w-0 max-w-full">
      {/* Top Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">
          Activity
        </h1>
        <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-0.5 sm:mt-1">
          Observability event stream of responsive audits, detections, and automated fixes.
        </p>
      </div>

      {/* Feed container with thin separators, NO timeline bubbles or colorful icons */}
      {activities.length === 0 ? (
        <EmptyState title="No activity yet" description="Runtime events, detected issues, adaptations and project activity will appear here." />
      ) : <div className="border border-[#0B0B0B]/10 rounded-md divide-y divide-[#0B0B0B]/10 bg-[#F5F3EE]">
        {activities.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-4 hover:bg-[#0B0B0B]/[0.02] transition-colors"
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              {/* Event title & type */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-[#0B0B0B]">
                  {item.title}
                </span>
                <span className="text-xs text-[#0B0B0B]/30 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm text-[#0B0B0B]/80 font-normal">
                  {item.description}
                </span>
              </div>

              {/* Technical coordinates & metadata */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#0B0B0B]/60 pt-0.5">
                {item.route && (
                  <span className="bg-[#0B0B0B]/5 px-1.5 py-0.5 rounded border border-[#0B0B0B]/10 text-[#0B0B0B]">
                    {item.route}
                  </span>
                )}
                {item.viewport && (
                  <span className="bg-[#0B0B0B]/5 px-1.5 py-0.5 rounded border border-[#0B0B0B]/10 text-[#0B0B0B]">
                    {item.viewport}
                  </span>
                )}
                {item.metadata && (
                  <span className="text-[#0B0B0B]/50 truncate max-w-xs sm:max-w-md">
                    {item.metadata}
                  </span>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-xs font-mono text-[#0B0B0B]/40 whitespace-nowrap self-start sm:self-auto flex-shrink-0">
              {item.time}
            </div>
          </div>
        ))}
      </div>}

      <div className="text-xs font-mono text-[#0B0B0B]/40 text-center pt-2">
        Showing runtime audit telemetry buffer • Retention period: 30 days
      </div>
    </div>
  );
};
