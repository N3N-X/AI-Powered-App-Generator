import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice & Messaging",
};

export default function PhoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
