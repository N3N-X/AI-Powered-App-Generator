export function formatFileEditLabel(
  fileNames: string[],
  paths: string[],
): string {
  if (fileNames.length === 0) return "Editing files";

  const isScreen = paths.some(
    (p) =>
      p.toLowerCase().includes("screen") || p.toLowerCase().includes("page"),
  );
  const isComponent = paths.some(
    (p) => p.toLowerCase().includes("component") || p.includes("/components/"),
  );
  const isService = paths.some(
    (p) =>
      p.toLowerCase().includes("service") ||
      p.toLowerCase().includes("api") ||
      p.toLowerCase().includes("util"),
  );
  const isStyle = paths.some(
    (p) => p.toLowerCase().includes("style") || p.endsWith(".css"),
  );

  const formatName = (name: string) =>
    name
      .replace(/Screen$|Page$|Component$|View$/i, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2");

  const formattedNames = fileNames.map(formatName);

  if (fileNames.length === 1) {
    const name = formattedNames[0];
    if (isScreen) return `Building ${name} screen`;
    if (isComponent) return `Creating ${name} component`;
    if (isService) return `Setting up ${name}`;
    if (isStyle) return `Styling ${name}`;
    return `Writing ${name}`;
  }

  if (fileNames.length === 2) {
    return `Updating ${formattedNames.join(" and ")}`;
  }

  if (isScreen) return `Building ${fileNames.length} screens`;
  if (isComponent) return `Creating ${fileNames.length} components`;
  return `Updating ${fileNames.length} files`;
}
