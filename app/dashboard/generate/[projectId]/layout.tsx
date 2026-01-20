export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No sidebar for project workspace - full IDE experience
  return <>{children}</>;
}
