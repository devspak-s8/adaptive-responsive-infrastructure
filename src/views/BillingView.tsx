import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import type { PageType } from '../types';
import { getPlanLimits, type PlanId } from '../config/plans';

interface BillingViewProps {
  onNavigate: (page: PageType) => void;
}

interface BillingStatus {
  plan: PlanId;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd?: boolean;
  projectsUsed: number;
  monitoredSessions: number;
  recommendationsGenerated: number;
}

const usagePercent = (used: number, limit: number) => Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

export const BillingView: React.FC<BillingViewProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);

  const loadStatus = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/billing/status', { credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as Partial<BillingStatus> & { error?: string };
      if (!response.ok) throw new Error(response.status >= 500 ? 'Billing status is unavailable.' : (payload.error ?? 'Billing status is unavailable.'));
      setStatus({
        plan: payload.plan ?? 'free',
        status: payload.status ?? 'ACTIVE',
        currentPeriodEnd: payload.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd ?? false,
        projectsUsed: payload.projectsUsed ?? 0,
        monitoredSessions: payload.monitoredSessions ?? 0,
        recommendationsGenerated: payload.recommendationsGenerated ?? 0,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Billing status is unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setCheckoutConfirmed(true);
      window.history.replaceState({}, '', '/billing');
    }
    void loadStatus();
  }, [loadStatus]);

  const openPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST', credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(response.status >= 500 ? 'Billing portal is unavailable.' : (payload.error ?? 'Billing portal is unavailable.'));
      }
      window.location.assign(payload.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Billing portal is unavailable.');
    } finally {
      setPortalLoading(false);
    }
  };

  const plan = useMemo(() => status ? getPlanLimits(status.plan) : null, [status]);
  const periodEnd = status?.currentPeriodEnd ? new Date(status.currentPeriodEnd).toLocaleDateString() : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Billing & usage</h1>
          <p className="mt-1 text-sm text-[#0B0B0B]/60">Manage your Bachs subscription and see the usage that drives your plan.</p>
        </div>
        <button type="button" onClick={() => void loadStatus(true)} disabled={loading || refreshing} className="inline-flex items-center justify-center gap-2 self-start px-3 py-2 border border-[#0B0B0B]/15 rounded-md text-xs font-mono hover:bg-[#0B0B0B]/[0.04] disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {checkoutConfirmed && (
        <div role="status" className="flex items-start gap-3 rounded-md border border-emerald-900/20 bg-emerald-900/[0.05] px-4 py-3 text-sm text-emerald-950">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <p><span className="font-medium">Checkout completed.</span> Bachs is confirming your subscription. Refresh in a moment if the plan still shows Free.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-[#0B0B0B]/20 bg-[#0B0B0B]/[0.03] px-4 py-3 text-sm text-[#0B0B0B]/75">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <section className="border border-[#0B0B0B]/10 rounded-md p-6 animate-pulse" aria-label="Loading billing status">
          <div className="h-3 w-24 rounded bg-[#0B0B0B]/10" />
          <div className="mt-3 h-8 w-40 rounded bg-[#0B0B0B]/10" />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-md bg-[#0B0B0B]/[0.06]" />)}
          </div>
        </section>
      )}

      {status && plan && (
        <>
          <section className="border border-[#0B0B0B]/15 rounded-md p-6 bg-[#F5F3EE] shadow-[0_12px_30px_rgba(11,11,11,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">Current plan</p>
                <h2 className="mt-2 text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-[#0B0B0B]/60">${plan.priceMonthly}/month · {status.status.toLowerCase().replace('_', ' ')}</p>
                {periodEnd && <p className="mt-2 text-xs font-mono text-[#0B0B0B]/55">{status.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {periodEnd}</p>}
              </div>
              {status.plan !== 'free' && (
                <button type="button" onClick={() => void openPortal()} disabled={portalLoading} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B0B0B] text-[#F5F3EE] rounded-md text-xs font-mono hover:bg-[#0B0B0B]/85 disabled:opacity-60">
                  {portalLoading ? 'Opening…' : 'Manage billing'} <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Projects', used: status.projectsUsed, limit: plan.projects, value: `${status.projectsUsed} / ${plan.projects}` },
                { label: 'Monitored sessions', used: status.monitoredSessions, limit: plan.monthlySessions, value: `${status.monitoredSessions.toLocaleString()} / ${plan.monthlySessions.toLocaleString()}` },
                { label: 'Recommendations', used: status.recommendationsGenerated, limit: plan.codeRecommendations, value: `${status.recommendationsGenerated.toLocaleString()} / ${plan.codeRecommendations === Infinity ? '∞' : plan.codeRecommendations}` },
              ].map((metric) => (
                <div key={metric.label} className="border border-[#0B0B0B]/10 rounded-md p-4">
                  <div className="flex items-center justify-between gap-2"><p className="text-xs text-[#0B0B0B]/55">{metric.label}</p><p className="font-mono text-xs text-[#0B0B0B]/60">{metric.value}</p></div>
                  <div className="mt-3 h-1.5 rounded-full bg-[#0B0B0B]/10 overflow-hidden"><div className="h-full rounded-full bg-[#0B0B0B]" style={{ width: `${metric.limit === Infinity ? 0 : usagePercent(metric.used, metric.limit)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          {status.plan !== 'autopilot' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border border-[#0B0B0B]/10 px-4 py-4">
              <div><p className="text-sm font-medium">Need more protection?</p><p className="mt-1 text-xs text-[#0B0B0B]/60">Compare Developer and Autopilot to unlock more projects, sessions, and automation.</p></div>
              <button type="button" onClick={() => onNavigate('pricing')} className="inline-flex items-center gap-2 text-sm font-mono underline underline-offset-4 self-start sm:self-auto">View plans <ArrowRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}

      {!loading && !status && (
        <div className="border border-[#0B0B0B]/10 rounded-md p-6">
          <p className="text-sm text-[#0B0B0B]/70">We could not load the live billing account.</p>
          <button type="button" onClick={() => void loadStatus(true)} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B0B0B] text-[#F5F3EE] rounded-md text-xs font-mono">Try again <RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
};
