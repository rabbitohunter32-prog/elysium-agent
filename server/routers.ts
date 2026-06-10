import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { agentRouter } from "./agentRouter";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Conversation procedures
  conversations: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "Title is required"),
        taskId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.createConversation(
          ctx.user.id,
          input.title,
          input.taskId
        );
        
        if (!conversation) {
          throw new Error("Failed to create conversation");
        }
        
        return conversation;
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserConversations(ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.id);
        
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or access denied");
        }
        
        return conversation;
      }),
  }),

  // Message procedures
  messages: router({
    create: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1, "Content is required"),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify conversation ownership
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or access denied");
        }

        const message = await db.createMessage(
          input.conversationId,
          input.role,
          input.content,
          input.metadata
        );

        if (!message) {
          throw new Error("Failed to create message");
        }

        return message;
      }),

    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify conversation ownership
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Conversation not found or access denied");
        }

        return db.getConversationMessages(input.conversationId);
      }),
  }),

  // Task procedures
  tasks: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "Title is required"),
        objective: z.string().min(1, "Objective is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const task = await db.createTask(
          ctx.user.id,
          input.title,
          input.objective
        );

        if (!task) {
          throw new Error("Failed to create task");
        }

        // Create a linked conversation for this task
        const conversation = await db.createConversation(
          ctx.user.id,
          `Chat for: ${input.title}`,
          task.id || undefined
        )

        return {
          task,
          conversationId: conversation?.id,
        };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserTasks(ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const task = await db.getTaskById(input.id);

        if (!task || task.userId !== ctx.user.id) {
          throw new Error("Task not found or access denied");
        }

        const steps = await db.getTaskSteps(input.id);
        const conversation = await db.getConversationByTaskId(input.id);
        return { task, steps, conversationId: conversation?.id };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
        progress: z.number().min(0).max(100).optional(),
        finalOutput: z.string().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.id);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error("Task not found or access denied");
        }

        const success = await db.updateTaskStatus(
          input.id,
          input.status,
          input.progress,
          input.finalOutput,
          input.errorMessage
        );

        if (!success) {
          throw new Error("Failed to update task status");
        }

        return { success: true };
      }),
  }),

  // TaskStep procedures
  taskSteps: router({
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        stepOrder: z.number(),
        description: z.string().min(1, "Description is required"),
        tool: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error("Task not found or access denied");
        }

        const step = await db.createTaskStep(
          input.taskId,
          input.stepOrder,
          input.description,
          input.tool
        );

        if (!step) {
          throw new Error("Failed to create task step");
        }

        return step;
      }),

    list: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error("Task not found or access denied");
        }

        return db.getTaskSteps(input.taskId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "running", "completed", "failed"]),
        output: z.string().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.updateTaskStepStatus(
          input.id,
          input.status,
          input.output,
          input.errorMessage
        );

        if (!success) {
          throw new Error("Failed to update task step status");
        }

        return { success: true };
      }),
  }),

  // Document procedures
  documents: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserDocuments(ctx.user.id);
      }),

    listByTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify task ownership
        const task = await db.getTaskById(input.taskId);
        if (!task || task.userId !== ctx.user.id) {
          throw new Error("Task not found or access denied");
        }

        return db.getTaskDocuments(input.taskId);
      }),

    upload: protectedProcedure
      .input(z.object({
        filename: z.string().min(1, "Filename is required"),
        fileType: z.string().min(1, "File type is required"),
        fileSize: z.number().min(1, "File size must be greater than 0"),
        storageUrl: z.string().min(1, "Storage URL is required"),
        storageKey: z.string().min(1, "Storage key is required"),
        taskId: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // If taskId is provided, verify ownership
        if (input.taskId) {
          const task = await db.getTaskById(input.taskId);
          if (!task || task.userId !== ctx.user.id) {
            throw new Error("Task not found or access denied");
          }
        }

        const document = await db.createDocument(
          ctx.user.id,
          input.filename,
          input.fileType,
          input.fileSize,
          input.storageKey,
          input.storageUrl,
          "uploaded",
          input.taskId,
          input.description
        );

        if (!document) {
          throw new Error("Failed to upload document");
        }

        return document;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify document ownership
        const doc = await db.getDocumentById(input.id);
        if (!doc || doc.userId !== ctx.user.id) {
          throw new Error("Document not found or access denied");
        }

        const success = await db.deleteDocument(input.id);
        if (!success) {
          throw new Error("Failed to delete document");
        }

        return { success: true };
      }),
  }),

  // Admin procedures
  admin: router({
    users: adminProcedure
      .query(async () => {
        return db.getAllUsers();
      }),

    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        const success = await db.updateUserRole(input.userId, input.role);

        if (!success) {
          throw new Error("Failed to update user role");
        }

        // Log audit event
        await db.logAuditEvent(
          "UPDATE_USER_ROLE",
          "user",
          undefined,
          input.userId,
          { role: input.role }
        );

        return { success: true };
      }),

    auditLogs: adminProcedure
      .input(z.object({ userId: z.number().optional(), limit: z.number().default(100) }))
      .query(async ({ input }) => {
        if (input.userId) {
          return db.getUserAuditLogs(input.userId, input.limit);
        }
        // Return empty for now - can be extended to get all logs
        return [];
      }),
  }),

  // Agent execution and orchestration
  agent: agentRouter,
});

export type AppRouter = typeof appRouter;
