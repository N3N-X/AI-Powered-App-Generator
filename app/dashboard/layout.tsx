import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./layout-client";
import { adminAuth } from "@/lib/firebase-admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for Firebase session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    redirect("/sign-in");
  }

  // Verify the session cookie
  try {
    await adminAuth.verifySessionCookie(sessionCookie);
  } catch (error) {
    console.error("Invalid session:", error);
    redirect("/sign-in");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
