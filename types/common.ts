// ============================================
// File Tree Types
// ============================================

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  PLAN_LIMIT_EXCEEDED: "PLAN_LIMIT_EXCEEDED",
  BUILD_FAILED: "BUILD_FAILED",
  GITHUB_ERROR: "GITHUB_ERROR",
  AI_ERROR: "AI_ERROR",
} as const;
