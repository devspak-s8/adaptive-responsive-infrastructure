import React from 'react';
import { PageType, UserSession } from '../types';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingFooter } from '../components/landing/LandingFooter';

interface LandingViewProps {
  onNavigate: (page: PageType) => void;
  userSession: UserSession | null;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, userSession }) => (
  <div className="min-h-screen min-h-[100dvh] bg-[#F5F3EE] text-[#0B0B0B] flex flex-col font-sans selection:bg-[#0B0B0B] selection:text-[#F5F3EE] safe-top safe-bottom">
    <LandingHeader onNavigate={onNavigate} userSession={userSession}
      onOpenGitHubAuth={() => onNavigate('login')} onOpenPricing={() => onNavigate('pricing')} />
    <main className="flex-1">
      <LandingHero onNavigate={onNavigate} onOpenGitHubAuth={() => onNavigate('login')} />
      <LandingFeatures onNavigate={onNavigate} />
    </main>
    <LandingFooter onNavigate={onNavigate} />
  </div>
);
