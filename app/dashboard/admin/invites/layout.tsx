import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invite Management",
};

export default function InvitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
