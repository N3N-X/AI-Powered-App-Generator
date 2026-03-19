/** Check if an EAS error message is generic / unhelpful */
function isGenericErrorMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("unknown error") ||
    lower.includes("see logs") ||
    lower === "build failed" ||
    lower === "build error"
  );
}

/**
 * Fetch EAS build log files (bunyan JSON format) and extract the actual error
 * from the failed build phase.
 */
async function extractErrorFromBuildLogs(
  logFileUrls: string[],
): Promise<string | null> {
  try {
    const logTexts = await Promise.all(
      logFileUrls.slice(0, 3).map(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return "";
          return await res.text();
        } catch {
          return "";
        }
      }),
    );

    const combined = logTexts.join("\n");
    const lines = combined.split("\n").filter(Boolean);

    // Parse bunyan JSON log entries and collect messages per phase
    let currentPhase: string | null = null;
    const phaseMessages: Record<string, string[]> = {};
    const failedPhases: string[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.marker === "START_PHASE" && entry.phase) {
          currentPhase = entry.phase as string;
          if (!phaseMessages[currentPhase!]) {
            phaseMessages[currentPhase!] = [];
          }
        } else if (entry.marker === "END_PHASE") {
          if (entry.result === "FAIL" && currentPhase) {
            failedPhases.push(currentPhase);
          }
          currentPhase = null;
        } else if (currentPhase && entry.msg) {
          phaseMessages[currentPhase].push(entry.msg);
        }
      } catch {
        // Not JSON — treat as raw text in current phase
        if (currentPhase && line.trim()) {
          if (!phaseMessages[currentPhase]) {
            phaseMessages[currentPhase] = [];
          }
          phaseMessages[currentPhase].push(line.trim());
        }
      }
    }

    // Get messages from failed phases (prefer the last meaningful one)
    const skipPhases = [
      "FAIL_BUILD",
      "COMPLETE_BUILD",
      "ON_BUILD_CANCEL_HOOK",
      "COMPLETE_JOB",
    ];
    const relevantFailed = failedPhases.filter((p) => !skipPhases.includes(p));
    const targetPhase =
      relevantFailed.length > 0
        ? relevantFailed[relevantFailed.length - 1]
        : failedPhases[failedPhases.length - 1];

    if (targetPhase && phaseMessages[targetPhase]?.length > 0) {
      const msgs = phaseMessages[targetPhase];
      // Look for error-like lines first
      const errorLine = msgs.find((m) => {
        const lower = m.toLowerCase();
        return (
          lower.includes("error") ||
          lower.includes("failed") ||
          lower.includes("not exist") ||
          lower.includes("not found") ||
          lower.includes("unable to") ||
          lower.includes("cannot ")
        );
      });
      if (errorLine) return errorLine.substring(0, 300);
      // Otherwise return the last meaningful message from the failed phase
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg) return lastMsg.substring(0, 300);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve a meaningful error message for a failed EAS build.
 * Tries multiple sources in priority order:
 * 1. build.message field (if specific)
 * 2. Parsed build phase logs (actual error from the failed phase)
 * 3. Mapped error code / message pattern
 * 4. Original error message as-is
 */
export async function resolveErrorMessage(
  errorCode?: string,
  errorMsg?: string,
  buildMessage?: string,
  logFileUrls?: string[],
): Promise<string> {
  // 1. If build.message is specific, use it directly
  if (buildMessage && !isGenericErrorMessage(buildMessage)) {
    return buildMessage;
  }

  // 2. Try to extract the actual error from build phase logs (bunyan JSON)
  if (logFileUrls && logFileUrls.length > 0) {
    const logError = await extractErrorFromBuildLogs(logFileUrls);
    if (logError) return logError;
  }

  // 3. Map known EAS error codes
  if (errorCode) {
    const codeMap: Record<string, string> = {
      EAS_BUILD_UNKNOWN_ERROR:
        "Build failed during post-build phase. This usually means the project archive is missing required files (e.g. package.json).",
      EAS_BUILD_COMMAND_FAILED:
        "A build command failed. Check that your project dependencies and build configuration are correct.",
      EAS_BUILD_INSTALL_DEPENDENCIES_FAILED:
        "Failed to install dependencies. Check your package.json for invalid or incompatible packages.",
      EAS_BUILD_GRADLE_FAILED:
        "Android Gradle build failed. Check for compilation errors in your project code.",
      EAS_BUILD_XCODE_FAILED:
        "Xcode build failed. Check for Swift/Objective-C compilation errors or signing issues.",
      EAS_BUILD_CREDENTIALS_ERROR:
        "Build credentials are invalid or expired. Platform signing credentials may need to be regenerated.",
      EAS_BUILD_ARCHIVE_FAILED:
        "Failed to create the build archive. The project structure may be invalid.",
      UNKNOWN_ERROR:
        "Build failed during post-build phase. This usually means the project archive is missing required files (e.g. package.json).",
    };

    if (codeMap[errorCode]) return codeMap[errorCode];
  }

  // 4. Pattern-match on the error message text
  if (errorMsg) {
    const lower = errorMsg.toLowerCase();
    if (lower.includes("build complete hook"))
      return "Build failed during post-build phase. This usually means the project archive is missing required files (e.g. package.json).";
    if (lower.includes("install") && lower.includes("dependencies"))
      return "Failed to install project dependencies. Check package.json for errors.";
    if (lower.includes("gradle"))
      return "Android Gradle build failed. Check for compilation errors.";
    if (lower.includes("xcode") || lower.includes("signing"))
      return "Xcode build or code signing failed. Check your iOS build configuration.";
    if (lower.includes("credentials") || lower.includes("provisioning"))
      return "Build credentials are invalid or expired.";
  }

  // 5. Fall back to original message or a generic but clear one
  return (
    errorMsg ||
    "Build failed. Try rebuilding or check your project configuration."
  );
}
