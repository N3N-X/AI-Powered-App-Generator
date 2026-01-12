import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import JSZip from "jszip";

async function buildDioxusApp(
  tempDir: string,
  platform: string,
  buildType: "source" | "executable",
): Promise<Buffer> {
  try {
    // Write Cargo.toml if needed
    const cargoPath = path.join(tempDir, "Cargo.toml");
    if (!fs.existsSync(cargoPath)) {
      throw new Error("Cargo.toml not found in generated code");
    }

    // For source builds, just zip everything
    if (buildType === "source") {
      const sourceZip = new JSZip();
      const files = fs.readdirSync(tempDir, { recursive: true });

      for (const file of files) {
        const fullPath = path.join(tempDir, file as string);
        if (fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath);
          sourceZip.file(
            path.join("rux-app", file as string),
            content
          );
        }
      }

      return sourceZip.generateAsync({ type: "nodebuffer" });
    }

    // For executable builds, run cargo build
    console.log(`Building Dioxus app for ${platform}...`);

    let buildCommand: string;
    const releaseDir = path.join(tempDir, "target", "release");

    switch (platform) {
      case "windows":
        buildCommand = "cargo build --release --target x86_64-pc-windows-msvc";
        break;
      case "macos":
        buildCommand = "cargo build --release --target x86_64-apple-darwin";
        break;
      case "linux":
        buildCommand = "cargo build --release --target x86_64-unknown-linux-gnu";
        break;
      default:
        buildCommand = "cargo build --release";
    }

    execSync(buildCommand, {
      cwd: tempDir,
      stdio: "inherit",
    });

    // Bundle executable
    const executableZip = new JSZip();
    let executablePath: string;
    let executableName: string;

    if (platform === "windows") {
      executablePath = path.join(releaseDir, "rux_app.exe");
      executableName = "rux-app.exe";
    } else if (platform === "macos") {
      executablePath = path.join(releaseDir, "rux-app");
      executableName = "rux-app";
    } else {
      executablePath = path.join(releaseDir, "rux-app");
      executableName = "rux-app";
    }

    if (!fs.existsSync(executablePath)) {
      throw new Error(`Build failed: executable not found at ${executablePath}`);
    }

    const executableContent = fs.readFileSync(executablePath);
    executableZip.file(executableName, executableContent, {
      unixPermissions: platform !== "windows" ? "755" : undefined,
    });

    // Add README for platform
    const platformReadme = {
      windows: `# RUX App (Windows)\n\nExtract and run rux-app.exe\n\n## Requirements\n- Windows 10+\n- Visual C++ Runtime (usually already installed)`,
      macos: `# RUX App (macOS)\n\nExtract and run: ./rux-app\n\nOr from Terminal:\n\`\`\`bash\ncd extracted_folder\n./rux-app\n\`\`\`\n\n## Requirements\n- macOS 10.12+`,
      linux: `# RUX App (Linux)\n\nExtract and run: ./rux-app\n\nOr from Terminal:\n\`\`\`bash\ncd extracted_folder\n./rux-app\n\`\`\`\n\n## Requirements\n- Linux (GTK 3.0+)`,
    };

    executableZip.file("README.txt", platformReadme[platform as keyof typeof platformReadme] || platformReadme.linux);

    return executableZip.generateAsync({ type: "nodebuffer" });

  } catch (error) {
    console.error("Dioxus build error:", error);
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() { },
        remove() { },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    let code: Record<string, string>;
    let platform: string;
    let buildType: "source" | "executable" = "source";

    if (id === 'temp') {
      const body = await request.json();
      code = body.code;
      platform = body.platform;
      buildType = body.build_type || "source";
    } else {
      const { data: app, error: appError } = await supabase
        .from("generated_apps")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (appError || !app) {
        return NextResponse.json(
          { error: "App not found" },
          { status: 404 },
        );
      }

      code = JSON.parse(app.code);
      platform = app.platform;
      buildType = app.build_type || "source";
    }

    const buildId = uuidv4();
    const tempDir = path.join(process.cwd(), "temp-builds", buildId);

    try {
      await fs.promises.mkdir(tempDir, { recursive: true });

      // Write all files
      for (const [filePath, content] of Object.entries(code)) {
        const fullPath = path.join(tempDir, filePath);
        const dir = path.dirname(fullPath);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(fullPath, content, "utf8");
      }

      console.log(`Starting ${buildType} build for ${platform} app in ${tempDir}`);

      const fileBuffer = await buildDioxusApp(tempDir, platform, buildType);
      const fileName = `rux-${platform}-${buildType}-${Date.now()}.zip`;

      // Save the file temporarily
      const filePath = path.join(tempDir, fileName);
      await fs.promises.writeFile(filePath, fileBuffer);

      // Clean up temp directory
      await fs.promises.rm(tempDir, { recursive: true, force: true });

      return new NextResponse(Buffer.from(fileBuffer), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });

    } catch (buildError) {
      console.error("Build error:", buildError);

      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }

      return NextResponse.json(
        { error: "Build failed. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Build API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

