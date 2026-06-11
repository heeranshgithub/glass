'use client';

import { useRouter } from 'next/navigation';
import {
  useAppDispatch,
  useCreateConversationMutation,
  setCurrentConversationId,
  useGetCurrentUserQuery,
} from '@/lib/store';
import { CHAT_MODELS } from '@/lib/types';
import { ArrowRight, Loader2 } from 'lucide-react';

const MODEL_DESCRIPTIONS: Record<string, string> = {
  'openai/gpt-5.1':                "OpenAI's flagship reasoning model",
  'google/gemini-3.1-pro-preview': "Google's multimodal powerhouse",
  'anthropic/claude-sonnet-4.5':   "Anthropic's balanced intelligence",
  'x-ai/grok-4.20':                "xAI's real-time reasoning model",
};

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createConversation, { isLoading: isCreating }] =
    useCreateConversationMutation();
  const { data: user } = useGetCurrentUserQuery();

  const handleNewConversation = async () => {
    try {
      const result = await createConversation().unwrap();
      dispatch(setCurrentConversationId(result.id));
      router.push(`/chat/${result.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 py-8 lg:py-12">
        {/* Hero */}
        <section
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-end animate-fade-up"
          style={{ animationDelay: '0ms' }}
        >
          <div className="lg:col-span-8">
            <h1 className="display-xl leading-[0.9]">Ask anything.</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl font-light">
              Chat with the world&apos;s best AI models. Pick your model, start a
              conversation — switch anytime.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end">
            <button
              onClick={handleNewConversation}
              disabled={isCreating}
              className="group relative flex items-center justify-between w-full p-5 border border-border bg-background hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-60">
                  Begin
                </span>
                <span className="text-base font-medium">New conversation</span>
              </div>
              <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center bg-transparent group-hover:border-background group-hover:bg-background group-hover:text-foreground transition-all duration-300">
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                )}
              </div>
            </button>
          </div>
        </section>

        <div
          className="swiss-rule mt-12 lg:mt-16 mb-12 animate-fade-up"
          style={{ animationDelay: '100ms' }}
        />

        {/* Models */}
        <section
          className="animate-fade-up"
          style={{ animationDelay: '200ms' }}
        >
          <h2 className="mono-label mb-8">Available Models</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {CHAT_MODELS.map((model, i) => (
              <article
                key={model.id}
                className="group relative bg-background"
                style={{ animationDelay: `${220 + i * 60}ms` }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-border transition-colors duration-500 group-hover:bg-foreground" />
                <div className="absolute top-0 left-0 h-px w-0 bg-primary transition-all duration-700 ease-out group-hover:w-full" />

                <div className="pt-6 pb-6 px-4 space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-3xl font-light text-muted-foreground group-hover:text-foreground transition-colors duration-500 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors duration-500">
                      {model.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {MODEL_DESCRIPTIONS[model.id]}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div
          className="swiss-rule mt-12 lg:mt-16 mb-12 animate-fade-up"
          style={{ animationDelay: '400ms' }}
        />

        {/* Status */}
        <section
          className="animate-fade-up"
          style={{ animationDelay: '500ms' }}
        >
          <h2 className="mono-label mb-4">System Status</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full bg-foreground opacity-50" />
              <span className="relative inline-flex h-3 w-3 bg-foreground" />
            </div>
            <span className="text-sm font-medium">All systems operational</span>
          </div>
        </section>
      </div>
    </div>
  );
}
