export const projectsSection = {
  title: "Projects API",
  content: `
# Projects API

Manage projects programmatically.

## GET /api/projects

List all projects for the authenticated user.

### Response
\`\`\`json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "My App",
      "platform": "WEB",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

## GET /api/projects/:id

Get a single project by ID.

## POST /api/projects

Create a new project.

### Body
\`\`\`json
{
  "name": "My App",
  "platform": "WEB"
}
\`\`\`

## PATCH /api/projects/:id

Update project metadata or files.

## DELETE /api/projects/:id

Delete a project by ID.
    `,
};
