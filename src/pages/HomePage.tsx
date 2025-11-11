import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MinimalHeader } from '../components/MinimalHeader';
import { ScrollToTop } from '../utils';
import { generalLogger } from '../utils/logger';
import { generateReportId } from '../utils/reportIdGenerator';
import UrlGeneratorService from '../services/urlGenerator';
import { VideoBackground } from '../components/VideoBackground';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-redirect to instant valuation if token is present
  // BUT NOT if coming from main platform (upswitch.biz) - let user choose
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const fromMainPlatform = params.get('from') === 'upswitch';
    
    if (token && !fromMainPlatform) {
      generalLogger.info('Token detected on homepage - redirecting to new report');
      // Generate new report ID and redirect
      const newReportId = generateReportId();
      navigate(`/reports/${newReportId}?token=${token}`, { replace: true });
    } else if (token && fromMainPlatform) {
      generalLogger.info('Token detected from main platform - staying on homepage for user choice');
    }
  }, [navigate]);

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Remove body background for video visibility
  useEffect(() => {
    const originalBodyBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'transparent';

    return () => {
      document.body.style.backgroundColor = originalBodyBg || 'black';
    };
  }, []);

  const handleQuerySubmit = () => {
    if (!query.trim()) return;

    try {
      // Generate new report ID
      const newReportId = generateReportId();
      
      // Navigate to AI-guided flow with query context
      const url = `${UrlGeneratorService.reportById(newReportId)}?flow=ai-guided`;
      
      navigate(url, {
        state: {
          prefilledQuery: query.trim(),
          autoSend: true,
        },
      });
    } catch (error) {
      generalLogger.error('Error submitting query', { error });
    }
  };

  // Sample query suggestions for valuation context
  const quickQueries = [
    'What is my business worth?',
    'How to value a SaaS company?',
    'Valuation for e-commerce business',
    'Calculate business value with revenue',
  ];

  return (
    <>
      <ScrollToTop />
      <MinimalHeader />

      {/* Video Background */}
      <VideoBackground 
        videos={[
          '/videos/home/business-1.mp4',
          '/videos/home/business-2.mp4',
          '/videos/home/business-3.mp4',
        ]}
        opacity={0.5}
        overlayGradient="from-black/40 via-black/30 to-black/60"
        disableAutoRotation={true}
        disableKeyboardInteraction={true}
      />

      <div className="min-h-screen relative">
        {/* Hero Section with Video Background */}
        <section className="relative z-10 py-20 md:py-24 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6">
              {/* Hero Content */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight tracking-tight text-white">
                  Understand Your Business Value.
                  <br />
                  <span className="bg-gradient-to-r from-success-300 to-primary-300 bg-clip-text text-transparent">
                    Get Professional Valuation.
                  </span>
                </h1>
                <p className="text-lg md:text-lg text-zinc-300 max-w-4xl mx-auto leading-relaxed">
                  Professional-grade business valuations powered by AI. Get insights about your business value
                  — by chatting with AI.
                </p>
              </div>

              {/* Enhanced Query Interface - Ilara Style */}
              <div className="max-w-4xl mx-auto">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleQuerySubmit();
                  }}
                  className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
                >
                  {/* Main textarea container */}
                  <div className="relative flex items-center">
                    <textarea
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Ask about your business valuation, company worth, or financial insights..."
                      className="textarea-seamless flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-base leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
                      style={{ minHeight: '80px', height: '80px' }}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleQuerySubmit();
                        }
                      }}
                      ref={textareaRef}
                      autoFocus
                      spellCheck="false"
                    />
                  </div>

                  {/* Action buttons row - quick query suggestions */}
                  <div className="flex gap-2 flex-wrap items-center">
                    {quickQueries.map((quickQuery, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setQuery(quickQuery)}
                        className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 
                                  hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20"
                      >
                        {quickQuery}
                      </button>
                    ))}

                    {/* Right side with send button */}
                    <div className="flex flex-grow items-center justify-end gap-2">
                      <div className="relative flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={!query.trim()}
                          className="submit-button-white flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-zinc-100 transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100%"
                            height="100%"
                            viewBox="0 -960 960 960"
                            className="shrink-0 h-5 w-5 text-black"
                            fill="currentColor"
                          >
                            <path d="M452-644 303-498q-9 9-21 8.5t-21-9.5-9-21 9-21l199-199q9-9 21-9t21 9l199 199q9 9 9 21t-9 21-21 9-21-9L512-646v372q0 13-8.5 21.5T482-244t-21.5-8.5T452-274z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
