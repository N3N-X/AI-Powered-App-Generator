"use client";

import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
  className,
  direction,
  ...props
}: Omit<
  React.ComponentProps<typeof ResizablePrimitive.Group>,
  "orientation"
> & {
  direction?: "horizontal" | "vertical";
}) => (
  <ResizablePrimitive.Group
    orientation={direction}
    className={cn(
      "flex h-full w-full",
      direction === "vertical" && "flex-col",
      className,
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      "relative flex w-2 shrink-0 items-center justify-center rounded-sm",
      "bg-white/[0.04] hover:bg-violet-500/20 transition-colors duration-150 cursor-col-resize",
      "[&[data-separator]:active]:bg-violet-500/30",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-8 w-3 items-center justify-center rounded-sm border border-white/10 bg-white/[0.08] backdrop-blur-sm hover:bg-violet-500/20 hover:border-violet-500/30 transition-colors">
        <GripVertical className="h-3 w-3 text-slate-400" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
