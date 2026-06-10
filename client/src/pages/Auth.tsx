import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Zap, Brain, FileText } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Auth() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

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
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in with your Manus account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      <a href={getLoginUrl()}>
                        Sign In with Manus
                      </a>
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        New to Elysium?
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Sign in to create an account and start using the platform
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
