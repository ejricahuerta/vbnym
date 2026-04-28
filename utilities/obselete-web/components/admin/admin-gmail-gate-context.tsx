"use client";

import { createContext, useContext } from "react";

/** When no provider is mounted, assume connected so modals stay usable in isolation/tests. */
const AdminGmailGateContext = createContext(true);

export function AdminGmailGateProvider({
  children,
  gmailConnected,
}: {
  children: React.ReactNode;
  gmailConnected: boolean;
}) {
  return (
    <AdminGmailGateContext.Provider value={gmailConnected}>
      {children}
    </AdminGmailGateContext.Provider>
  );
}

export function useAdminGmailConnected() {
  return useContext(AdminGmailGateContext);
}
