import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { PageType, UserSession } from '../types';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingHeader } from '../components/landing/LandingHeader';
import { formatMonthlyPrice, type PlanId } from '../config/plans';

interface PricingViewProps {
  onNavigate: (page: PageType) => void;
  userSession: UserSession | null;
}

const planOrder: PlanId[] = ['free', 'developer', 'autopilot'];
const comparisonRows: { label: string; values: string[] }[] = [
  { label: 'Projects', values: ['2', '10', 'Unlimited*'] },
  { label: 'Real viewport detection', values: ['Included', 'Included', 'Included'] },
  { label: 'Responsive issue detection', values: ['Included', 'Included', 'Included'] },
  { label: 'Runtime adaptation', values: ['Included', 'Included', 'Included'] },
  { label: 'Dashboard & viewport insights', values: ['Included', 'Included', 'Included'] },
  { label: 'Issue history', values: ['7 days', '30 days', '90 days'] },
  { label: 'Permanent code recommendations', values: ['5 / month', 'Unlimited*', 'Unlimited*'] },
  { label: 'GitHub connection', values: ['-', 'Included', 'Included'] },
  { label: 'Deployment monitoring', values: ['-', 'Included', 'Included'] },
  { label: 'Responsive regression detection', values: ['-', 'Included', 'Included'] },
  { label: 'Suggested code patches', values: ['-', 'Included', 'Included'] },
  { label: 'GitHub issue creation', values: ['-', 'Included', 'Included'] },
  { label: 'Production Autofix', values: ['-', '-', 'Included'] },
  { label: 'Fix verification', values: ['-', '-', 'Included'] },
  { label: 'Automatic rollback', values: ['-', '-', 'Included'] },
  { label: 'Automatic fix PRs', values: ['-', '-', 'Included'] },
  { label: 'Source-level fix generation', values: ['-', '-', 'Included'] },
  { label: 'Auto-merge', values: ['-', '-', 'Optional / off by default'] },
];

const cardFeatures: Record<PlanId, string[]> = {
  free: ['2 projects', 'Real viewport monitoring', 'Responsive issue detection', 'Runtime adaptation', '5 code recommendations / month'],
  developer: ['10 projects', 'Everything in Free', 'Unlimited recommendations*', 'GitHub integration', 'Deployment monitoring', 'Responsive regression detection', 'Suggested source patches', 'GitHub issue creation'],
  autopilot: ['Unlimited projects*', 'Everything in Developer', 'Production Autofix', 'Fix verification', 'Automatic rollback', 'Automatic fix PRs', 'Source-level fix generation', 'Auto-merge off by default'],
};

const planTaglines: Record<PlanId, string> = {
  free: 'See what breaks.',
  developer: 'Know exactly how to fix it.',
  autopilot: 'Let us fix it.',
};

const faqs = [
  { q: 'Are screen sizes billed separately?', a: 'No. Adaptive handles arbitrary viewports at runtime. Every plan includes real viewport monitoring.' },
  { q: 'What does Developer add?', a: 'Developer adds GitHub context, deployment monitoring, regression detection, suggested patches, and unlimited recommendations.' },
  { q: 'What does Autopilot add?', a: 'Autopilot adds production Autofix, verification, automatic rollback, source-level fixes, and automatic fix PRs. Auto-merge stays off by default.' },
  { q: 'What happens under fair use?', a: 'We track runtime activity internally to keep the service reliable. If a fair-use threshold is reached, analysis pauses safely while existing protection and data remain available.' },
  { q: 'Can I cancel a paid plan?', a: 'Yes. Bachs keeps access active through the current billing period. After it ends, the account returns to Free without deleting projects or history.' },
];

const includedEverywhere = [
  { title: 'Real viewport detection', detail: 'See the dimensions and routes where visitors actually encounter your interface.' },
  { title: 'Responsive issue detection', detail: 'Catch overflow, collision, wrapping, and modal defects before they become incidents.' },
  { title: 'Runtime adaptation', detail: 'Protect sessions immediately while your team reviews the permanent source fix.' },
  { title: 'Dashboard visibility', detail: 'Keep issues, fixes, deployments, and activity in one workspace.' },
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(response.status >= 500 ? 'Checkout is not available right now.' : (payload.error ?? 'Checkout is not available right now.'));
      }
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
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0B0B0B]/50">Simple plans for responsive protection</p>
          <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.08]">See what breaks. Know how to fix it. Let us handle it.</h1>
          <p className="mt-5 text-sm sm:text-base text-[#0B0B0B]/65 max-w-2xl mx-auto leading-relaxed">Start free on a real project, add the development workflow when you need it, and let Autopilot handle production fixes when you are ready.</p>
        </section>

        <section className="pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="rounded-md border border-[#0B0B0B]/15 bg-[#0B0B0B] text-[#F5F3EE] p-6 sm:p-8">
            <div className="max-w-2xl"><p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#F5F3EE]/50">Included in every plan</p><h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">Start with visibility, then add protection.</h2><p className="mt-3 text-sm leading-relaxed text-[#F5F3EE]/65">Free is useful on a real project. Paid plans add the development workflow and production automation when you need them.</p></div>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{includedEverywhere.map((feature) => <div key={feature.title} className="rounded-md border border-[#F5F3EE]/15 bg-[#F5F3EE]/[0.04] p-4"><Check className="w-4 h-4 text-[#F5F3EE]/70" /><h3 className="mt-3 text-sm font-medium">{feature.title}</h3><p className="mt-2 text-xs leading-relaxed text-[#F5F3EE]/55">{feature.detail}</p></div>)}</div>
          </div>
        </section>

        {checkoutError && <div role="alert" className="mx-4 sm:mx-6 lg:mx-auto max-w-6xl mb-6 border border-[#0B0B0B]/20 bg-[#0B0B0B]/[0.03] px-4 py-3 text-sm font-mono">{checkoutError}</div>}

        <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          {planOrder.map((planId) => {
            const featured = planId === 'autopilot';
            const cta = planId === 'free' ? 'Start Free' : planId === 'developer' ? 'Go Developer' : 'Enable Autopilot';
            return <article key={planId} className={`relative flex flex-col rounded-md p-6 sm:p-7 border ${featured ? 'bg-[#0B0B0B] text-[#F5F3EE] border-[#0B0B0B] md:-translate-y-2 shadow-xl' : 'bg-[#F5F3EE] border-[#0B0B0B]/15'}`}>
              {featured && <span className="absolute -top-3 left-6 px-2.5 py-1 bg-[#F5F3EE] text-[#0B0B0B] border border-[#0B0B0B] text-[10px] font-mono uppercase tracking-wider">Most hands-off</span>}
              <div><p className={`text-[11px] font-mono uppercase tracking-[0.16em] ${featured ? 'text-[#F5F3EE]/55' : 'text-[#0B0B0B]/50'}`}>{planId === 'free' ? 'Free' : planId === 'developer' ? 'Developer' : 'Autopilot'}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{formatMonthlyPrice(planId)}<span className={`text-xs font-mono font-normal ${featured ? 'text-[#F5F3EE]/55' : 'text-[#0B0B0B]/50'}`}> / month</span></h2><p className={`mt-3 min-h-[42px] text-sm leading-relaxed ${featured ? 'text-[#F5F3EE]/70' : 'text-[#0B0B0B]/65'}`}>{planTaglines[planId]}</p><div className={`mt-6 pt-5 border-t ${featured ? 'border-[#F5F3EE]/15' : 'border-[#0B0B0B]/10'}`}><p className={`text-[11px] font-mono uppercase tracking-wider ${featured ? 'text-[#F5F3EE]/45' : 'text-[#0B0B0B]/45'}`}>Includes</p><ul className="mt-3 space-y-2.5 text-sm">{cardFeatures[planId].map((feature) => <li key={feature} className="flex gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0" />{feature}</li>)}</ul></div></div>
              <button type="button" onClick={() => void startPlan(planId)} disabled={checkoutLoading !== null} className={`mt-8 w-full min-h-[44px] px-4 py-3 rounded-md text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors ${featured ? 'bg-[#F5F3EE] text-[#0B0B0B] hover:bg-white' : 'bg-[#0B0B0B] text-[#F5F3EE] hover:bg-[#0B0B0B]/85'} disabled:opacity-60`}>{checkoutLoading === planId ? 'Opening checkout...' : cta}<ArrowRight className="w-3.5 h-3.5" /></button>
            </article>;
          })}
        </div></section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#0B0B0B]/10"><div className="max-w-3xl mb-8"><h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Compare plans</h2><p className="mt-2 text-sm text-[#0B0B0B]/60">No screen-size or session metering on the pricing page. Unlimited features are subject to reasonable fair use.</p></div><div className="border border-[#0B0B0B]/15 rounded-md overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-[#0B0B0B]/15 bg-[#0B0B0B]/[0.03]"><th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Capability</th>{planOrder.map((id) => <th key={id} className={`px-4 py-3 text-center font-mono text-[11px] uppercase tracking-wider ${id === 'autopilot' ? 'bg-[#0B0B0B]/[0.05]' : ''}`}>{id === 'free' ? 'Free' : id === 'developer' ? 'Developer' : 'Autopilot'}</th>)}</tr></thead><tbody className="divide-y divide-[#0B0B0B]/10">{comparisonRows.map((row) => <tr key={row.label}><td className="px-4 py-3 text-[#0B0B0B]/75">{row.label}</td>{row.values.map((value, index) => <td key={`${row.label}-${index}`} className={`px-4 py-3 text-center font-mono text-xs ${index === 2 ? 'bg-[#0B0B0B]/[0.025]' : ''}`}>{value}</td>)}</tr>)}</tbody></table></div></section>

        <p className="pb-16 px-4 text-center text-xs font-mono text-[#0B0B0B]/50">* Unlimited features are subject to reasonable fair use.</p>
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-[#0B0B0B]/10"><h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Questions</h2><div className="mt-8 space-y-3">{faqs.map((faq, index) => <div key={faq.q} className="border border-[#0B0B0B]/15 rounded-md overflow-hidden"><button type="button" onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium">{faq.q}{expandedFaq === index ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}</button>{expandedFaq === index && <p className="px-4 pb-4 text-sm leading-relaxed text-[#0B0B0B]/65">{faq.a}</p>}</div>)}</div></section>
      </main>
      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
};
