import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Builds",
};

export default function BuildsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
