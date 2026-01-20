import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Create a Snack session on Expo's servers
 * This avoids URL length issues by uploading files server-side
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { files, dependencies, name, description } = body;

    if (!files || typeof files !== "object") {
      return NextResponse.json({ error: "Invalid files" }, { status: 400 });
    }

    // Validate files structure
    const sanitizedFiles: Record<string, { contents: string }> = {};
    for (const [path, content] of Object.entries(files)) {
      if (typeof path !== "string" || path.length === 0) continue;

      // Handle both { contents: string } and direct string formats
      const fileContent =
        typeof content === "object" && content !== null && "contents" in content
          ? (content as { contents: string }).contents
          : typeof content === "string"
            ? content
            : null;

      if (typeof fileContent === "string") {
        // Sanitize file path to prevent path traversal
        const safePath = path.replace(/\.\./g, "").replace(/^\/+/, "");
        sanitizedFiles[safePath] = { contents: fileContent };
      }
    }

    if (Object.keys(sanitizedFiles).length === 0) {
      return NextResponse.json(
        { error: "No valid files provided" },
        { status: 400 },
      );
    }

    // Sanitize dependencies
    const sanitizedDependencies: Record<string, string> = {
      expo: "~52.0.0",
      react: "18.3.1",
      "react-native": "0.76.5",
    };

    if (dependencies && typeof dependencies === "object") {
      for (const [pkg, version] of Object.entries(dependencies)) {
        if (typeof pkg === "string" && typeof version === "string") {
          // Basic validation of package name (alphanumeric, @, /, -, _)
          if (/^[@a-zA-Z0-9][\w\-/.]*$/.test(pkg)) {
            sanitizedDependencies[pkg] = version;
          }
        }
      }
    }

    // Sanitize name and description
    const safeName =
      typeof name === "string"
        ? name.slice(0, 100).replace(/[<>]/g, "")
        : "RUX App";
    const safeDescription =
      typeof description === "string"
        ? description.slice(0, 500).replace(/[<>]/g, "")
        : "Built with RUX";

    // Create Snack session via Expo API
    const response = await fetch("https://snack.expo.dev/--/api/v2/snack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeName,
        description: safeDescription,
        files: sanitizedFiles,
        dependencies: sanitizedDependencies,
        sdkVersion: "52.0.0",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("Snack API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to create Snack session", details: errorText },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid response from Snack API" },
        { status: 502 },
      );
    }

    if (!data.id) {
      return NextResponse.json(
        { error: "No Snack ID returned" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      snackId: data.id,
      url: `https://snack.expo.dev/@snack/${data.id}`,
    });
  } catch (error) {
    console.error("Snack session creation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create session",
      },
      { status: 500 },
    );
  }
}
