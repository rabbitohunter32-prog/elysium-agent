import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type DemoUser = {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  loginMethod: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastSignedIn?: string | Date;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // Check for demo mode
  const isDemoMode = typeof window !== "undefined" && localStorage.getItem("demo_mode") === "true";
  const demoUserData = isDemoMode ? localStorage.getItem("demo_user") : null;
  const demoUser: DemoUser | null = demoUserData ? JSON.parse(demoUserData) : null;

  const meQuery = trpc.auth.me.useQuery(isDemoMode ? undefined : undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !isDemoMode,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("demo_user");
      localStorage.removeItem("manus-runtime-user-info");
      window.location.href = "/auth";
      return;
    }

    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils, isDemoMode]);

  const state = useMemo(() => {
    if (isDemoMode && demoUser) {
      return {
        user: demoUser,
        loading: false,
        error: null,
        isAuthenticated: true,
      };
    }

    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    isDemoMode,
    demoUser,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (isDemoMode) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
    isDemoMode,
  ]);

  return {
    ...state,
    refresh: () => isDemoMode ? Promise.resolve() : meQuery.refetch(),
    logout,
  };
}
