"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface ConfiguratorModalState {
  isOpen: boolean;
  serviceId?: string;
  open: (serviceId?: string) => void;
  close: () => void;
}

const ConfiguratorModalContext = createContext<ConfiguratorModalState | null>(null);

/** Mounted once at the root so any "Book Now" in "inline" mode can open the
 * same modal instance, wherever it's clicked from — see providers/internal.ts. */
export function ConfiguratorModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);

  const value = useMemo<ConfiguratorModalState>(
    () => ({
      isOpen,
      serviceId,
      open: (id) => {
        setServiceId(id);
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
    }),
    [isOpen, serviceId],
  );

  return <ConfiguratorModalContext.Provider value={value}>{children}</ConfiguratorModalContext.Provider>;
}

export function useConfiguratorModal(): ConfiguratorModalState {
  const ctx = useContext(ConfiguratorModalContext);
  if (!ctx) throw new Error("useConfiguratorModal must be used within ConfiguratorModalProvider");
  return ctx;
}
