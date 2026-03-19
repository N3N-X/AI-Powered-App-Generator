"use client";

import { useState, useEffect } from "react";

export type LayoutBreakpoint = "mobile" | "tablet" | "desktop" | "wide";

interface ResponsiveLayout {
  breakpoint: LayoutBreakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Whether the file explorer should auto-collapse */
  collapseExplorer: boolean;
  /** Whether advanced mode is available */
  allowAdvancedMode: boolean;
}

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

function getBreakpoint(width: number): LayoutBreakpoint {
  if (width >= BREAKPOINTS.wide) return "wide";
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [breakpoint, setBreakpoint] = useState<LayoutBreakpoint>("wide");

  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint(window.innerWidth));
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isDesktop: breakpoint === "desktop" || breakpoint === "wide",
    collapseExplorer: breakpoint === "mobile" || breakpoint === "tablet",
    allowAdvancedMode: breakpoint === "desktop" || breakpoint === "wide",
  };
}
