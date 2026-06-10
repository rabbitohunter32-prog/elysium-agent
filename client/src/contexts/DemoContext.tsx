import { createContext, useContext, ReactNode } from "react";

type DemoUser = {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  loginMethod: string;
};

type DemoContextType = {
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  enterDemoMode: (role: "user" | "admin") => void;
  exitDemoMode: () => void;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const isDemoMode = localStorage.getItem("demo_mode") === "true";
  const demoUserData = localStorage.getItem("demo_user");
  const demoUser = demoUserData ? JSON.parse(demoUserData) : null;

  const enterDemoMode = (role: "user" | "admin") => {
    const user = {
      id: role === "admin" ? 2 : 1,
      openId: role === "admin" ? "demo-admin-1" : "demo-user-1",
      name: role === "admin" ? "Demo Admin" : "Demo User",
      email: role === "admin" ? "admin@elysium.local" : "demo@elysium.local",
      role: role,
      loginMethod: "demo",
    };
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem("demo_user", JSON.stringify(user));
    localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    window.location.href = "/dashboard";
  };

  const exitDemoMode = () => {
    localStorage.removeItem("demo_mode");
    localStorage.removeItem("demo_user");
    localStorage.removeItem("manus-runtime-user-info");
    window.location.href = "/auth";
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoUser,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}
