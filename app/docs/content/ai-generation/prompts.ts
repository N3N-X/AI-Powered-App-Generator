export const promptsSection = {
  title: "Writing Effective Prompts",
  content: `
# Writing Effective Prompts

Master the art of communicating with AI to get exactly what you need.

## Prompt Structure

### Good Prompts Include:
- **What**: The component or feature
- **How**: Specific behavior or appearance
- **Where**: Location in the app
- **Why**: Context helps AI make decisions

### Example - Good Prompt
\`\`\`
"Create a user profile card that displays:
- Circular avatar image (100px)
- User name in bold
- Email in gray text below
- Edit button in the top right corner
Use a subtle shadow and rounded corners."
\`\`\`

### Example - Poor Prompt
\`\`\`
"Make a profile thing"
\`\`\`

## Prompt Patterns

### Creating New Features
\`\`\`
"Add a search bar at the top of the products page that:
- Filters products by name in real-time
- Shows 'No results' when nothing matches
- Has a clear button when text is entered"
\`\`\`

### Modifying Existing Code
\`\`\`
"Update the navigation bar to:
- Make the logo 20% larger
- Add a notification bell icon
- Change the background to gradient purple"
\`\`\`

### Fixing Issues
\`\`\`
"The submit button isn't working. When clicked:
- It should validate all form fields
- Show loading state while submitting
- Display success message or errors"
\`\`\`

### Styling Changes
\`\`\`
"Apply dark mode styling to the settings page:
- Dark background (#1a1a2e)
- Light text (#e0e0e0)
- Purple accent color (#8b5cf6)
- Smooth transition when toggling"
\`\`\`

## Advanced Techniques

### Referencing Components
\`\`\`
"Create a new ProductCard similar to the existing UserCard
but with price, rating, and 'Add to Cart' button"
\`\`\`

### Platform-Specific
\`\`\`
"Add haptic feedback on iOS when buttons are pressed,
and use the system share sheet for the share function"
\`\`\`

## Common Mistakes to Avoid

1. **Too vague**: "Make it better" → Specify what to improve
2. **Too much at once**: Break into smaller requests
3. **No context**: Reference existing components
4. **Assuming knowledge**: Describe the full requirement
    `,
};
