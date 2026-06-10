/**
 * Agent Orchestrator
 * Coordinates autonomous task execution with multi-step planning,
 * tool selection, and progress tracking.
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { executeTool, type ToolName, type ToolResult } from "./agentTools";
import { createMessage } from "./db";

export type ExecutionStep = {
  order: number;
  description: string;
  tool: ToolName;
  parameters: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  output?: ToolResult;
  error?: string;
};

export type ExecutionPlan = {
  taskId: number;
  objective: string;
  analysis: string;
  steps: ExecutionStep[];
  status: "planning" | "executing" | "completed" | "failed";
  progress: number;
};

/**
 * Analyze a goal and create an execution plan
 */
export async function planTaskExecution(
  taskId: number,
  objective: string,
  context?: string
): Promise<ExecutionPlan | null> {
  try {
    // Get task from database
    const task = await db.getTaskById(taskId);
    if (!task) {
      console.error(`[Orchestrator] Task ${taskId} not found`);
      return null;
    }

    // Use LLM to analyze the objective and create a plan
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert task planning agent. Analyze the user's objective and create a detailed execution plan.

Available tools:
- web_search: Search the internet for information
- document_analysis: Analyze and extract information from documents
- code_execution: Execute code and get results
- data_extraction: Extract structured data from unstructured text

For each step, specify:
1. A clear description of what needs to be done
2. The tool to use (web_search, document_analysis, code_execution, or data_extraction)
3. The parameters needed for the tool

Return your response as a JSON object with:
{
  "analysis": "Brief analysis of the objective",
  "steps": [
    {
      "order": 1,
      "description": "Step description",
      "tool": "tool_name",
      "parameters": { "key": "value" }
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Objective: ${objective}${context ? `\n\nContext: ${context}` : ""}\n\nCreate a detailed execution plan with specific steps and tools.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "execution_plan",
          schema: {
            type: "object",
            properties: {
              analysis: { type: "string" },
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    description: { type: "string" },
                    tool: { type: "string" },
                    parameters: { type: "object" },
                  },
                  required: ["order", "description", "tool", "parameters"],
                },
              },
            },
            required: ["analysis", "steps"],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      console.error("[Orchestrator] Failed to get plan from LLM");
      return null;
    }

    try {
      const plan = JSON.parse(content);

      // Validate and transform the plan
      const executionPlan: ExecutionPlan = {
        taskId,
        objective,
        analysis: plan.analysis || "",
        steps: (plan.steps || []).map((step: Record<string, unknown>) => ({
          order: step.order || 0,
          description: step.description || "",
          tool: (step.tool || "web_search") as ToolName,
          parameters: step.parameters || {},
          status: "pending" as const,
        })),
        status: "planning",
        progress: 0,
      };

      // Store steps in database
      for (const step of executionPlan.steps) {
        await db.createTaskStep(
          taskId,
          step.order,
          step.description,
          step.tool
        );
      }

      return executionPlan;
    } catch (parseError) {
      console.error("[Orchestrator] Failed to parse plan:", parseError);
      return null;
    }
  } catch (error) {
    console.error("[Orchestrator] Failed to plan task execution:", error);
    return null;
  }
}

/**
 * Execute a single step in the task
 */
export async function executeStep(
  taskId: number,
  step: ExecutionStep,
  conversationId?: number
): Promise<ToolResult> {
  try {
    // Update step status to running
    const dbSteps = await db.getTaskSteps(taskId);
    const dbStep = dbSteps.find(s => s.stepOrder === step.order);

    if (dbStep) {
      await db.updateTaskStepStatus(dbStep.id, "running");
    }

    // Execute the tool
    const result = await executeTool(step.tool, step.parameters);

    // Update step status based on result
    if (dbStep) {
      if (result.success) {
        await db.updateTaskStepStatus(
          dbStep.id,
          "completed",
          JSON.stringify(result.data)
        );
      } else {
        await db.updateTaskStepStatus(
          dbStep.id,
          "failed",
          undefined,
          result.error
        );
      }
    }

    // Log the step result to conversation if linked
    if (conversationId && result.success) {
      await createMessage(
        conversationId,
        "assistant",
        `**Step ${step.order}: ${step.description}**\n\nTool: ${step.tool}\n\nResult:\n\`\`\`\n${JSON.stringify(result.data, null, 2)}\n\`\`\``,
        { stepOrder: step.order, tool: step.tool }
      );
    }

    return result;
  } catch (error) {
    console.error("[Orchestrator] Failed to execute step:", error);
    return {
      success: false,
      error: `Step execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Execute all steps in a task sequentially
 */
export async function executeTask(
  taskId: number,
  conversationId?: number
): Promise<{
  success: boolean;
  finalOutput?: string;
  error?: string;
}> {
  try {
    // Get the task
    const task = await db.getTaskById(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Update task status to running
    await db.updateTaskStatus(taskId, "running");

    // Get task steps
    const steps = await db.getTaskSteps(taskId);
    if (steps.length === 0) {
      return { success: false, error: "No execution steps found" };
    }

    // Execute steps sequentially
    const results: ToolResult[] = [];
    let failedStep: typeof steps[0] | null = null;

    for (const step of steps) {
      const executionStep: ExecutionStep = {
        order: step.stepOrder,
        description: step.description,
        tool: (step.tool || "web_search") as ToolName,
        parameters: {},
        status: "pending",
      };

      const result = await executeStep(taskId, executionStep, conversationId);
      results.push(result);

      if (!result.success) {
        failedStep = step;
        break;
      }

      // Update task progress
      const progress = Math.round((steps.indexOf(step) + 1) / steps.length * 100);
      await db.updateTaskStatus(taskId, "running", progress);
    }

    // Generate final output using LLM
    if (failedStep) {
      await db.updateTaskStatus(
        taskId,
        "failed",
        100,
        undefined,
        `Failed at step ${failedStep.stepOrder}: ${failedStep.description}`
      );
      return {
        success: false,
        error: `Task failed at step ${failedStep.stepOrder}`,
      };
    }

    // Summarize results
    const summaryResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a task completion summarizer. Create a concise summary of the completed task steps and their results.",
        },
        {
          role: "user",
          content: `Task: ${task.objective}\n\nCompleted steps and results:\n${results
            .map((r, i) => `Step ${i + 1}: ${r.success ? "Success" : "Failed"}\nData: ${JSON.stringify(r.data)}`)
            .join("\n\n")}\n\nProvide a concise summary of what was accomplished.`,
        },
      ],
    });

    const summary = summaryResponse.choices[0]?.message?.content;
    if (!summary || typeof summary !== "string") {
      return {
        success: false,
        error: "Failed to generate task summary",
      };
    }

    // Update task as completed
    await db.updateTaskStatus(taskId, "completed", 100, summary);

    // Log completion to conversation
    if (conversationId) {
      await createMessage(
        conversationId,
        "assistant",
        `## Task Completed ✓\n\n${summary}`,
        { taskStatus: "completed" }
      );
    }

    return {
      success: true,
      finalOutput: summary,
    };
  } catch (error) {
    console.error("[Orchestrator] Failed to execute task:", error);

    // Mark task as failed
    await db.updateTaskStatus(
      taskId,
      "failed",
      100,
      undefined,
      error instanceof Error ? error.message : "Unknown error"
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Task execution failed",
    };
  }
}

/**
 * Get execution status for a task
 */
export async function getExecutionStatus(taskId: number) {
  try {
    const task = await db.getTaskById(taskId);
    if (!task) {
      return null;
    }

    const steps = await db.getTaskSteps(taskId);

    return {
      taskId,
      status: task.status,
      progress: task.progress,
      objective: task.objective,
      steps: steps.map(s => ({
        order: s.stepOrder,
        description: s.description,
        status: s.status,
        output: s.output,
        error: s.errorMessage,
      })),
      finalOutput: task.finalOutput,
      error: task.errorMessage,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    };
  } catch (error) {
    console.error("[Orchestrator] Failed to get execution status:", error);
    return null;
  }
}
