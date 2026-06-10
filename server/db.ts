import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  conversations,
  messages,
  tasks,
  taskSteps,
  documents,
  auditLogs,
  type Conversation,
  type Message,
  type Task,
  type TaskStep,
  type Document,
  type AuditLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user by openId:", error);
    return undefined;
  }
}

// Conversation queries
export async function createConversation(
  userId: number,
  title: string,
  taskId?: number
): Promise<Conversation | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot create conversation: database not available");
      return null;
    }

    const result = await db.insert(conversations).values({
      userId,
      taskId,
      title,
    });

    const insertId = result[0]?.insertId;
    if (!insertId) {
      console.error("[Database] Failed to get insert ID for conversation");
      return null;
    }

    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, insertId as number))
      .limit(1);

    return conversation[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create conversation:", error);
    return null;
  }
}

export async function getConversationById(id: number): Promise<Conversation | undefined> {
  try {
    const db = await getDb();
    if (!db) return undefined;

    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get conversation by ID:", error);
    return undefined;
  }
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  } catch (error) {
    console.error("[Database] Failed to get user conversations:", error);
    return [];
  }
}

// Message queries
export async function createMessage(
  conversationId: number,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>
): Promise<Message | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot create message: database not available");
      return null;
    }

    const result = await db.insert(messages).values({
      conversationId,
      role,
      content,
      metadata,
    });

    const insertId = result[0]?.insertId;
    if (!insertId) {
      console.error("[Database] Failed to get insert ID for message");
      return null;
    }

    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, insertId as number))
      .limit(1);

    return message[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create message:", error);
    return null;
  }
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get conversation messages:", error);
    return [];
  }
}

// Task queries
export async function createTask(
  userId: number,
  title: string,
  objective: string
): Promise<Task | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot create task: database not available");
      return null;
    }

    const result = await db.insert(tasks).values({
      userId,
      title,
      objective,
    });

    const insertId = result[0]?.insertId;
    if (!insertId) {
      console.error("[Database] Failed to get insert ID for task");
      return null;
    }

    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, insertId as number))
      .limit(1);

    return task[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create task:", error);
    return null;
  }
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  try {
    const db = await getDb();
    if (!db) return undefined;

    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get task by ID:", error);
    return undefined;
  }
}

export async function getUserTasks(userId: number): Promise<Task[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get user tasks:", error);
    return [];
  }
}

export async function updateTaskStatus(
  id: number,
  status: "pending" | "running" | "completed" | "failed" | "cancelled",
  progress?: number,
  finalOutput?: string,
  errorMessage?: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot update task status: database not available");
      return false;
    }

    const updates: Record<string, unknown> = { status };
    if (progress !== undefined) updates.progress = progress;
    if (finalOutput !== undefined) updates.finalOutput = finalOutput;
    if (errorMessage !== undefined) updates.errorMessage = errorMessage;
    if (status === "running") updates.startedAt = new Date();
    if (status === "completed" || status === "failed" || status === "cancelled") {
      updates.completedAt = new Date();
    }

    await db.update(tasks).set(updates).where(eq(tasks.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update task status:", error);
    return false;
  }
}

// TaskStep queries
export async function createTaskStep(
  taskId: number,
  stepOrder: number,
  description: string,
  tool?: string
): Promise<TaskStep | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot create task step: database not available");
      return null;
    }

    const result = await db.insert(taskSteps).values({
      taskId,
      stepOrder,
      description,
      tool,
    });

    const insertId = result[0]?.insertId;
    if (!insertId) {
      console.error("[Database] Failed to get insert ID for task step");
      return null;
    }

    const step = await db
      .select()
      .from(taskSteps)
      .where(eq(taskSteps.id, insertId as number))
      .limit(1);

    return step[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create task step:", error);
    return null;
  }
}

export async function getTaskSteps(taskId: number): Promise<TaskStep[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(taskSteps)
      .where(eq(taskSteps.taskId, taskId))
      .orderBy(asc(taskSteps.stepOrder));
  } catch (error) {
    console.error("[Database] Failed to get task steps:", error);
    return [];
  }
}

export async function updateTaskStepStatus(
  id: number,
  status: "pending" | "running" | "completed" | "failed",
  output?: string,
  errorMessage?: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot update task step status: database not available");
      return false;
    }

    const updates: Record<string, unknown> = { status };
    if (output !== undefined) updates.output = output;
    if (errorMessage !== undefined) updates.errorMessage = errorMessage;
    if (status === "running") updates.startedAt = new Date();
    if (status === "completed" || status === "failed") {
      updates.completedAt = new Date();
    }

    await db.update(taskSteps).set(updates).where(eq(taskSteps.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update task step status:", error);
    return false;
  }
}

// Document queries
export async function createDocument(
  userId: number,
  filename: string,
  fileType: string,
  fileSize: number,
  storageKey: string,
  storageUrl: string,
  documentType: "uploaded" | "generated",
  taskId?: number,
  description?: string
): Promise<Document | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot create document: database not available");
      return null;
    }

    const result = await db.insert(documents).values({
      userId,
      taskId,
      filename,
      fileType,
      fileSize,
      storageKey,
      storageUrl,
      documentType,
      description,
    });

    const insertId = result[0]?.insertId;
    if (!insertId) {
      console.error("[Database] Failed to get insert ID for document");
      return null;
    }

    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, insertId as number))
      .limit(1);

    return document[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create document:", error);
    return null;
  }
}

export async function getUserDocuments(userId: number): Promise<Document[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get user documents:", error);
    return [];
  }
}

export async function getTaskDocuments(taskId: number): Promise<Document[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(documents)
      .where(eq(documents.taskId, taskId))
      .orderBy(desc(documents.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get task documents:", error);
    return [];
  }
}

// AuditLog queries
export async function logAuditEvent(
  action: string,
  resourceType: string,
  userId?: number,
  resourceId?: number,
  changes?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLog | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot create audit log: database not available");
      return null;
    }

    const result = await db.insert(auditLogs).values({
      userId,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress,
      userAgent,
    });

    const insertId = result[0]?.insertId;
    if (!insertId) {
      console.error("[Database] Failed to get insert ID for audit log");
      return null;
    }

    const log = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, insertId as number))
      .limit(1);

    return log[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
    return null;
  }
}

export async function getUserAuditLogs(userId: number, limit: number = 100): Promise<AuditLog[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get user audit logs:", error);
    return [];
  }
}

// User queries
export async function getAllUsers(): Promise<(typeof users.$inferSelect)[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get all users:", error);
    return [];
  }
}

export async function getUserById(id: number) {
  try {
    const db = await getDb();
    if (!db) return undefined;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get user by ID:", error);
    return undefined;
  }
}

export async function updateUserRole(userId: number, role: "user" | "admin"): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot update user role: database not available");
      return false;
    }

    await db.update(users).set({ role }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update user role:", error);
    return false;
  }
}
