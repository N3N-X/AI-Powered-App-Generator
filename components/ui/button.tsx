import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-500 ease-liquid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "liquid-glass-card liquid-shadow hover:liquid-shadow-lg text-gray-900 dark:text-white hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.02] hover:-translate-y-0.5",
        destructive:
          "bg-red-600/90 text-white liquid-shadow hover:bg-red-600 hover:liquid-shadow-lg backdrop-blur-2xl border border-red-500/20",
        outline:
          "border border-black/[0.08] dark:border-white/[0.08] bg-transparent backdrop-blur-xl text-gray-900 dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:border-black/[0.12] dark:hover:border-white/[0.12]",
        secondary:
          "bg-black/[0.05] dark:bg-white/[0.05] backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white hover:bg-black/[0.08] dark:hover:bg-white/[0.08]",
        ghost:
          "hover:bg-white/[0.08] backdrop-blur-sm text-gray-900 dark:text-white",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white liquid-glow hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] hover:-translate-y-0.5 border border-violet-500/20",
        glass:
          "liquid-glass-card liquid-shadow text-gray-900 dark:text-white hover:liquid-shadow-lg hover:bg-white/[0.08]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-2xl px-4 text-xs",
        lg: "h-12 rounded-3xl px-8 text-base",
        xl: "h-14 rounded-3xl px-10 text-lg",
        icon: "h-10 w-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
