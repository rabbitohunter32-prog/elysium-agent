/**
 * Demo Authentication Module
 * Allows testing without Manus OAuth
 * Perfect for development and demos
 */

import { User } from "../drizzle/schema";

// Demo users for testing
export const DEMO_USERS = {
  user: {
    id: 1,
    openId: "demo-user-1",
    name: "Demo User",
    email: "demo@elysium.local",
    loginMethod: "demo",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  admin: {
    id: 2,
    openId: "demo-admin-1",
    name: "Demo Admin",
    email: "admin@elysium.local",
    loginMethod: "demo",
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
} as const;

export function getDemoUser(role: "user" | "admin" = "user") {
  return DEMO_USERS[role];
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true" || !process.env.VITE_APP_ID;
}
