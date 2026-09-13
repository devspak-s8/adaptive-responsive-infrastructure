import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { PageType, UserSession } from '../types';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingHeader } from '../components/landing/LandingHeader';
import { formatMonthlyPrice, getPlanLimits, type PlanId, PLAN_LIMITS } from '../config/plans';

interface PricingViewProps {
  onNavigate: (page: PageType) => void;
  userSession: UserSession | null;
}

const planOrder: PlanId[] = ['free', 'developer', 'autopilot'];

const comparisonRows: { label: string; values: string[] }[] = [
  { label: 'Projects', values: ['1', '5', '10'] },
  { label: 'Monthly monitored sessions', values: ['2,500', '25,000', '100,000'] },
  { label: 'Real viewport detection', values: ['Included', 'Included', 'Included'] },
  { label: 'Responsive issue detection', values: ['Included', 'Included', 'Included'] },
  { label: 'Dashboard', values: ['Included', 'Included', 'Included'] },
  { label: 'Code recommendations', values: ['5 / month', 'Unlimited', 'Unlimited'] },
  { label: 'Runtime adaptation', values: ['Basic', 'Included', 'Included'] },
  { label: 'Automatic fixing', values: ['—', '—', 'Included'] },
  { label: 'Autofix verification', values: ['—', '—', 'Included'] },
  { label: 'Automatic rollback', values: ['—', '—', 'Included'] },
  { label: 'Issue / fix history', values: ['7 days', '30 days', '90 days'] },
  { label: 'Deployment monitoring', values: ['—', 'Included', 'Included'] },
];

const faqs = [
  { q: 'Are screen sizes billed separately?', a: 'No. Adaptive handles arbitrary viewports at runtime. Plans are based on projects and monthly monitored sessions.' },
  { q: 'What does Autopilot add?', a: 'Autopilot can automatically apply a responsive correction, verify it, roll it back when verification fails, and keep the full fix history.' },
  { q: 'What happens when I reach a usage limit?', a: 'Existing data is retained and the runtime degrades safely. Expensive cloud analysis pauses until the next period or an upgrade; your production site is not taken down.' },
  { q: 'Can I cancel a paid plan?', a: 'Yes. Bachs keeps access active through the current billing period. After it ends, the account returns to Free without deleting projects or history.' },
];

export const PricingView: React.FC<PricingViewProps> = ({ onNavigate, userSession }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const startPlan = async (plan: PlanId) => {
    setCheckoutError(null);
    if (!userSession?.isAuthenticated) {
      onNavigate('login');
      return;
    }
    if (plan === 'free') {
      onNavigate('overview');
      return;
    }
    setCheckoutLoading(plan);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? 'Checkout is not available right now.');
      window.location.assign(payload.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout is not available right now.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F5F3EE] text-[#0B0B0B] flex flex-col font-sans selection:bg-[#0B0B0B] selection:text-[#F5F3EE] safe-top safe-bottom">
      <LandingHeader onNavigate={onNavigate} userSession={userSession} onOpenGitHubAuth={() => onNavigate('login')} onOpenPricing={() => undefined} />
      <main className="flex-1">
        <section className="pt-14 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0B0B0B]/50">Simple usage-based pricing</p>
          <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.08]">Find the problems. Prevent them. Let us handle them.</h1>
          <p className="mt-5 text-sm sm:text-base text-[#0B0B0B]/65 max-w-2xl mx-auto leading-relaxed">Every plan includes real viewport detection, responsive issue detection, and the dashboard. Upgrade for more projects, sessions, and automation.</p>
        </section>

        {checkoutError && <div role="alert" className="mx-4 sm:mx-6 lg:mx-auto max-w-6xl mb-6 border border-[#0B0B0B]/20 bg-[#0B0B0B]/[0.03] px-4 py-3 text-sm font-mono">{checkoutError}</div>}

        <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
            {planOrder.map((planId) => {
              const plan = getPlanLimits(planId);
              const featured = planId === 'autopilot';
              const cta = planId === 'free' ? 'Start Free' : planId === 'developer' ? 'Upgrade to Developer' : 'Enable Autopilot';
              return (
                <article key={planId} className={`relative flex flex-col rounded-md p-6 sm:p-7 border ${featured ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B] md:-translate-y-2 shadow-xl' : 'bg-[#F5F3EE] border-[#0B0B0B]/15'}`}>
                  {featured && <span className="absolute -top-3 left-6 px-2.5 py-1 bg-[#F5F3EE] text-[#0B0B0B] border border-[#0B0B0B] text-[10px] font-mono uppercase tracking-wider">Most hands-off</span>}
                  <div>
                    <p className={`text-[11px] font-mono uppercase tracking-[0.16em] ${featured ? 'text-[#F5F3EE]/55' : 'text-[#0B0B0B]/50'}`}>{plan.name}</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight">{formatMonthlyPrice(planId)}<span className={`text-xs font-mono font-normal ${featured ? 'text-[#F5F3EE]/55' : 'text-[#0B0B0B]/50'}`}> / month</span></h2>
                    <p className={`mt-3 min-h-[42px] text-sm leading-relaxed ${featured ? 'text-[#F5F3EE]/70' : 'text-[#0B0B0B]/65'}`}>{planId === 'free' && 'For trying the runtime on a portfolio or side project.'}{planId === 'developer' && 'For developers shipping production applications.'}{planId === 'autopilot' && 'For developers who want responsive protection handled automatically.'}</p>
                    <div className={`mt-6 pt-5 border-t ${featured ? 'border-[#F5F3EE]/15' : 'border-[#0B0B0B]/10'}`}>
                      <p className={`text-[11px] font-mono uppercase tracking-wider ${featured ? 'text-[#F5F3EE]/45' : 'text-[#0B0B0B]/45'}`}>Includes</p>
                      <ul className="mt-3 space-y-2.5 text-sm">
                        <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" />{plan.projects} {plan.projects === 1 ? 'project' : 'projects'}</li>
                        <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" />{plan.monthlySessions.toLocaleString()} monitored sessions / month</li>
                        <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" />{plan.codeRecommendations === Infinity ? 'Unlimited' : plan.codeRecommendations} code recommendations</li>
                        <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" />{plan.runtimeAdaptation === 'basic' ? 'Basic' : 'Advanced'} runtime adaptation</li>
                        {planId !== 'free' && <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" />Deployment monitoring</li>}
                        {plan.autofix && <li className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" />Automatic fixing, verification, and rollback</li>}
                      </ul>
                    </div>
                  </div>
                  <button type="button" onClick={() => void startPlan(planId)} disabled={checkoutLoading !== null} className={`mt-8 w-full min-h-[44px] px-4 py-3 rounded-md text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors ${featured ? 'bg-[#F5F3EE] text-[#0B0B0B] hover:bg-white' : 'bg-[#0B0B0B] text-[#F5F3EE] hover:bg-[#0B0B0B]/85'} disabled:opacity-60`}>
                    {checkoutLoading === planId ? 'Opening checkout…' : cta}<ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#0B0B0B]/10">
          <div className="max-w-3xl mb-8"><h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Compare plans</h2><p className="mt-2 text-sm text-[#0B0B0B]/60">No screen-size metering. Limits are based on projects and monitored sessions.</p></div>
          <div className="border border-[#0B0B0B]/15 rounded-md overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr className="border-b border-[#0B0B0B]/15 bg-[#0B0B0B]/[0.03]"><th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Capability</th>{planOrder.map((id) => <th key={id} className={`px-4 py-3 text-center font-mono text-[11px] uppercase tracking-wider ${id === 'autopilot' ? 'bg-[#0B0B0B]/[0.05]' : ''}`}>{PLAN_LIMITS[id].name}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#0B0B0B]/10">{comparisonRows.map((row) => <tr key={row.label}><td className="px-4 py-3 text-[#0B0B0B]/75">{row.label}</td>{row.values.map((value, index) => <td key={`${row.label}-${index}`} className={`px-4 py-3 text-center font-mono text-xs ${index === 2 ? 'bg-[#0B0B0B]/[0.025]' : ''}`}>{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-[#0B0B0B]/10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-8 space-y-3">{faqs.map((faq, index) => <div key={faq.q} className="border border-[#0B0B0B]/15 rounded-md overflow-hidden"><button type="button" onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium">{faq.q}{expandedFaq === index ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}</button>{expandedFaq === index && <p className="px-4 pb-4 text-sm leading-relaxed text-[#0B0B0B]/65">{faq.a}</p>}</div>)}</div>
        </section>
      </main>
      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
};
