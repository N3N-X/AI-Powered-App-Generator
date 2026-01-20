"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useUIStore } from "@/stores/ui-store";

function ThemeSync() {
  const { theme: storeTheme } = useUIStore();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    setTheme(storeTheme);
  }, [storeTheme, setTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
