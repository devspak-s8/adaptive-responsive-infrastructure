import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import type { PageType } from '../types';
import { formatMonthlyPrice, getPlanLimits, type PlanId } from '../config/plans';

interface ConsolePricingViewProps {
  currentPlan: PlanId | null;
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

const planOrder: PlanId[] = ['free', 'developer', 'autopilot'];
const planRank: Record<PlanId, number> = { free: 0, developer: 1, autopilot: 2 };
const planDescriptions: Record<PlanId, string> = {
  free: 'See what breaks.',
  developer: 'Know exactly how to fix it.',
  autopilot: 'Let us fix it.',
};
const usagePercent = (used: number, limit: number): number => Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
const limitLabel = (limit: number): string => limit === Infinity ? 'Unlimited' : limit.toLocaleString();
const planDetails: Array<{ label: string; values: Record<PlanId, string> }> = [
  { label: 'Monthly monitored sessions', values: { free: '2,500', developer: '25,000', autopilot: '100,000' } },
  { label: 'Real viewport detection', values: { free: 'Included', developer: 'Included', autopilot: 'Included' } },
  { label: 'Responsive issue detection', values: { free: 'Included', developer: 'Included', autopilot: 'Included' } },
  { label: 'Runtime adaptation', values: { free: 'Basic', developer: 'Standard', autopilot: 'Advanced' } },
  { label: 'Code recommendations', values: { free: '5 / month', developer: 'Unlimited*', autopilot: 'Unlimited*' } },
  { label: 'Deployment regression monitoring', values: { free: 'Upgrade required', developer: 'Included', autopilot: 'Included' } },
  { label: 'Automatic fixing', values: { free: 'Upgrade required', developer: 'Upgrade required', autopilot: 'Included' } },
  { label: 'Verification and rollback', values: { free: 'Upgrade required', developer: 'Upgrade required', autopilot: 'Included' } },
  { label: 'Issue and fix history', values: { free: '7 days', developer: '30 days', autopilot: '90 days' } },
];

export const ConsolePricingView: React.FC<ConsolePricingViewProps> = ({ currentPlan, onNavigate }) => {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);

  const loadStatus = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setStatusError(null);
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
      setStatusError(reason instanceof Error ? reason.message : 'Billing status is unavailable.');
    } finally {
      setStatusLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setCheckoutConfirmed(true);
      window.history.replaceState({}, '', '/pricing');
    }
    void loadStatus();
  }, [loadStatus]);

  const activePlanId = status?.plan ?? currentPlan ?? 'free';
  const activePlan = useMemo(() => getPlanLimits(activePlanId), [activePlanId]);
  const periodEnd = status?.currentPeriodEnd ? new Date(status.currentPeriodEnd).toLocaleDateString() : null;

  const startPlan = async (plan: PlanId) => {
    if (plan === 'free') {
      onNavigate('overview');
      return;
    }
    setCheckoutError(null);
    setCheckoutLoading(plan);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(response.status >= 500 ? 'Checkout is not available right now.' : (payload.error ?? 'Checkout is not available right now.'));
      window.location.assign(payload.url);
    } catch (reason) {
      setCheckoutError(reason instanceof Error ? reason.message : 'Checkout is not available right now.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    setStatusError(null);
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST', credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(response.status >= 500 ? 'Billing portal is unavailable.' : (payload.error ?? 'Billing portal is unavailable.'));
      window.location.assign(payload.url);
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : 'Billing portal is unavailable.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 border-b border-[#0B0B0B]/10 pb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0B0B0B]/45">Console / Plans & billing</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Plans & billing</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#0B0B0B]/60 leading-relaxed">Choose your protection level, manage your subscription, and monitor usage from one workspace.</p>
        </div>
        <button type="button" onClick={() => void loadStatus(true)} disabled={statusLoading || refreshing} className="inline-flex items-center justify-center gap-2 self-start lg:self-auto px-3.5 py-2.5 border border-[#0B0B0B]/15 rounded-md text-xs font-mono hover:bg-[#0B0B0B]/[0.04] disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh usage
        </button>
      </div>

      {checkoutConfirmed && <div role="status" className="flex items-start gap-3 rounded-md border border-emerald-900/20 bg-emerald-900/[0.05] px-4 py-3 text-sm text-emerald-950"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><p><span className="font-medium">Checkout completed.</span> Bachs is confirming your subscription. Refresh in a moment if the plan still shows Free.</p></div>}
      {(checkoutError || statusError) && <div role="alert" className="flex items-start gap-3 rounded-md border border-[#0B0B0B]/20 bg-[#0B0B0B]/[0.03] px-4 py-3 text-sm text-[#0B0B0B]/75"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p>{checkoutError ?? statusError}</p></div>}

      <section className="rounded-md border border-[#0B0B0B]/15 bg-[#0B0B0B] text-[#F5F3EE] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div><p className="text-[10px] font-mono uppercase tracking-wider text-[#F5F3EE]/45">Current workspace plan</p><h2 className="mt-1 text-2xl font-semibold">{activePlan.name}</h2><p className="mt-1 text-sm text-[#F5F3EE]/60">{formatMonthlyPrice(activePlanId)}/month - {status?.status?.toLowerCase().replace('_', ' ') ?? 'checking status'}</p>{periodEnd && <p className="mt-2 text-xs font-mono text-[#F5F3EE]/50">{status?.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {periodEnd}</p>}</div>
          {activePlanId !== 'free' && <button type="button" onClick={() => void openPortal()} disabled={portalLoading} className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 bg-[#F5F3EE] text-[#0B0B0B] rounded-md text-xs font-mono hover:bg-white disabled:opacity-60">{portalLoading ? 'Opening...' : 'Manage billing'} <ExternalLink className="w-3.5 h-3.5" /></button>}
        </div>
        {statusLoading && !status ? <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse" aria-label="Loading billing usage">{[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-md bg-[#F5F3EE]/10" />)}</div> : status ? <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Projects', used: status.projectsUsed, limit: activePlan.projects, value: `${status.projectsUsed} / ${limitLabel(activePlan.projects)}` },
            { label: 'Monitored sessions', used: status.monitoredSessions, limit: activePlan.monthlySessions, value: `${status.monitoredSessions.toLocaleString()} / ${activePlan.monthlySessions.toLocaleString()}` },
            { label: 'Recommendations', used: status.recommendationsGenerated, limit: activePlan.codeRecommendations, value: `${status.recommendationsGenerated.toLocaleString()} / ${limitLabel(activePlan.codeRecommendations)}` },
          ].map((metric) => <div key={metric.label} className="border border-[#F5F3EE]/15 rounded-md p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs text-[#F5F3EE]/55">{metric.label}</p><p className="font-mono text-xs text-[#F5F3EE]/65">{metric.value}</p></div><div className="mt-3 h-1.5 rounded-full bg-[#F5F3EE]/15 overflow-hidden"><div className="h-full rounded-full bg-[#F5F3EE]" style={{ width: `${metric.limit === Infinity ? 0 : usagePercent(metric.used, metric.limit)}%` }} /></div></div>)}
        </div> : null}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4"><div><p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#0B0B0B]/45">Plans</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose your protection level</h2></div><p className="hidden sm:block text-xs font-mono text-[#0B0B0B]/45">Monthly pricing - fair use applies</p></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {planOrder.map((planId) => {
            const plan = getPlanLimits(planId);
            const isCurrent = activePlanId === planId;
            const isIncluded = planRank[activePlanId] > planRank[planId];
            const featured = planId === 'autopilot';
            return <article key={planId} className={`relative flex flex-col rounded-md border p-5 sm:p-6 ${featured ? 'border-[#0B0B0B] bg-[#0B0B0B] text-[#F5F3EE] shadow-[0_16px_40px_rgba(11,11,11,0.16)]' : 'border-[#0B0B0B]/15 bg-[#F5F3EE]'}`}>
              <div className="flex items-start justify-between gap-3"><div><p className={`text-[10px] font-mono uppercase tracking-[0.16em] ${featured ? 'text-[#F5F3EE]/50' : 'text-[#0B0B0B]/45'}`}>{plan.name}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{formatMonthlyPrice(planId)}<span className={`text-xs font-mono font-normal ${featured ? 'text-[#F5F3EE]/50' : 'text-[#0B0B0B]/45'}`}> / mo</span></p></div>{isCurrent && <span className={`rounded-full border px-2 py-1 text-[10px] font-mono ${featured ? 'border-[#F5F3EE]/30 text-[#F5F3EE]/75' : 'border-[#0B0B0B]/20 text-[#0B0B0B]/60'}`}>Current</span>}</div>
              <p className={`mt-4 min-h-[60px] text-sm leading-relaxed ${featured ? 'text-[#F5F3EE]/65' : 'text-[#0B0B0B]/60'}`}>{planDescriptions[planId]}</p>
              <div className={`mt-5 pt-5 border-t space-y-3 text-xs font-mono ${featured ? 'border-[#F5F3EE]/15' : 'border-[#0B0B0B]/10'}`}><div className="flex items-center justify-between gap-3"><span>Projects</span><span>{limitLabel(plan.projects)}</span></div><div className="flex items-center justify-between gap-3"><span>History</span><span>{plan.historyDays} days</span></div><div className="flex items-center gap-2 pt-1"><Check className="w-3.5 h-3.5 shrink-0" />{plan.autofix ? 'Automatic fixing and rollback' : 'Responsive detection and recommendations'}</div></div>
              <button type="button" disabled={isCurrent || isIncluded || checkoutLoading !== null} onClick={() => void startPlan(planId)} className={`mt-7 w-full min-h-[42px] rounded-md px-4 py-2.5 text-xs font-mono font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 ${featured ? 'bg-[#F5F3EE] text-[#0B0B0B] hover:bg-white' : 'bg-[#0B0B0B] text-[#F5F3EE] hover:bg-[#0B0B0B]/85'}`}>{isCurrent ? 'Current plan' : isIncluded ? 'Included' : checkoutLoading === planId ? 'Opening checkout...' : planId === 'free' ? 'Use Free' : `Choose ${plan.name}`} {!isCurrent && !isIncluded && <ArrowRight className="w-3.5 h-3.5" />}</button>
            </article>;
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div><p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#0B0B0B]/45">Plan details</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Everything included at a glance</h2><p className="mt-1 text-sm text-[#0B0B0B]/60">Settings that require a paid tier are marked clearly before you enable them.</p></div>
        <div className="overflow-x-auto rounded-md border border-[#0B0B0B]/10 bg-[#F5F3EE]"><table className="w-full min-w-[680px] text-left text-xs"><thead><tr className="border-b border-[#0B0B0B]/10 text-[10px] font-mono uppercase tracking-wider text-[#0B0B0B]/45"><th className="px-4 py-3 font-normal">Capability</th>{planOrder.map((planId) => <th key={planId} className="px-4 py-3 font-normal">{getPlanLimits(planId).name}</th>)}</tr></thead><tbody className="divide-y divide-[#0B0B0B]/10">{planDetails.map((detail) => <tr key={detail.label}><td className="px-4 py-3.5 font-medium">{detail.label}</td>{planOrder.map((planId) => <td key={planId} className={`px-4 py-3.5 font-mono ${detail.values[planId] === 'Upgrade required' ? 'text-[#0B0B0B]/45' : ''}`}>{detail.values[planId]}</td>)}</tr>)}</tbody></table></div>
      </section>

      <p className="text-xs text-[#0B0B0B]/50 font-mono">* Unlimited recommendations are subject to reasonable fair use. Manage payment details, cancellation, and renewal dates above.</p>
    </div>
  );
};
