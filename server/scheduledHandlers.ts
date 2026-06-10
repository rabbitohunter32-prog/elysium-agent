import { Request, Response } from "express";
import { getDb } from "./db";
import { eq, and, gt } from "drizzle-orm";
import { users, tasks, auditLogs } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";

/**
 * Scheduled handler for sending task completion notifications to the owner
 * Triggered by Heartbeat cron when tasks complete
 */
export async function handleTaskCompletionNotification(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database-unavailable" });
    }

    // Get recently completed tasks (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const completedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          gt(tasks.completedAt, oneHourAgo),
          eq(tasks.status, "completed")
        )
      )
      .limit(10);

    if (completedTasks.length === 0) {
      return res.json({ ok: true, skipped: "no-completed-tasks" });
    }

    // Get owner info
    const ownerOpenId = process.env.OWNER_OPEN_ID;
    const ownerName = process.env.OWNER_NAME || "Owner";

    if (!ownerOpenId) {
      return res.json({ ok: true, skipped: "no-owner-configured" });
    }

    // Prepare notification summary
    const summary = completedTasks
      .map((t) => `- ${t.title} (${t.objective.substring(0, 50)}...)`)
      .join("\n");

    const notificationTitle = `${completedTasks.length} Task${completedTasks.length > 1 ? "s" : ""} Completed`;
    const notificationContent = `The following tasks have been completed:\n\n${summary}`;

    // Send notification to owner
    const notified = await notifyOwner({
      title: notificationTitle,
      content: notificationContent,
    });

    if (!notified) {
      console.warn("[Scheduler] Failed to notify owner of task completions");
    }

    return res.json({
      ok: true,
      notified,
      tasksProcessed: completedTasks.length,
    });
  } catch (error) {
    console.error("[Scheduler] Task completion notification error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "unknown-error",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: req.body?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Scheduled handler for sending new user registration notifications to the owner
 * Triggered by Heartbeat cron periodically
 */
export async function handleNewUserNotification(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database-unavailable" });
    }

    // Get new users from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const newUsers = await db
      .select()
      .from(users)
      .where(gt(users.createdAt, oneHourAgo))
      .limit(10);

    if (newUsers.length === 0) {
      return res.json({ ok: true, skipped: "no-new-users" });
    }

    // Prepare notification summary
    const userList = newUsers
      .map((u) => `- ${u.name || "Anonymous"} (${u.email || "no-email"})`)
      .join("\n");

    const notificationTitle = `${newUsers.length} New User${newUsers.length > 1 ? "s" : ""} Registered`;
    const notificationContent = `Welcome new users to Elysium!\n\n${userList}`;

    // Send notification to owner
    const notified = await notifyOwner({
      title: notificationTitle,
      content: notificationContent,
    });

    if (!notified) {
      console.warn("[Scheduler] Failed to notify owner of new users");
    }

    return res.json({
      ok: true,
      notified,
      newUsersCount: newUsers.length,
    });
  } catch (error) {
    console.error("[Scheduler] New user notification error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "unknown-error",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: req.body?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Scheduled handler for sending task failure alerts to the owner
 * Triggered by Heartbeat cron when tasks fail
 */
export async function handleTaskFailureAlert(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database-unavailable" });
    }

    // Get failed tasks from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          gt(tasks.completedAt, oneHourAgo),
          eq(tasks.status, "failed")
        )
      )
      .limit(10);

    if (failedTasks.length === 0) {
      return res.json({ ok: true, skipped: "no-failed-tasks" });
    }

    // Prepare notification summary
    const failureList = failedTasks
      .map(
        (t) =>
          `- ${t.title}: ${t.errorMessage || "Unknown error"}`
      )
      .join("\n");

    const notificationTitle = `⚠️ ${failedTasks.length} Task${failedTasks.length > 1 ? "s" : ""} Failed`;
    const notificationContent = `The following tasks have failed:\n\n${failureList}\n\nPlease review the logs for more details.`;

    // Send notification to owner
    const notified = await notifyOwner({
      title: notificationTitle,
      content: notificationContent,
    });

    if (!notified) {
      console.warn("[Scheduler] Failed to notify owner of task failures");
    }

    return res.json({
      ok: true,
      notified,
      failedTasksCount: failedTasks.length,
    });
  } catch (error) {
    console.error("[Scheduler] Task failure alert error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "unknown-error",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: req.body?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
