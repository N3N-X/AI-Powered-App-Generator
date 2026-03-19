export const iterativeSection = {
  title: "Iterative Development",
  content: `
# Iterative Development

Build complex apps step by step with AI-assisted iteration.

## The Iterative Approach

Instead of describing your entire app at once, build incrementally:

### Phase 1: Core Structure
\`\`\`
"Create a basic app structure with:
- Bottom tab navigation (Home, Search, Profile)
- Placeholder content for each screen
- Basic header with app name"
\`\`\`

### Phase 2: Add Features
\`\`\`
"On the Home screen, add:
- Welcome message with user name
- Grid of featured items (3 columns)
- Pull-to-refresh functionality"
\`\`\`

### Phase 3: Polish
\`\`\`
"Improve the Home screen:
- Add loading skeletons
- Smooth fade-in animations
- Better spacing and typography"
\`\`\`

## Benefits of Iteration

1. **Easier to debug**: Smaller changes = easier fixes
2. **Better results**: AI focuses on one thing at a time
3. **More control**: Review each step before continuing
4. **Lower cost**: Fewer refinement cycles needed

## Iteration Workflow

### Review Generated Code
After each generation:
1. Check the preview
2. Test functionality
3. Review file changes
4. Note what needs adjustment

### Refine as Needed
If something isn't right:
\`\`\`
"The button color should be violet, not blue.
Also make it slightly larger with more padding."
\`\`\`

### Build on Success
When satisfied, add the next feature:
\`\`\`
"Now add a settings screen with:
- Profile section with avatar
- Notification toggles
- Logout button"
\`\`\`

## Version Control

Use Git integration to:
- Save working versions
- Experiment safely
- Roll back if needed
- Track progress
    `,
};
