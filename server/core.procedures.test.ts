import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "@shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1, role: "admin" | "user" = "user"): {
  ctx: TrpcContext;
  clearedCookies: Array<{ name: string; options: Record<string, unknown> }>;
} {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Core tRPC Procedures", () => {
  describe("auth.logout", () => {
    it("should clear session cookie and report success", async () => {
      const { ctx, clearedCookies } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
      expect(clearedCookies[0]?.options).toMatchObject({
        maxAge: -1,
        secure: true,
        httpOnly: true,
      });
    });
  });

  describe("auth.me", () => {
    it("should return current user for authenticated request", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      const user = await caller.auth.me();

      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
      expect(user?.role).toBe("user");
    });

    it("should return null for unauthenticated request", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      const user = await caller.auth.me();

      expect(user).toBeNull();
    });
  });

  describe("tasks.create", () => {
    it("should create a task for authenticated user", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tasks.create({
        title: "Test Task",
        objective: "Complete this test",
      });

      expect(result).toBeDefined();
      expect(result.task.title).toBe("Test Task");
      expect(result.task.objective).toBe("Complete this test");
      expect(result.task.userId).toBe(1);
      expect(result.task.status).toBe("pending");
      expect(result.conversation).toBeDefined();
    });

    it("should reject task creation for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.tasks.create({
          title: "Test Task",
          objective: "Complete this test",
        })
      ).rejects.toThrow();
    });

    it("should validate task input", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.tasks.create({
          title: "",
          objective: "Complete this test",
        })
      ).rejects.toThrow();
    });
  });

  describe("conversations.list", () => {
    it("should list user's conversations", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.conversations.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject list for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(caller.conversations.list()).rejects.toThrow();
    });
  });

  describe("messages.create", () => {
    it("should create a message in conversation", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      // Create a task and conversation first
      const taskResult = await caller.tasks.create({
        title: "Test Task",
        objective: "Complete this test",
      });

      // Create a message
      const result = await caller.messages.create({
        conversationId: taskResult.conversation.id,
        role: "user",
        content: "Test message",
      });

      expect(result).toBeDefined();
      expect(result.content).toBe("Test message");
      expect(result.role).toBe("user");
    });

    it("should reject message creation for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.messages.create({
          conversationId: 1,
          role: "user",
          content: "Test message",
        })
      ).rejects.toThrow();
    });
  });

  describe("documents.list", () => {
    it("should list user's documents", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject list for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(caller.documents.list()).rejects.toThrow();
    });
  });

  describe("admin.users.list", () => {
    it("should list all users for admin", async () => {
      const { ctx } = createAuthContext(1, "admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.users.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject list for non-admin user", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.users.list()).rejects.toThrow();
    });

    it("should reject list for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.users.list()).rejects.toThrow();
    });
  });

  describe("admin.users.updateRole", () => {
    it("should update user role for admin", async () => {
      const { ctx } = createAuthContext(1, "admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.users.updateRole({
        userId: 2,
        role: "admin",
      });

      expect(result.success).toBe(true);
    });

    it("should reject role update for non-admin user", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.users.updateRole({
          userId: 2,
          role: "admin",
        })
      ).rejects.toThrow();
    });
  });

  describe("system.notifyOwner", () => {
    it("should send notification to owner", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.system.notifyOwner({
        title: "Test Notification",
        content: "This is a test notification",
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("should reject notification for unauthenticated user", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.system.notifyOwner({
          title: "Test",
          content: "Test",
        })
      ).rejects.toThrow();
    });
  });

  describe("Role-Based Access Control", () => {
    it("should enforce admin-only procedures", async () => {
      const userCtx = createAuthContext(1, "user").ctx;
      const userCaller = appRouter.createCaller(userCtx);

      const adminCtx = createAuthContext(2, "admin").ctx;
      const adminCaller = appRouter.createCaller(adminCtx);

      // User should not access admin procedures
      await expect(userCaller.admin.users.list()).rejects.toThrow();

      // Admin should access admin procedures
      const result = await adminCaller.admin.users.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should enforce protected procedures", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      // Unauthenticated user should not access protected procedures
      await expect(caller.conversations.list()).rejects.toThrow();
      await expect(caller.documents.list()).rejects.toThrow();
      await expect(caller.messages.list({ conversationId: 1 })).rejects.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid input gracefully", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.tasks.create({
          title: "",
          objective: "",
        })
      ).rejects.toThrow();
    });

    it("should handle non-existent resources", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.tasks.get({ id: 99999 })).rejects.toThrow();
    });

    it("should handle access denied errors", async () => {
      const user1Ctx = createAuthContext(1, "user").ctx;
      const user1Caller = appRouter.createCaller(user1Ctx);

      // Create a task as user 1
      const taskResult = await user1Caller.tasks.create({
        title: "User 1 Task",
        objective: "Only user 1 should see this",
      });

      // Try to access as user 2
      const user2Ctx = createAuthContext(2, "user").ctx;
      const user2Caller = appRouter.createCaller(user2Ctx);

      await expect(user2Caller.tasks.get({ id: taskResult.task.id })).rejects.toThrow();
    });
  });
});
