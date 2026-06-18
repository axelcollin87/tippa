"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { ToastProvider } from "./Toast";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session && ((session as any).error === "UserNotFound" || (session as any).error === "UserNotFoundOrNotApproved")) {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard>
        <ToastProvider>
          {children}
        </ToastProvider>
      </SessionGuard>
    </SessionProvider>
  );
}
