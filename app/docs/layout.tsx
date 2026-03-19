import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation - Guides, Tutorials & API Reference",
  description:
    "Complete documentation for Rulxy AI app builder. Quick start guides, platform tutorials, API reference, and best practices for building web and mobile apps with AI.",
  alternates: { canonical: "https://rulxy.com/docs" },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
