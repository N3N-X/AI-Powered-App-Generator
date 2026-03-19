"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useUIStore } from "@/stores/ui-store";

type Theme = "dark" | "light" | "system";

function ThemeSync() {
  const { theme: storeTheme, setTheme: setStoreTheme } = useUIStore();
  const { setTheme, theme } = useTheme();
  const isInitialized = React.useRef(false);
  const prevStoreTheme = React.useRef<Theme>(storeTheme);

  // On mount, sync store to next-themes (not the other way around)
  React.useEffect(() => {
    if (!isInitialized.current && theme) {
      // Update store to match next-themes on first load
      const validTheme = theme as Theme;
      setStoreTheme(validTheme);
      isInitialized.current = true;
      prevStoreTheme.current = validTheme;
    }
  }, [theme, setStoreTheme]);

  // When store theme changes (user action), update next-themes
  React.useEffect(() => {
    if (isInitialized.current && storeTheme !== prevStoreTheme.current) {
      setTheme(storeTheme);
      prevStoreTheme.current = storeTheme;
    }
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
