import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function GoogleLogin() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [isLoading, setIsLoading] = useState(false);
  const { data: authUrl } = trpc.google.getAuthUrl.useQuery();
  const googleCallbackMutation = trpc.google.callback.useMutation();

  useEffect(() => {
    // Handle OAuth callback
    const params = new URLSearchParams(search);
    const code = params.get("code");

    if (code) {
      handleCallback(code);
    }
  }, [search]);

  const handleCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const result = await googleCallbackMutation.mutateAsync({ code });
      if (result.success) {
        // Store user info and redirect
        localStorage.setItem(
          "manus-runtime-user-info",
          JSON.stringify(result.user)
        );
        setLocation("/dashboard");
      }
    } catch (error) {
      console.error("Google callback error:", error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (authUrl?.url) {
      window.location.href = authUrl.url;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Elysium</h1>
          </div>
          <p className="text-slate-400 text-sm">Autonomous AI Agent Platform</p>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Sign in with your Google account to continue
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Signing you in...</p>
            </div>
          ) : (
            <Button
              onClick={handleGoogleSignIn}
              disabled={!authUrl || isLoading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
          )}
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
