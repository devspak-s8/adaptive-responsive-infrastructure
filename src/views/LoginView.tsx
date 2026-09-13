import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Github } from 'lucide-react';
import { PageType } from '../types';

interface LoginViewProps {
  onNavigate?: (page: PageType) => void;
  onSignIn: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onSignIn, loading = false, error }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  return <div className="min-h-[100dvh] bg-[#F5F3EE] flex text-[#0B0B0B]">
    <div className="hidden md:flex md:w-1/2 p-8 lg:p-12 flex-col justify-between border-r border-[#0B0B0B]/10">
      <button type="button" onClick={() => onNavigate?.('landing')} className="flex items-center gap-2.5 text-left">
        <div className="w-6 h-6 border border-[#0B0B0B] flex items-center justify-center rounded-[4px]"><div className="w-2.5 h-2.5 border border-current" /></div>
        <span className="font-mono text-sm tracking-widest uppercase font-semibold">ADAPTIVE</span>
      </button>
      <div><div className="text-xs font-mono text-[#0B0B0B]/40 uppercase tracking-wider">Autonomous Layout Infrastructure</div>
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight max-w-sm mt-4">Automated responsive layout monitoring and zero-regression runtime repair.</h1></div>
      <div className="text-xs font-mono text-[#0B0B0B]/50">Responsive infrastructure for every viewport</div>
    </div>
    <div className="w-full md:w-1/2 flex items-center justify-center p-5 sm:p-8 md:p-12">
      <div className="w-full max-w-sm space-y-6">
        <button type="button" onClick={() => onNavigate?.('landing')} className="flex items-center gap-1.5 text-xs font-mono text-[#0B0B0B]/60"><ArrowLeft className="w-3.5 h-3.5" />Back to Landing</button>
        <div><h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-xs text-[#0B0B0B]/60 mt-1">Monitor and protect your interfaces across every viewport.</p></div>
        <button type="button" disabled={loading || isSigningIn} onClick={() => void handleSignIn()}
          className="w-full py-3 bg-[#0B0B0B] text-[#F5F3EE] font-mono text-xs rounded-md flex items-center justify-center gap-2 disabled:opacity-50">
          <Github className="w-4 h-4" />{isSigningIn || loading ? 'Connecting…' : 'Continue with GitHub'}<ArrowRight className="w-3.5 h-3.5" />
        </button>
        {error && <div role="alert" className="p-3 border border-[#0B0B0B]/20 rounded-md text-xs font-mono text-[#0B0B0B]/70 text-center">{error}</div>}
      </div>
    </div>
  </div>;
};
