import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { PageType } from '../types';

interface AuthErrorViewProps {
  onNavigate: (page: PageType) => void;
}

export const AuthErrorView: React.FC<AuthErrorViewProps> = ({ onNavigate }) => {
  const errorCode = new URLSearchParams(window.location.search).get('error');
  const isConfigurationError = errorCode === 'Configuration' || errorCode === 'AdapterError';

  return (
    <div className="min-h-[100dvh] bg-[#F5F3EE] text-[#0B0B0B] flex items-center justify-center p-5 sm:p-8">
      <main className="w-full max-w-lg">
        <button type="button" onClick={() => onNavigate('landing')} className="flex items-center gap-2 mb-12">
          <div className="w-6 h-6 border border-[#0B0B0B] flex items-center justify-center rounded-[4px]"><div className="w-2.5 h-2.5 border border-current" /></div>
          <span className="font-mono text-sm tracking-widest uppercase font-semibold">ADAPTIVE</span>
        </button>

        <section className="border border-[#0B0B0B]/15 rounded-lg bg-[#F5F3EE] p-6 sm:p-8">
          <div className="text-[11px] font-mono tracking-widest text-[#0B0B0B]/45 uppercase">502 / Server error</div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-3">We couldn’t complete sign-in.</h1>
          <p className="text-sm text-[#0B0B0B]/60 leading-relaxed mt-3">
            The authentication service is temporarily unavailable. Please try again in a moment.
          </p>
          {isConfigurationError && (
            <p className="text-xs font-mono text-[#0B0B0B]/50 leading-relaxed mt-3">
              If this keeps happening, the server configuration needs attention.
            </p>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-2 mt-7">
            <button type="button" onClick={() => onNavigate('landing')} className="px-4 py-2 border border-[#0B0B0B]/20 rounded-md text-xs font-mono min-h-[38px]">
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1.5" />Back to home
            </button>
            <button type="button" onClick={() => onNavigate('login')} className="px-4 py-2 bg-[#0B0B0B] text-[#F5F3EE] rounded-md text-xs font-mono min-h-[38px]">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />Try again
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
