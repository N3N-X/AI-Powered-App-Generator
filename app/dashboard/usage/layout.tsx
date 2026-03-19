import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usage & Credits",
};

export default function UsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
