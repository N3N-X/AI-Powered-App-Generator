"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          500
        </h1>
        <p className="text-xl text-gray-500 dark:text-slate-400 mb-2">
          Something went wrong
        </p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">
          {error.digest
            ? `Error ID: ${error.digest}`
            : "An unexpected error occurred."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="gradient" onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
