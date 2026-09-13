import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Check, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { ResponsiveIssue, IssueSeverity } from '../types';

interface IssuesViewProps {
  issues: ResponsiveIssue[];
  onSelectIssue: (issue: ResponsiveIssue) => void;
}

export const IssuesView: React.FC<IssuesViewProps> = ({
  issues,
  onSelectIssue,
}) => {
  const [filterTab, setFilterTab] = useState<'All' | 'Critical' | 'Warnings' | 'Resolved'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViewport, setSelectedViewport] = useState<string>('All');
  const [selectedRoute, setSelectedRoute] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'detected' | 'severity' | 'viewport'>('detected');

  // Derive unique viewports and routes
  const viewportsList = useMemo(() => {
    return Array.from(new Set(issues.map((i) => i.viewport)));
  }, [issues]);

  const routesList = useMemo(() => {
    return Array.from(new Set(issues.map((i) => i.route)));
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Tab filter
      if (filterTab === 'Critical' && issue.severity !== 'High') return false;
      if (filterTab === 'Warnings' && issue.severity !== 'Medium') return false;
      if (filterTab === 'Resolved' && issue.status !== 'Resolved' && issue.status !== 'Autofixed') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchRoute = issue.route.toLowerCase().includes(q);
        const matchElement = issue.element.toLowerCase().includes(q);
        if (!matchTitle && !matchRoute && !matchElement) return false;
      }

      // Viewport filter
      if (selectedViewport !== 'All' && issue.viewport !== selectedViewport) return false;

      // Route filter
      if (selectedRoute !== 'All' && issue.route !== selectedRoute) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'severity') {
        const weight: Record<IssueSeverity, number> = { High: 3, Medium: 2, Low: 1 };
        return weight[b.severity] - weight[a.severity];
      }
      return 0;
    });
  }, [issues, filterTab, searchQuery, selectedViewport, selectedRoute, sortBy]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">
          Responsive Issues
        </h1>
        <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">
          Layout problems detected across monitored viewports.
        </p>
      </div>

      {/* Filter Row */}
      <div className="space-y-3 sm:space-y-4">
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs with overflow scroll for small devices */}
          <div className="flex items-center gap-1 border border-[#0B0B0B]/15 p-1 rounded-md bg-[#F5F3EE] max-w-full overflow-x-auto">
            {(['All', 'Critical', 'Warnings', 'Resolved'] as const).map((tab) => {
              const active = filterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors min-h-[32px] ${
                    active
                      ? 'bg-[#0B0B0B] text-[#F5F3EE] font-medium'
                      : 'text-[#0B0B0B]/60 hover:text-[#0B0B0B]'
                  }`}
                >
                  {tab === 'All' ? 'All Issues' : tab}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-3.5 h-3.5 text-[#0B0B0B]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search selector, route, issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-[#F5F3EE] border border-[#0B0B0B]/15 rounded-md text-[#0B0B0B] placeholder:text-[#0B0B0B]/40 focus:outline-none focus:border-[#0B0B0B] min-h-[36px]"
            />
          </div>
        </div>

        {/* Viewport, Route & Sort selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-xs font-mono text-[#0B0B0B]/70">
          {/* Viewport filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#0B0B0B]/50 whitespace-nowrap">Viewport:</span>
            <select
              aria-label="Filter by Viewport"
              value={selectedViewport}
              onChange={(e) => setSelectedViewport(e.target.value)}
              className="bg-[#F5F3EE] border border-[#0B0B0B]/15 px-2 py-1 rounded text-xs text-[#0B0B0B] focus:outline-none min-h-[32px]"
            >
              <option value="All">All Viewports</option>
              {viewportsList.map((vp) => (
                <option key={vp} value={vp}>{vp}</option>
              ))}
            </select>
          </div>

          {/* Route filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#0B0B0B]/50 whitespace-nowrap">Route:</span>
            <select
              aria-label="Filter by Route"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-[#F5F3EE] border border-[#0B0B0B]/15 px-2 py-1 rounded text-xs text-[#0B0B0B] focus:outline-none min-h-[32px]"
            >
              <option value="All">All Routes</option>
              {routesList.map((rt) => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 sm:ml-auto">
            <span className="text-[#0B0B0B]/50 whitespace-nowrap">Sort by:</span>
            <select
              aria-label="Sort issues"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#F5F3EE] border border-[#0B0B0B]/15 px-2 py-1 rounded text-xs text-[#0B0B0B] focus:outline-none min-h-[32px]"
            >
              <option value="detected">Detected Time</option>
              <option value="severity">Severity (High to Low)</option>
              <option value="viewport">Viewport</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="border border-[#0B0B0B]/10 rounded-md overflow-x-auto bg-[#F5F3EE]">
        {filteredIssues.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-1.5">
            <div className="text-sm font-medium text-[#0B0B0B]">
              No responsive issues yet
            </div>
            <div className="text-xs font-mono text-[#0B0B0B]/50">
              Issues detected from real application traffic will appear here.
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#0B0B0B]/10 bg-[#0B0B0B]/[0.02] text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                <th className="py-3 px-4 font-normal">Issue</th>
                <th className="py-3 px-4 font-normal">Route</th>
                <th className="py-3 px-4 font-normal">Viewport</th>
                <th className="py-3 px-4 font-normal">Element</th>
                <th className="py-3 px-4 font-normal">Severity</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal text-right">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B0B0B]/10 text-xs font-mono">
              {filteredIssues.map((iss) => (
                <tr
                  key={iss.id}
                  onClick={() => onSelectIssue(iss)}
                  className="hover:bg-[#0B0B0B]/[0.03] transition-colors cursor-pointer group"
                >
                  {/* Issue Title */}
                  <td className="py-3.5 px-4 font-medium text-[#0B0B0B]">
                    <div className="flex items-center gap-2 max-w-[220px] truncate">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        iss.status === 'Autofixed' ? 'bg-[#0B0B0B]/30' : 'bg-[#0B0B0B]'
                      }`}></span>
                      <span className="font-sans font-medium text-sm text-[#0B0B0B] truncate">
                        {iss.title}
                      </span>
                    </div>
                  </td>

                  {/* Route */}
                  <td className="py-3.5 px-4 text-[#0B0B0B]/70 font-mono whitespace-nowrap">
                    {iss.route}
                  </td>

                  {/* Viewport */}
                  <td className="py-3.5 px-4 text-[#0B0B0B] font-mono font-medium whitespace-nowrap">
                    {iss.viewport}
                  </td>

                  {/* Element Selector */}
                  <td className="py-3.5 px-4 text-[#0B0B0B]/80 font-mono whitespace-nowrap">
                    <span className="bg-[#0B0B0B]/5 px-1.5 py-0.5 rounded border border-[#0B0B0B]/10">
                      {iss.element}
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] uppercase font-semibold ${
                        iss.severity === 'High'
                          ? 'border-[#0B0B0B] text-[#0B0B0B] bg-[#0B0B0B]/5'
                          : 'border-[#0B0B0B]/30 text-[#0B0B0B]/70'
                      }`}
                    >
                      {iss.severity}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-[11px] font-mono ${
                        iss.status === 'Open'
                          ? 'font-medium text-[#0B0B0B]'
                          : 'text-[#0B0B0B]/50'
                      }`}
                    >
                      {iss.status}
                    </span>
                  </td>

                  {/* Detected */}
                  <td className="py-3.5 px-4 text-right text-[#0B0B0B]/60 whitespace-nowrap">
                    {iss.detected}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Explanatory footer note */}
      {issues.length > 0 && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#0B0B0B]/50 pt-2 border-t border-[#0B0B0B]/10">
        <span>Showing {filteredIssues.length} monitored responsive issues</span>
        <span>Click any row to view detected geometry, selector diff, and recommended CSS fix</span>
      </div>}
    </div>
  );
};
