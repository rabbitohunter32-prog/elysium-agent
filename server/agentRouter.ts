/**
 * Agent Router
 * tRPC procedures for agent task planning and execution
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as orchestrator from "./agentOrchestrator";
import * as db from "./db";

export const agentRouter = router({
  /**
   * Plan task execution
   * Analyzes the objective and creates a detailed execution plan
   */
  planExecution: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      context: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await db.getTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new Error("Task not found or access denied");
      }

      const plan = await orchestrator.planTaskExecution(
        input.taskId,
        task.objective,
        input.context
      );

      if (!plan) {
        throw new Error("Failed to create execution plan");
      }

      return plan;
    }),

  /**
   * Execute task
   * Runs all steps in the task sequentially
   */
  executeTask: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await db.getTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new Error("Task not found or access denied");
      }

      // Verify conversation ownership if provided
      if (input.conversationId) {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or access denied");
        }
      }

      const result = await orchestrator.executeTask(
        input.taskId,
        input.conversationId
      );

      return result;
    }),

  /**
   * Get execution status
   * Returns current status and progress of a task
   */
  getStatus: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await db.getTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new Error("Task not found or access denied");
      }

      const status = await orchestrator.getExecutionStatus(input.taskId);
      if (!status) {
        throw new Error("Failed to get execution status");
      }

      return status;
    }),

  /**
   * Cancel task execution
   * Stops a running task
   */
  cancelTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await db.getTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new Error("Task not found or access denied");
      }

      // Only cancel if task is running or pending
      if (task.status !== "running" && task.status !== "pending") {
        throw new Error(`Cannot cancel task with status: ${task.status}`);
      }

      const success = await db.updateTaskStatus(
        input.taskId,
        "cancelled",
        task.progress,
        undefined,
        "Task cancelled by user"
      );

      if (!success) {
        throw new Error("Failed to cancel task");
      }

      return { success: true };
    }),

  /**
   * Get task steps
   * Returns all execution steps for a task
   */
  getSteps: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await db.getTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new Error("Task not found or access denied");
      }

      return db.getTaskSteps(input.taskId);
    }),
});
