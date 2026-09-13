import React, { useEffect, useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { PageType } from '../types';
import { getPlanLimits, type PlanId } from '../config/plans';

interface BillingViewProps { onNavigate: (page: PageType) => void; }
interface BillingStatus { plan: PlanId; status: string; currentPeriodEnd: string | null; projectsUsed: number; monitoredSessions: number; recommendationsGenerated: number; }

export const BillingView: React.FC<BillingViewProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/billing/status', { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(response.status >= 500 ? 'Billing status is unavailable.' : (payload.error ?? 'Billing status is unavailable.'));
        return payload as BillingStatus;
      })
      .then((payload) => { if (active) setStatus(payload); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Billing status is unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST', credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        const message = response.status >= 500 ? 'Billing portal is unavailable.' : (payload.error ?? 'Billing portal is unavailable.');
        throw new Error(message);
      }
      window.location.assign(payload.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Billing portal is unavailable.');
    } finally {
      setPortalLoading(false);
    }
  };

  const plan = status ? getPlanLimits(status.plan) : null;
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div><p className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">Account</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Billing</h1><p className="mt-1 text-sm text-[#0B0B0B]/60">Your plan and measured usage. Subscription state is confirmed by Bachs webhooks.</p></div>
      {loading && <div className="border border-[#0B0B0B]/10 rounded-md p-5 text-sm font-mono text-[#0B0B0B]/60">Loading billing status…</div>}
      {error && <div role="alert" className="border border-[#0B0B0B]/20 rounded-md p-4 text-sm text-[#0B0B0B]/70">{error}</div>}
      {status && plan && <>
        <section className="border border-[#0B0B0B]/15 rounded-md p-6 bg-[#F5F3EE]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5"><div><p className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">Current plan</p><h2 className="mt-2 text-2xl font-semibold">{plan.name}</h2><p className="mt-1 text-sm text-[#0B0B0B]/60">${plan.priceMonthly}/month · {status.status.toLowerCase()}</p></div>{status.plan !== 'free' && <button type="button" onClick={() => void openPortal()} disabled={portalLoading} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B0B0B] text-[#F5F3EE] rounded-md text-xs font-mono disabled:opacity-60">{portalLoading ? 'Opening…' : 'Manage billing'}<ExternalLink className="w-3.5 h-3.5" /></button>}</div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="border border-[#0B0B0B]/10 rounded-md p-4"><p className="text-xs text-[#0B0B0B]/55">Projects</p><p className="mt-2 font-mono text-lg">{status.projectsUsed} / {plan.projects}</p></div><div className="border border-[#0B0B0B]/10 rounded-md p-4"><p className="text-xs text-[#0B0B0B]/55">Monitored sessions</p><p className="mt-2 font-mono text-lg">{status.monitoredSessions.toLocaleString()} / {plan.monthlySessions.toLocaleString()}</p></div><div className="border border-[#0B0B0B]/10 rounded-md p-4"><p className="text-xs text-[#0B0B0B]/55">Recommendations</p><p className="mt-2 font-mono text-lg">{status.recommendationsGenerated.toLocaleString()} / {plan.codeRecommendations === Infinity ? '∞' : plan.codeRecommendations}</p></div></div>
          {status.currentPeriodEnd && <p className="mt-5 text-xs font-mono text-[#0B0B0B]/55">Renews {new Date(status.currentPeriodEnd).toLocaleDateString()}</p>}
        </section>
        {status.plan !== 'autopilot' && <button type="button" onClick={() => onNavigate('pricing')} className="inline-flex items-center gap-2 text-sm font-mono underline underline-offset-4">{status.plan === 'free' ? 'Upgrade your plan' : 'Upgrade to Autopilot'}<ArrowRight className="w-4 h-4" /></button>}
      </>}
      {!loading && !status && <div className="border border-[#0B0B0B]/10 rounded-md p-6"><p className="text-sm text-[#0B0B0B]/70">Connect the billing service to view the account’s live plan and usage.</p><button type="button" onClick={() => onNavigate('pricing')} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B0B0B] text-[#F5F3EE] rounded-md text-xs font-mono">View plans<ArrowRight className="w-3.5 h-3.5" /></button></div>}
    </div>
  );
};
