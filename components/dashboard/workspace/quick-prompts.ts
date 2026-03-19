/**
 * Quick prompt suggestions based on platform and generation state.
 */

export function getQuickPrompts(
  platform: string | undefined,
  hasGeneratedCode: boolean,
): string[] {
  if (hasGeneratedCode) {
    if (platform === "WEB") {
      return [
        "Add dark mode toggle",
        "Make the navigation sticky on scroll",
        "Add form validation with error messages",
        "Add loading skeletons for async content",
      ];
    } else if (platform === "IOS") {
      return [
        "Add a settings screen with toggles",
        "Add pull-to-refresh to the list",
        "Add haptic feedback on buttons",
        "Create a profile screen with avatar",
      ];
    } else if (platform === "ANDROID") {
      return [
        "Add a floating action button",
        "Create a drawer navigation menu",
        "Add swipe-to-delete on list items",
        "Add Material Design animations",
      ];
    }
    return [
      "Add dark mode toggle",
      "Add form validation",
      "Add loading states",
      "Add animations",
    ];
  } else {
    if (platform === "WEB") {
      return [
        "A portfolio website with project gallery and contact form",
        "A blog with categories, search, and dark mode toggle",
        "A dashboard showing analytics with charts and data tables",
        "A landing page for a SaaS product with pricing section",
      ];
    } else if (platform === "IOS") {
      return [
        "A workout tracker that logs exercises, sets, and reps with progress charts",
        "A recipe app where I can save favorites and create shopping lists",
        "A habit tracker with daily streaks and reminder notifications",
        "A notes app with folders, tags, and search functionality",
      ];
    } else if (platform === "ANDROID") {
      return [
        "A budget tracker that categorizes expenses and shows monthly spending",
        "A todo app with projects, due dates, and priority levels",
        "A weather app showing forecasts with location-based alerts",
        "A meditation app with guided sessions and progress tracking",
      ];
    }
    return [
      "A portfolio website with project gallery",
      "A dashboard with charts and data tables",
      "A blog with categories and search",
      "A landing page with pricing section",
    ];
  }
}
