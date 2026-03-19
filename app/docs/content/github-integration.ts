import type { ArticleContent } from "../types";

export const githubIntegrationContent: ArticleContent = {
  "connect-github": {
    title: "Connecting GitHub",
    content: `
# Connecting GitHub

Link your GitHub account for version control and collaboration.

## Benefits

- **Backup**: Your code is safely stored
- **History**: Full git version control
- **Collaboration**: Work with team members
- **CI/CD**: Trigger deployments automatically
- **Portfolio**: Showcase your projects

## Connection Steps

### 1. Go to Settings
Navigate to Dashboard → Settings → Integrations

### 2. Click Connect GitHub
You'll be redirected to GitHub.

### 3. Authorize Rulxy
- Review permissions requested
- Click "Authorize Rulxy"
- You'll return to Rulxy

### 4. Verify Connection
Your GitHub username appears in settings.

## Permissions Explained

Rulxy requests:
- **Read access**: See your repositories
- **Write access**: Create repos and push code
- **No delete access**: We can't delete your repos

## Managing Connection

### Reconnect
If connection expires:
1. Go to Settings → Integrations
2. Click "Reconnect GitHub"
3. Re-authorize

### Disconnect
To remove access:
1. Go to Settings → Integrations
2. Click "Disconnect"
3. Also revoke in GitHub settings

## Troubleshooting

### Authorization Failed
- Check pop-up blockers
- Try incognito mode
- Ensure GitHub account is verified

### Push Failures
- Verify repo exists
- Check branch permissions
- Ensure token hasn't expired
    `,
  },

  "push-repo": {
    title: "Pushing to Repositories",
    content: `
# Pushing to Repositories

Push your Rulxy projects to GitHub repositories.

## Prerequisites

- GitHub account connected
- Existing repository (or create new)
- Write access to repository

## Pushing Code

### Quick Push
1. Open your project
2. Click "Push to GitHub" button
3. Select repository
4. Choose branch (default: main)
5. Enter commit message
6. Click "Push"

### From Menu
1. Open project menu (⋮)
2. Select "GitHub → Push"
3. Configure push options
4. Confirm

## Push Options

### Commit Message
Write clear, descriptive messages:
\`\`\`
"Add user profile page with avatar upload"
"Fix navigation bug on iOS"
"Update dependencies and improve performance"
\`\`\`

### Branch Selection
- **main**: Production-ready code
- **develop**: Work in progress
- **feature/xxx**: Specific features

## After Pushing

### Verify on GitHub
1. Go to your repository
2. Check latest commit
3. Review changed files
4. Ensure nothing missing

### Automatic Actions
If configured, pushing triggers:
- CI/CD pipelines
- Automated tests
- Deploy previews

## Cost

Each push costs **10 credits**.
    `,
  },

  "create-repo": {
    title: "Creating New Repos",
    content: `
# Creating New Repositories

Create GitHub repositories directly from Rulxy.

## Creating a Repository

### From Project
1. Open your project
2. Click "Push to GitHub"
3. Select "Create New Repository"
4. Enter repository details
5. Click "Create & Push"

### Repository Options

**Name**
- Use lowercase and hyphens
- Example: my-awesome-app

**Description**
- Brief project description
- Shown on GitHub

**Visibility**
- Public: Anyone can see
- Private: Only you and collaborators

## Repository Structure

Rulxy creates a clean repository:

\`\`\`
my-app/
├── README.md
├── package.json
├── tsconfig.json
├── app/
│   └── ... (your code)
├── components/
│   └── ... (shared components)
└── .gitignore
\`\`\`

## After Creation

### Clone Locally
\`\`\`bash
git clone https://github.com/yourusername/my-app.git
cd my-app
npm install
\`\`\`

### Continue in Rulxy
Your project is now linked. Future pushes go to this repo automatically.

## Tips

1. **Naming**: Use descriptive, unique names
2. **Private first**: Start private, make public later
3. **README**: Update with actual documentation
4. **License**: Choose appropriate for your use case
    `,
  },

  collaboration: {
    title: "Sync & Collaboration",
    content: `
# Sync & Collaboration

Work with team members on Rulxy projects.

## Syncing with GitHub

### Push Changes
Send your changes to GitHub:
1. Make changes in Rulxy
2. Click "Push to GitHub"
3. Enter commit message
4. Changes appear on GitHub

### Pull Changes
Get changes from GitHub:
1. Click "Sync from GitHub"
2. Review incoming changes
3. Confirm merge
4. Your project updates

## Team Workflows

### Solo Developer
1. Work in Rulxy
2. Push when features complete
3. Keep history clean

### Small Team
1. Each member works on branches
2. Push to feature branches
3. Create pull requests
4. Merge after review

### Larger Team
1. Use GitHub for collaboration
2. Clone locally for complex work
3. Sync back to Rulxy when needed

## Best Practices

### Communication
- Use pull request descriptions
- Comment on specific lines
- Discuss before major changes

### Branching Strategy
\`\`\`
main
  └── develop
        ├── feature/auth
        ├── feature/dashboard
        └── fix/login-bug
\`\`\`

### Conflict Resolution
When changes conflict:
1. Pull latest changes
2. Review conflicts
3. Choose correct version
4. Test before pushing

## Limitations

- Real-time collaboration not yet available
- One editor at a time in Rulxy
- Use GitHub for async collaboration
    `,
  },
};
