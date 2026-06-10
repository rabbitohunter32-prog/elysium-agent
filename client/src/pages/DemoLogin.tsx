import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function DemoLogin() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async (role: "user" | "admin") => {
    setIsLoading(true);
    try {
      // Store demo user in localStorage
      const demoUser = {
        id: role === "admin" ? 2 : 1,
        openId: role === "admin" ? "demo-admin-1" : "demo-user-1",
        name: role === "admin" ? "Demo Admin" : "Demo User",
        email: role === "admin" ? "admin@elysium.local" : "demo@elysium.local",
        role: role,
        loginMethod: "demo",
      };

      localStorage.setItem("demo_user", JSON.stringify(demoUser));
      localStorage.setItem("demo_mode", "true");

      // Redirect to dashboard
      setLocation("/");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Elysium</h1>
          </div>
          <p className="text-slate-400 text-sm">Autonomous AI Agent Platform</p>
        </div>

        {/* Demo Mode Card */}
        <Card className="bg-slate-800 border-slate-700 p-8 mb-6">
          <div className="text-center mb-6">
            <div className="inline-block bg-amber-500/20 border border-amber-500/50 rounded-lg px-4 py-2 mb-4">
              <p className="text-amber-400 text-sm font-medium">🎉 Demo Mode</p>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Test Drive Elysium
            </h2>
            <p className="text-slate-400 text-sm">
              Experience all features with demo accounts. No sign-up required!
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-3 mb-6">
            {/* User Role */}
            <button
              onClick={() => setSelectedRole("user")}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedRole === "user"
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === "user"
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-slate-500"
                  }`}
                >
                  {selectedRole === "user" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">Regular User</p>
                  <p className="text-xs text-slate-400">
                    Create tasks, manage documents
                  </p>
                </div>
              </div>
            </button>

            {/* Admin Role */}
            <button
              onClick={() => setSelectedRole("admin")}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedRole === "admin"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === "admin"
                      ? "border-purple-500 bg-purple-500"
                      : "border-slate-500"
                  }`}
                >
                  {selectedRole === "admin" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">Admin</p>
                  <p className="text-xs text-slate-400">
                    Full access, user management
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Login Button */}
          <Button
            onClick={() => handleDemoLogin(selectedRole)}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all"
          >
            {isLoading ? "Logging in..." : "Enter Demo Mode"}
          </Button>
        </Card>

        {/* Features List */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-white font-semibold mb-4">What You Can Try:</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Create and execute AI tasks
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Upload and manage documents
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Monitor real-time progress
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Access admin dashboard
            </li>
          </ul>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Demo data is not persistent. Refresh to reset.
        </p>
      </div>
    </div>
  );
}
