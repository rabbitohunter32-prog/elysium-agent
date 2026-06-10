import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Send, Play, Square, Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Streamdown } from "streamdown";

interface RouteParams {
  id: string;
}

function TaskDetailContent({ id }: RouteParams) {
  const [, navigate] = useLocation();
  const taskId = parseInt(id);
  const [userMessage, setUserMessage] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: taskData, isLoading: taskLoading, refetch: refetchTask } = trpc.tasks.get.useQuery({ id: taskId });
  const { data: messages, refetch: refetchMessages } = trpc.messages.list.useQuery(
    { conversationId: conversationId || 0 },
    { enabled: !!conversationId, refetchInterval: 2000 } // Poll every 2 seconds
  );
  const createMessageMutation = trpc.messages.create.useMutation();
  const executeMutation = trpc.agent.executeTask.useMutation();
  const planMutation = trpc.agent.planExecution.useMutation();

  // Set conversation ID from task data
  useEffect(() => {
    if (taskData?.conversationId && !conversationId) {
      setConversationId(taskData.conversationId);
    }
  }, [taskData?.conversationId, conversationId]);

  // Poll task status
  useEffect(() => {
    const interval = setInterval(() => {
      if (taskData?.task?.status === "running") {
        void refetchTask();
      }
    }, 3000); // Poll every 3 seconds during execution

    return () => clearInterval(interval);
  }, [taskData?.task?.status, refetchTask]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userMessage.trim() || !conversationId) {
      toast.error("Conversation not ready");
      return;
    }

    try {
      await createMessageMutation.mutateAsync({
        conversationId,
        role: "user",
        content: userMessage,
      });

      setUserMessage("");
      await refetchMessages();
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  const handlePlanTask = async () => {
    if (!conversationId) {
      toast.error("Conversation not ready");
      return;
    }

    try {
      await planMutation.mutateAsync({ taskId });
      toast.success("Task plan created!");
      await refetchTask();
    } catch (error) {
      toast.error("Failed to create task plan");
      console.error(error);
    }
  };

  const handleExecuteTask = async () => {
    if (!conversationId) {
      toast.error("Conversation not ready");
      return;
    }

    setIsExecuting(true);
    try {
      await executeMutation.mutateAsync({
        taskId,
        conversationId,
      });
      toast.success("Task execution started!");
      await refetchTask();
      await refetchMessages();
    } catch (error) {
      toast.error("Task execution failed");
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  }

  const handleCancelTask = async () => {
    try {
      const cancelMutation = trpc.agent.cancelTask.useMutation();
      await cancelMutation.mutateAsync({ taskId });
      toast.success("Task cancelled");
      refetchTask();
    } catch (error) {
      toast.error("Failed to cancel task");
      console.error(error);
    }
  };

  if (taskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!taskData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-medium">Task not found</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const task = taskData.task;
  const statusIcon = {
    pending: <Clock className="w-5 h-5 text-muted-foreground" />,
    running: <Zap className="w-5 h-5 text-amber-500 animate-pulse" />,
    completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    failed: <AlertCircle className="w-5 h-5 text-destructive" />,
    cancelled: <Square className="w-5 h-5 text-muted-foreground" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{task.objective}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon[task.status as keyof typeof statusIcon]}
                <span className="text-sm font-medium text-foreground capitalize">
                  {task.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {task.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePlanTask}
                      disabled={planMutation.isPending}
                      className="gap-2"
                    >
                      {planMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Plan
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleExecuteTask}
                      disabled={executeMutation.isPending || isExecuting}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      {isExecuting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Execute
                    </Button>
                  </>
                )}
                {task.status === "running" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancelTask}
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            {task.progress !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col border-r border-border/50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border/50 text-card-foreground"
                    }`}
                  >
                    <Streamdown>{message.content}</Streamdown>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Execute the task to see progress updates
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/50 bg-card/50 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask the agent a question..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                disabled={createMessageMutation.isPending || !conversationId}
                className="border-border/50"
              />
              <Button
                type="submit"
                disabled={createMessageMutation.isPending || !userMessage.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar - Task Details */}
        <div className="w-80 border-l border-border/50 bg-card/50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Task Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Task Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-foreground">
                    {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
                {task.completedAt && (
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="text-foreground">
                      {new Date(task.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Final Output */}
            {task.finalOutput && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Result</h3>
                <Card className="border-border/50 bg-background">
                  <CardContent className="p-3 text-sm">
                    <Streamdown>{task.finalOutput}</Streamdown>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Error Message */}
            {task.errorMessage && (
              <div className="space-y-3">
                <h3 className="font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Error
                </h3>
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-3 text-sm text-destructive">
                    {task.errorMessage}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskDetail() {
  const [location] = useLocation();
  const match = location.match(/\/tasks\/(\d+)/);
  const id = match?.[1];

  if (!id) {
    return <div>Invalid task ID</div>;
  }

  return (
    <ProtectedRoute>
      <TaskDetailContent id={id} />
    </ProtectedRoute>
  );
}
