import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";

function TaskCreateContent() {
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const createTaskMutation = trpc.tasks.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !objective.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await createTaskMutation.mutateAsync({ title, objective });
      toast.success("Task created successfully!");
      navigate(`/tasks/${result.task.id}`);
    } catch (error) {
      toast.error("Failed to create task");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Task</h1>
            <p className="text-sm text-muted-foreground">
              Define your objective and let the AI agent plan and execute it
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-2xl">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Task Details
            </CardTitle>
            <CardDescription>
              Provide a clear title and objective for your task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Task Title
                </label>
                <Input
                  placeholder="e.g., Analyze Q4 Sales Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={createTaskMutation.isPending}
                  className="border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  A brief, descriptive name for your task
                </p>
              </div>

              {/* Objective */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Objective
                </label>
                <Textarea
                  placeholder="Describe what you want the AI agent to accomplish. Be specific about the desired outcome, any constraints, and the format you'd like the results in."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  disabled={createTaskMutation.isPending}
                  rows={6}
                  className="border-border/50 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  The more detailed your objective, the better the AI can plan and execute
                </p>
              </div>

              {/* Examples */}
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Example Objectives:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Search for the latest AI trends and summarize the top 5 findings</li>
                  <li>Extract all email addresses from the provided document</li>
                  <li>Analyze the sentiment of customer reviews and categorize them</li>
                  <li>Generate a Python script that validates email addresses</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={createTaskMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending || !title.trim() || !objective.trim()}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {createTaskMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Create Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TaskCreate() {
  return (
    <ProtectedRoute>
      <TaskCreateContent />
    </ProtectedRoute>
  );
}
