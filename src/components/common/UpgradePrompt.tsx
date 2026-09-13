import React from 'react';

interface UpgradePromptProps {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onUpgrade: () => void;
}

/** UX-only entitlement prompt. Sensitive actions still require a server check. */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ eyebrow = 'Paid feature', title, description, actionLabel = 'View plans', onUpgrade }) => (
  <section className="border border-[#0B0B0B]/15 rounded-md p-6 sm:p-8 bg-[#F5F3EE] max-w-2xl">
    <p className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">{eyebrow}</p>
    <h2 className="mt-3 text-xl font-semibold">{title}</h2>
    <p className="mt-2 text-sm text-[#0B0B0B]/65 leading-relaxed">{description}</p>
    <button type="button" onClick={onUpgrade} className="mt-5 inline-flex items-center px-4 py-2.5 rounded-md bg-[#0B0B0B] text-[#F5F3EE] text-xs font-mono">{actionLabel}</button>
  </section>
);
