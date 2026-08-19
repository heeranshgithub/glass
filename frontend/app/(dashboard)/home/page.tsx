'use client';

import { useRouter } from 'next/navigation';
import {
  useAppDispatch,
  useCreateConversationMutation,
  setCurrentConversationId,
  useGetCouncilHealthQuery,
} from '@/lib/store';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createConversation, { isLoading: isCreating }] =
    useCreateConversationMutation();
  const { data: health } = useGetCouncilHealthQuery();

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
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Multi-model consensus
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-2xl">
              Harness the collective intelligence of multiple AI models through
              a three-stage evaluation process.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end">
            <button
              onClick={handleNewConversation}
              disabled={isCreating}
              className="group relative flex items-center justify-between w-full p-5 rounded-2xl bg-muted/50 hover:bg-foreground border border-transparent hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs opacity-70">Begin</span>
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
          className="mt-12 lg:mt-16 mb-12"
          style={{ animationDelay: '100ms' }}
        />

        {/* Process — three-column editorial */}
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up"
          style={{ animationDelay: '200ms' }}
        >
          {stages.map(stage => (
            <article
              key={stage.n}
              className="rounded-2xl bg-muted/50 p-6 transition-colors hover:bg-muted"
            >
              <span className="text-3xl font-light tabular-nums text-muted-foreground">
                {stage.n}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {stage.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {stage.body}
              </p>
            </article>
          ))}
        </section>

        <div
          className="mt-12 lg:mt-16 mb-12"
          style={{ animationDelay: '300ms' }}
        />

        {/* Status */}
        <section
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 animate-fade-up"
          style={{ animationDelay: '400ms' }}
        >
          {health && (
            <>
              <div className="lg:col-span-8 space-y-4">
                <h2 className="text-xs text-muted-foreground">
                  Active council models
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {health.councilModels.map((model, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <span className="text-sm font-mono truncate mr-4">
                        {model.split('/').pop()}
                      </span>
                      <span className="text-xs shrink-0 text-muted-foreground">
                        {String.fromCharCode(65 + i)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4 space-y-4">
                <h2 className="text-xs text-muted-foreground">Arbiter model</h2>
                <div className="p-3 rounded-xl bg-foreground text-background">
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
