'use client';

import { useRouter } from 'next/navigation';
import {
  useAppDispatch,
  useCreateConversationMutation,
  setCurrentConversationId,
  useGetCouncilHealthQuery,
  useGetCurrentUserQuery,
} from '@/lib/store';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createConversation, { isLoading: isCreating }] =
    useCreateConversationMutation();
  const { data: health, isLoading: isLoadingHealth } =
    useGetCouncilHealthQuery();
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUserQuery();
  const isDemo = user?.isDemo === true;

  const handleNewConversation = async () => {
    try {
      const result = await createConversation().unwrap();
      dispatch(setCurrentConversationId(result.id));
      router.push(`/chat/${result.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const stages = [
    {
      n: '01',
      title: 'Responses',
      body: 'Each model independently analyses your question and answers in its own voice.',
    },
    {
      n: '02',
      title: 'Rankings',
      body: 'Models evaluate one another anonymously—no name, no bias, just judgement.',
    },
    {
      n: '03',
      title: 'Synthesis',
      body: 'An arbiter resolves the field into a single, well-reasoned answer.',
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 py-8 lg:py-12">
        {/* Hero — asymmetric grid */}
        <section
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-end animate-fade-up"
          style={{ animationDelay: '0ms' }}
        >
          <div className="lg:col-span-8">
            <h1 className="display-xl leading-[0.9]">Multi-model consensus</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl font-light">
              Harness the collective intelligence of multiple AI models through
              a rigorous three-stage evaluation process.
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

        {/* Process — three-column editorial */}
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 animate-fade-up"
          style={{ animationDelay: '200ms' }}
        >
          {stages.map((stage, i) => (
            <article key={stage.n} className="group relative">
              <div className="absolute top-0 left-0 w-full h-px bg-border group-hover:bg-foreground transition-colors duration-500" />
              <div className="absolute top-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-700 ease-out" />

              <div className="pt-6">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-4xl font-light text-muted-foreground group-hover:text-foreground transition-colors duration-500">
                    {stage.n}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-medium tracking-tight mb-2 group-hover:text-primary transition-colors duration-500">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stage.body}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div
          className="swiss-rule mt-12 lg:mt-16 mb-12 animate-fade-up"
          style={{ animationDelay: '300ms' }}
        />

        {/* Status */}
        <section
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 animate-fade-up"
          style={{ animationDelay: '400ms' }}
        >
          <div className="lg:col-span-3 space-y-4">
            <h2 className="mono-label">System Status</h2>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full opacity-50 ${health?.openrouterConfigured ? 'bg-foreground' : 'bg-primary'}`}
                ></span>
                <span
                  className={`relative inline-flex h-3 w-3 ${health?.openrouterConfigured ? 'bg-foreground' : 'bg-primary'}`}
                ></span>
              </div>
              <span className="text-sm font-medium">
                {isLoadingHealth || isLoadingUser
                  ? 'Checking...'
                  : health?.openrouterConfigured || isDemo
                    ? 'All systems operational'
                    : 'OpenRouter not configured'}
              </span>
            </div>
          </div>

          {health && (
            <>
              <div className="lg:col-span-6 space-y-4">
                <h2 className="mono-label">Active Council Models</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
                  {health.councilModels.map((model, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-background"
                    >
                      <span className="text-sm font-mono truncate mr-4">
                        {model.split('/').pop()}
                      </span>
                      <span className="mono-label shrink-0 text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <h2 className="mono-label">Arbiter Model</h2>
                <div className="p-3 border border-border bg-foreground text-background">
                  <span className="text-sm font-mono block truncate">
                    {health.arbiterModel.split('/').pop()}
                  </span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
