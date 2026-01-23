import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders, handleCorsOptions, withCors } from "@/lib/cors";
import { randomBytes } from "crypto";
import { io } from "socket.io-client";

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * Create a Snack session for the RUX runtime
 * Publishes code to SnackPub so the runtime can receive it
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return withCors(
        NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      );
    }

    const { files, dependencies, name, description } = body;

    if (!files || typeof files !== "object") {
      return withCors(
        NextResponse.json({ error: "Invalid files" }, { status: 400 }),
      );
    }

    // Validate files structure
    const sanitizedFiles: Record<string, { contents: string; type: string }> =
      {};
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
        sanitizedFiles[safePath] = {
          type: "CODE",
          contents: fileContent,
        };
      }
    }

    if (Object.keys(sanitizedFiles).length === 0) {
      return withCors(
        NextResponse.json(
          { error: "No valid files provided" },
          { status: 400 },
        ),
      );
    }

    // Prepare dependencies
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

    // Generate a unique channel ID for this session
    const channel = randomBytes(16).toString("hex");

    console.log("[Snack] Creating session:", {
      name: safeName,
      channel,
      fileCount: Object.keys(sanitizedFiles).length,
    });

    // Connect to SnackPub and publish the code
    const snackPubUrl = "https://snackpub.expo.dev";
    const socket = io(snackPubUrl, {
      transports: ["websocket", "polling"],
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error("SnackPub connection timeout"));
      }, 10000);

      socket.on("connect", () => {
        console.log("[Snack] Connected to SnackPub");
        clearTimeout(timeout);
        resolve();
      });

      socket.on("connect_error", (err) => {
        console.error("[Snack] SnackPub connection error:", err);
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Subscribe to the channel
    socket.emit("subscribe", { channel });

    // Publish the code to the channel
    socket.emit("message", {
      channel,
      message: {
        type: "CODE",
        diff: {
          added: sanitizedFiles,
          removed: [],
          modified: [],
        },
        s3url: {},
        dependencies: sanitizedDependencies,
        sdkVersion: "52.0.0",
      },
    });

    console.log("[Snack] Published code to channel:", channel);

    // Keep the connection open for a bit to ensure delivery
    await new Promise((resolve) => setTimeout(resolve, 1000));
    socket.disconnect();

    // Create the runtime URL
    const runtimeUrl = new URL("https://run.rux.sh");
    runtimeUrl.searchParams.set("runtime-version", "exposdk:52.0.0");
    runtimeUrl.searchParams.set("snack-channel", channel);

    return withCors(
      NextResponse.json({
        success: true,
        channel,
        url: runtimeUrl.toString(),
        files: sanitizedFiles,
        dependencies: sanitizedDependencies,
        name: safeName,
        description: safeDescription,
      }),
    );
  } catch (error) {
    console.error("[Snack] Creation error:", error);
    return withCors(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create session",
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      ),
    );
  }
}
