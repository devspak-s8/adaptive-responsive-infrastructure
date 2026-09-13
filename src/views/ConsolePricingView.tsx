import React, { useState } from 'react';
import { ArrowRight, Check, CreditCard } from 'lucide-react';
import type { PageType } from '../types';
import { formatMonthlyPrice, getPlanLimits, type PlanId } from '../config/plans';

interface ConsolePricingViewProps {
  currentPlan: PlanId | null;
  onNavigate: (page: PageType) => void;
}

const planOrder: PlanId[] = ['free', 'developer', 'autopilot'];
const planRank: Record<PlanId, number> = { free: 0, developer: 1, autopilot: 2 };

const planDescriptions: Record<PlanId, string> = {
  free: 'Find responsive problems on a real project and see the runtime protect visitors.',
  developer: 'Monitor more projects continuously with unlimited recommendations and deployment checks.',
  autopilot: 'Let Adaptive verify, apply, and roll back responsive fixes automatically.',
};

export const ConsolePricingView: React.FC<ConsolePricingViewProps> = ({ currentPlan, onNavigate }) => {
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 border-b border-[#0B0B0B]/10 pb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0B0B0B]/45">Console / Plans</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Choose your protection level</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#0B0B0B]/60 leading-relaxed">Tune project capacity and automation without leaving your workspace. Your current plan and usage live in Billing.</p>
        </div>
        <button type="button" onClick={() => onNavigate('billing')} className="inline-flex items-center justify-center gap-2 self-start lg:self-auto px-3.5 py-2.5 border border-[#0B0B0B]/15 rounded-md text-xs font-mono hover:bg-[#0B0B0B]/[0.04]">
          <CreditCard className="w-3.5 h-3.5" /> View billing
        </button>
      </div>

      <section className="rounded-md border border-[#0B0B0B]/15 bg-[#0B0B0B] text-[#F5F3EE] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><p className="text-[10px] font-mono uppercase tracking-wider text-[#F5F3EE]/45">Current workspace plan</p><p className="mt-1 text-lg font-semibold">{currentPlan ? getPlanLimits(currentPlan).name : 'Checking status…'}</p></div>
        <p className="text-xs font-mono text-[#F5F3EE]/55">Prices are monthly · no screen-size metering</p>
      </section>

      {checkoutError && <div role="alert" className="border border-[#0B0B0B]/20 bg-[#0B0B0B]/[0.03] rounded-md px-4 py-3 text-sm font-mono">{checkoutError}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {planOrder.map((planId) => {
          const plan = getPlanLimits(planId);
          const isCurrent = currentPlan === planId;
          const isIncluded = currentPlan !== null && planRank[currentPlan] > planRank[planId];
          const featured = planId === 'autopilot';
          return (
            <article key={planId} className={`relative flex flex-col rounded-md border p-5 sm:p-6 ${featured ? 'border-[#0B0B0B] bg-[#0B0B0B] text-[#F5F3EE] shadow-[0_16px_40px_rgba(11,11,11,0.16)]' : 'border-[#0B0B0B]/15 bg-[#F5F3EE]'}`}>
              <div className="flex items-start justify-between gap-3"><div><p className={`text-[10px] font-mono uppercase tracking-[0.16em] ${featured ? 'text-[#F5F3EE]/50' : 'text-[#0B0B0B]/45'}`}>{plan.name}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{formatMonthlyPrice(planId)}<span className={`text-xs font-mono font-normal ${featured ? 'text-[#F5F3EE]/50' : 'text-[#0B0B0B]/45'}`}> / mo</span></p></div>{isCurrent && <span className={`rounded-full border px-2 py-1 text-[10px] font-mono ${featured ? 'border-[#F5F3EE]/30 text-[#F5F3EE]/75' : 'border-[#0B0B0B]/20 text-[#0B0B0B]/60'}`}>Current</span>}</div>
              <p className={`mt-4 min-h-[60px] text-sm leading-relaxed ${featured ? 'text-[#F5F3EE]/65' : 'text-[#0B0B0B]/60'}`}>{planDescriptions[planId]}</p>
              <div className={`mt-5 pt-5 border-t space-y-3 text-xs font-mono ${featured ? 'border-[#F5F3EE]/15' : 'border-[#0B0B0B]/10'}`}>
                <div className="flex items-center justify-between gap-3"><span>Projects</span><span>{plan.projects}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Sessions / month</span><span>{plan.monthlySessions.toLocaleString()}</span></div>
                <div className="flex items-center justify-between gap-3"><span>History</span><span>{plan.historyDays} days</span></div>
                <div className="flex items-center gap-2 pt-1"><Check className="w-3.5 h-3.5 shrink-0" />{plan.autofix ? 'Automatic fixing and rollback' : 'Responsive detection and recommendations'}</div>
              </div>
              <button type="button" disabled={isCurrent || isIncluded || checkoutLoading !== null} onClick={() => void startPlan(planId)} className={`mt-7 w-full min-h-[42px] rounded-md px-4 py-2.5 text-xs font-mono font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 ${featured ? 'bg-[#F5F3EE] text-[#0B0B0B] hover:bg-white' : 'bg-[#0B0B0B] text-[#F5F3EE] hover:bg-[#0B0B0B]/85'}`}>
                {isCurrent ? 'Current plan' : isIncluded ? 'Included' : checkoutLoading === planId ? 'Opening checkout…' : planId === 'free' ? 'Use Free' : `Choose ${plan.name}`} {!isCurrent && !isIncluded && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </article>
          );
        })}
      </section>

      <p className="text-xs text-[#0B0B0B]/50 font-mono">Need to change payment details, cancel, or view renewal dates? Open the Billing page for the live subscription state.</p>
    </div>
  );
};
