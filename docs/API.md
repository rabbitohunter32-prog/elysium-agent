# Elysium Agent API Documentation

## Overview

Elysium Agent provides a comprehensive REST and tRPC API for autonomous task execution, conversation management, and document handling. All API endpoints are protected by authentication and role-based access control.

---

## Authentication

### Session-Based Authentication

All API requests require a valid session cookie (`app_session_id`). Authentication is handled automatically by the Manus OAuth system during login.

```bash
# Example: Authenticated request
curl -H "Cookie: app_session_id=<token>" \
  https://your-domain/api/trpc/tasks.list
```

### Role-Based Access Control

Users have two roles:

| Role | Permissions |
|------|-------------|
| **user** | Create and manage own tasks, view own documents, update own settings |
| **admin** | Manage all users, view system statistics, access admin panel |

---

## tRPC API Endpoints

### Authentication

#### `auth.me`
Get current user information.

**Query:**
```typescript
trpc.auth.me.useQuery()
```

**Response:**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}
```

#### `auth.logout`
Logout current user and clear session.

**Mutation:**
```typescript
trpc.auth.logout.useMutation()
```

**Response:**
```typescript
{ success: true }
```

---

### Tasks

#### `tasks.create`
Create a new task with objective.

**Mutation:**
```typescript
trpc.tasks.create.useMutation()
```

**Input:**
```typescript
{
  title: string;        // Task title
  objective: string;    // Detailed objective for the agent
}
```

**Response:**
```typescript
{
  task: {
    id: number;
    title: string;
    objective: string;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    progress: number;
    createdAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    finalOutput: string | null;
    errorMessage: string | null;
  };
  conversation: {
    id: number;
    title: string;
  };
}
```

#### `tasks.list`
Get all tasks for the current user.

**Query:**
```typescript
trpc.tasks.list.useQuery()
```

**Response:**
```typescript
Array<{
  id: number;
  title: string;
  objective: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  createdAt: Date;
  completedAt: Date | null;
}>
```

#### `tasks.get`
Get detailed information about a specific task.

**Query:**
```typescript
trpc.tasks.get.useQuery({ id: number })
```

**Response:**
```typescript
{
  task: Task;
  steps: TaskStep[];
  messages: Message[];
}
```

---

### Conversations

#### `conversations.list`
Get all conversations for the current user.

**Query:**
```typescript
trpc.conversations.list.useQuery()
```

**Response:**
```typescript
Array<{
  id: number;
  title: string;
  taskId: number | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### `conversations.get`
Get detailed conversation with all messages.

**Query:**
```typescript
trpc.conversations.get.useQuery({ id: number })
```

**Response:**
```typescript
{
  id: number;
  title: string;
  taskId: number | null;
  messages: Message[];
}
```

---

### Messages

#### `messages.create`
Add a message to a conversation.

**Mutation:**
```typescript
trpc.messages.create.useMutation()
```

**Input:**
```typescript
{
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
}
```

**Response:**
```typescript
{
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}
```

#### `messages.list`
Get all messages in a conversation.

**Query:**
```typescript
trpc.messages.list.useQuery({ conversationId: number })
```

**Response:**
```typescript
Array<{
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: unknown;
  createdAt: Date;
}>
```

---

### Documents

#### `documents.list`
Get all documents for the current user.

**Query:**
```typescript
trpc.documents.list.useQuery()
```

**Response:**
```typescript
Array<{
  id: number;
  filename: string;
  fileType: string;
  fileSize: number;
  documentType: "generated" | "uploaded";
  storageUrl: string;
  storageKey: string;
  taskId: number | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

---

### Agent Execution

#### `agent.planExecution`
Create an execution plan for a task (breaks down objective into steps).

**Mutation:**
```typescript
trpc.agent.planExecution.useMutation()
```

**Input:**
```typescript
{
  taskId: number;
}
```

**Response:**
```typescript
{
  taskId: number;
  steps: Array<{
    stepOrder: number;
    description: string;
    tool: string;
  }>;
}
```

#### `agent.executeTask`
Execute a task with the created plan.

**Mutation:**
```typescript
trpc.agent.executeTask.useMutation()
```

**Input:**
```typescript
{
  taskId: number;
  conversationId?: number;
}
```

**Response:**
```typescript
{
  taskId: number;
  status: "running" | "completed" | "failed";
  progress: number;
  finalOutput: string | null;
  errorMessage: string | null;
}
```

#### `agent.cancelTask`
Cancel a running task.

**Mutation:**
```typescript
trpc.agent.cancelTask.useMutation()
```

**Input:**
```typescript
{
  taskId: number;
}
```

**Response:**
```typescript
{ success: true }
```

---

### Admin Operations (Admin Only)

#### `admin.users`
Get all users (admin only).

**Query:**
```typescript
trpc.admin.users.useQuery()
```

**Response:**
```typescript
Array<{
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  lastSignedIn: Date;
}>
```

#### `admin.updateUserRole`
Update a user's role (admin only).

**Mutation:**
```typescript
trpc.admin.updateUserRole.useMutation()
```

**Input:**
```typescript
{
  userId: number;
  role: "user" | "admin";
}
```

**Response:**
```typescript
{ success: true }
```

---

## HTTP Scheduled Task Endpoints

### Task Completion Notification

**Endpoint:** `POST /api/scheduled/task-completion`

**Authentication:** Cron-only (automatic via Heartbeat)

**Response:**
```typescript
{
  ok: true;
  notified: boolean;
  tasksProcessed: number;
}
```

### New User Notification

**Endpoint:** `POST /api/scheduled/new-users`

**Authentication:** Cron-only (automatic via Heartbeat)

**Response:**
```typescript
{
  ok: true;
  notified: boolean;
  newUsersCount: number;
}
```

### Task Failure Alert

**Endpoint:** `POST /api/scheduled/task-failures`

**Authentication:** Cron-only (automatic via Heartbeat)

**Response:**
```typescript
{
  ok: true;
  notified: boolean;
  failedTasksCount: number;
}
```

---

## Error Handling

All API errors follow this format:

```typescript
{
  code: string;           // Error code (e.g., "UNAUTHORIZED", "NOT_FOUND")
  message: string;        // Human-readable error message
  timestamp: string;      // ISO 8601 timestamp
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid session |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| BAD_REQUEST | 400 | Invalid input parameters |
| INTERNAL_SERVER_ERROR | 500 | Server error |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Scheduled tasks**: Unlimited (internal use only)

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1686000000
```

---

## Pagination

List endpoints support pagination via query parameters:

```typescript
{
  page?: number;      // Page number (default: 1)
  pageSize?: number;  // Items per page (default: 20, max: 100)
}
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  const result = await trpc.tasks.create.useMutation().mutateAsync({
    title: "My Task",
    objective: "Do something"
  });
} catch (error) {
  console.error("Task creation failed:", error);
}
```

### 2. Use Optimistic Updates

```typescript
const mutation = trpc.tasks.create.useMutation({
  onMutate: async (newTask) => {
    // Optimistically update UI
    await queryClient.cancelQueries({ queryKey: ["tasks"] });
    const previousTasks = queryClient.getQueryData(["tasks"]);
    queryClient.setQueryData(["tasks"], (old) => [...old, newTask]);
    return { previousTasks };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(["tasks"], context?.previousTasks);
  },
});
```

### 3. Implement Proper Loading States

```typescript
const { data, isLoading, error } = trpc.tasks.list.useQuery();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <TaskList tasks={data} />;
```

---

## Webhooks and Events

The platform supports owner notifications via the Heartbeat system. Configure scheduled tasks to receive notifications about:

- New user registrations
- Task completions
- Task failures
- System events

See `references/periodic-updates.md` for detailed scheduling documentation.

---

## Support

For API support and questions, please contact the development team or refer to the troubleshooting guide in the documentation.
