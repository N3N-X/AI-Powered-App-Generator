/**
 * AGENTS.md builder — assembles the instruction file that Codex reads
 * to understand the project conventions, platform rules, and proxy APIs.
 *
 * Reuses existing prompt modules from lib/agents/prompts/.
 */

import type { Platform } from "./client";
import { getPlatformRules } from "./prompts/platform-rules";
import { buildProxyDocs } from "./prompts/proxy-docs";
import { QUALITY_RULES } from "./agents-md-quality";

interface AgentsMdOptions {
  platform: Platform;
  apiBaseUrl: string;
  projectName?: string;
  appSpec?: Record<string, unknown> | null;
  hasExistingCode: boolean;
}

/**
 * Build the AGENTS.md content for a project workspace.
 * Codex automatically reads this file to guide its behavior.
 */
export function buildAgentsMd(options: AgentsMdOptions): string {
  const { platform, apiBaseUrl, projectName, appSpec, hasExistingCode } =
    options;

  const sections: string[] = [];

  // Header
  sections.push(`# Rulxy Project — ${projectName || "App"}
Platform: ${platform}
`);

  // Generation mode
  if (hasExistingCode) {
    sections.push(`## MODE: EDIT EXISTING APP
You are modifying an existing app. Read the current files first, then make
targeted changes. Do NOT rewrite files that don't need changes. Preserve
existing functionality, styles, and architecture.

### BUG FIX PROTOCOL
When the user reports something "doesn't work" or "is broken":
1. READ the relevant files first to understand what's there
2. TRACE the data flow — where does the click go? what function is called?
3. IDENTIFY the actual bug — missing handler? wrong import? state not updating?
4. FIX the specific issue — don't just shuffle code around
5. VERIFY the fix makes sense — does the button now call a real function?

Common issues to check:
- onClick/onPress handler missing or calling undefined function
- State not being updated after form submission
- Navigation not wired up (missing import or wrong screen name)
- API call not awaited or result not used
- Form values not connected to state (missing value/onChange)
`);
  } else {
    sections.push(`## MODE: NEW APP GENERATION
Generate a complete, production-ready app from scratch. Create all necessary
files with real functionality — no placeholder text, no TODO comments, no
mock data. Every feature must be fully implemented.
`);
  }

  // Platform rules
  sections.push(getPlatformRules(platform));

  // Proxy API docs
  sections.push(buildProxyDocs(apiBaseUrl));

  // Quality rules
  sections.push(QUALITY_RULES);

  // App spec (if available)
  if (appSpec) {
    sections.push(`## APP SPECIFICATION
\`\`\`json
${JSON.stringify(appSpec, null, 2)}
\`\`\`
`);

    // Custom branding from app spec
    const styling = appSpec.styling as
      | { primaryColor?: string; secondaryColor?: string; style?: string }
      | undefined;
    if (styling?.primaryColor) {
      sections.push(`## CUSTOM BRANDING
Replace the default primary color (#7c3aed for web, #6366F1 for mobile) with ${styling.primaryColor} in both DARK and LIGHT themes.
Adjust primaryHover, primaryGlow, primaryLight, and accent to complement this color.${styling.secondaryColor ? `\nUse ${styling.secondaryColor} as the accent color.` : ""}${styling.style ? `\nDesign style: ${styling.style}` : ""}
`);
    }
  }

  return sections.join("\n\n");
}
