import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  return {
    title: project?.name ?? "Project",
  };
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No sidebar for project workspace - full IDE experience
  return <>{children}</>;
}
