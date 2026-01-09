'use client';

import { useRouter } from 'next/navigation';
import {
  useAppDispatch,
  useCreateConversationMutation,
  setCurrentConversationId,
  useGetCouncilHealthQuery,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Brain,
  Scale,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createConversation, { isLoading: isCreating }] =
    useCreateConversationMutation();
  const { data: health, isLoading: isLoadingHealth } =
    useGetCouncilHealthQuery();

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
      title: 'Stage 1: Individual Responses',
      description:
        'Each model in the council independently analyzes your question and provides their unique perspective.',
      icon: Brain,
      color: 'text-chart-1',
    },
    {
      title: 'Stage 2: Peer Rankings',
      description:
        "Models evaluate each other's responses anonymously, creating a fair and unbiased ranking system.",
      icon: Scale,
      color: 'text-chart-2',
    },
    {
      title: 'Stage 3: Final Synthesis',
      description:
        'The arbiter model synthesizes the best insights into a comprehensive, well-reasoned final answer.',
      icon: Sparkles,
      color: 'text-chart-3',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome to the <span className="text-primary">LLM Council</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Harness the collective intelligence of multiple AI models through
              our innovative 3-stage consensus process. Get balanced,
              well-reasoned answers backed by peer review.
            </p>
            <Button
              size="lg"
              onClick={handleNewConversation}
              disabled={isCreating}
              className="mt-4"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Start a New Conversation
                </>
              )}
            </Button>
          </div>

          {/* Process Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {stages.map((stage, index) => (
              <Card
                key={index}
                className="relative overflow-hidden group hover:shadow-lg transition-shadow"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-chart-3" />
                <CardHeader>
                  <div
                    className={`h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 ${stage.color}`}
                  >
                    <stage.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{stage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {stage.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Council Status */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Council Status
                {isLoadingHealth ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : health?.openrouterConfigured ? (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHealth ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading council status...
                </div>
              ) : health ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Council Models
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {health.councilModels.map((model, i) => (
                        <Badge key={i} variant="secondary">
                          {model.split('/')[1] || model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Arbiter Model
                    </div>
                    <Badge variant="outline">
                      {health.arbiterModel.split('/')[1] || health.arbiterModel}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Unable to fetch council status. Please ensure the backend is
                  running.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
