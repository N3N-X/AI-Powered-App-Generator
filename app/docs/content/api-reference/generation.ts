export const generationSection = {
  title: "Generation API",
  content: `
# Generation API

Generate or refine code for a project.

## POST /api/vibe/generate

Start a generation job.

### Body
\`\`\`json
{
  "projectId": "proj_123",
  "prompt": "Build a landing page"
}
\`\`\`

### Response
SSE stream of events describing progress and file changes.
    `,
};
