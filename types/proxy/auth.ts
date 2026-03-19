import { z } from "zod";

// ============================================
// Proxy Authentication
// ============================================

export const ProxyAuthHeaderSchema = z.object({
  "x-rux-project-id": z.string(),
  "x-rux-api-key": z.string(),
});
export type ProxyAuthHeader = z.infer<typeof ProxyAuthHeaderSchema>;

// ============================================
// App Auth Proxy Types (User authentication for generated apps)
// ============================================

export const AppAuthOperationEnum = z.enum([
  "signup",
  "login",
  "logout",
  "me",
  "updateProfile",
  "changePassword",
  "forgotPassword",
  "resetPassword",
  "verifyEmail",
  "deleteAccount",
]);
export type AppAuthOperation = z.infer<typeof AppAuthOperationEnum>;

// Signup
export const AppAuthSignupRequestSchema = z.object({
  operation: z.literal("signup"),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
  anonymousSessionToken: z.string().optional(),
});
export type AppAuthSignupRequest = z.infer<typeof AppAuthSignupRequestSchema>;

// Anonymous session (auto-created on app launch for user-scoped data)
export const AppAuthAnonymousSessionRequestSchema = z.object({
  operation: z.literal("anonymousSession"),
});
export type AppAuthAnonymousSessionRequest = z.infer<
  typeof AppAuthAnonymousSessionRequestSchema
>;

// Login
export const AppAuthLoginRequestSchema = z.object({
  operation: z.literal("login"),
  email: z.string().email(),
  password: z.string(),
});
export type AppAuthLoginRequest = z.infer<typeof AppAuthLoginRequestSchema>;

// Logout
export const AppAuthLogoutRequestSchema = z.object({
  operation: z.literal("logout"),
  sessionToken: z.string(),
});
export type AppAuthLogoutRequest = z.infer<typeof AppAuthLogoutRequestSchema>;

// Get current user
export const AppAuthMeRequestSchema = z.object({
  operation: z.literal("me"),
  sessionToken: z.string(),
});
export type AppAuthMeRequest = z.infer<typeof AppAuthMeRequestSchema>;

// Update profile
export const AppAuthUpdateProfileRequestSchema = z.object({
  operation: z.literal("updateProfile"),
  sessionToken: z.string(),
  name: z.string().max(100).nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type AppAuthUpdateProfileRequest = z.infer<
  typeof AppAuthUpdateProfileRequestSchema
>;

// Change password
export const AppAuthChangePasswordRequestSchema = z.object({
  operation: z.literal("changePassword"),
  sessionToken: z.string(),
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(128),
});
export type AppAuthChangePasswordRequest = z.infer<
  typeof AppAuthChangePasswordRequestSchema
>;

// Forgot password
export const AppAuthForgotPasswordRequestSchema = z.object({
  operation: z.literal("forgotPassword"),
  email: z.string().email(),
});
export type AppAuthForgotPasswordRequest = z.infer<
  typeof AppAuthForgotPasswordRequestSchema
>;

// Reset password
export const AppAuthResetPasswordRequestSchema = z.object({
  operation: z.literal("resetPassword"),
  token: z.string(),
  newPassword: z.string().min(8).max(128),
});
export type AppAuthResetPasswordRequest = z.infer<
  typeof AppAuthResetPasswordRequestSchema
>;

// Verify email
export const AppAuthVerifyEmailRequestSchema = z.object({
  operation: z.literal("verifyEmail"),
  token: z.string(),
});
export type AppAuthVerifyEmailRequest = z.infer<
  typeof AppAuthVerifyEmailRequestSchema
>;

// Delete account
export const AppAuthDeleteAccountRequestSchema = z.object({
  operation: z.literal("deleteAccount"),
  sessionToken: z.string(),
  password: z.string(),
});
export type AppAuthDeleteAccountRequest = z.infer<
  typeof AppAuthDeleteAccountRequestSchema
>;

// Union of all auth requests
export const AppAuthProxyRequestSchema = z.discriminatedUnion("operation", [
  AppAuthSignupRequestSchema,
  AppAuthAnonymousSessionRequestSchema,
  AppAuthLoginRequestSchema,
  AppAuthLogoutRequestSchema,
  AppAuthMeRequestSchema,
  AppAuthUpdateProfileRequestSchema,
  AppAuthChangePasswordRequestSchema,
  AppAuthForgotPasswordRequestSchema,
  AppAuthResetPasswordRequestSchema,
  AppAuthVerifyEmailRequestSchema,
  AppAuthDeleteAccountRequestSchema,
]);
export type AppAuthProxyRequest = z.infer<typeof AppAuthProxyRequestSchema>;

// Auth response
export const AppAuthProxyResponseSchema = z.object({
  success: z.boolean(),
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      emailVerified: z.boolean(),
      metadata: z.record(z.unknown()).nullable(),
      createdAt: z.string(),
    })
    .optional(),
  sessionToken: z.string().optional(),
  expiresAt: z.string().optional(),
  message: z.string().optional(),
  creditsUsed: z.number(),
});
export type AppAuthProxyResponse = z.infer<typeof AppAuthProxyResponseSchema>;
