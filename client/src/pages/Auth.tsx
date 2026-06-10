import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Zap, Brain, FileText } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Auth() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: authUrl } = trpc.google.getAuthUrl.useQuery();

  const handleGoogleSignIn = () => {
    if (authUrl?.url) {
      window.location.href = authUrl.url;
    }
  };

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Elysium Agent</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Features */}
            <div className="space-y-8 flex flex-col justify-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Autonomous AI Agent Platform
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Delegate complex tasks to your intelligent AI assistant. Watch it plan, execute, and deliver results in real time.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                      <Brain className="h-6 w-6 text-accent-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Intelligent Planning</h3>
                    <p className="text-sm text-muted-foreground">
                      AI analyzes your goals and creates detailed execution plans
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                      <Zap className="h-6 w-6 text-accent-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Real-Time Execution</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor task progress step-by-step with live updates
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                      <FileText className="h-6 w-6 text-accent-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Document Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Store and manage all generated files and artifacts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Login Card */}
            <div className="flex items-center justify-center">
              <Card className="w-full border-border/50 shadow-lg">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                  <CardDescription>
                    Sign in or try our free demo mode
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={!authUrl}
                      size="lg"
                      className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign In with Google
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full"
                    >
                      <a href={getLoginUrl()}>
                        Sign In with Manus
                      </a>
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Sign in with Google or Manus to get started
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 backdrop-blur-sm">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>© 2026 Elysium Agent. Powered by Manus AI.</p>
        </div>
      </div>
    </div>
  );
}
