import type { ArticleContent } from "../types";

export const webAppsContent: ArticleContent = {
  "web-basics": {
    title: "Building Web Apps",
    content: `
# Building Web Apps

Create modern, responsive web applications with Rulxy.

## Web App Features

### Instant Deployment
Every web project gets a live URL:
- **yourproject.rulxy.com** - available immediately
- SSL/HTTPS included
- Global CDN distribution

### Modern Stack
Rulxy generates web apps using:
- React 18+ with hooks
- Modern CSS (Tailwind-compatible)
- ES modules for clean imports
- No build configuration needed

## Creating a Web App

### 1. New Project
Click "New Project" and select "Web" as your platform.

### 2. Describe Your App
\`\`\`
"Create a landing page for a SaaS product with:
- Hero section with headline and CTA
- Features grid (3 columns)
- Pricing table
- Footer with links"
\`\`\`

### 3. Preview Live
Your app is immediately available at the generated URL.

## Web-Specific Prompts

### Responsive Design
\`\`\`
"Make the layout responsive:
- Stack columns on mobile
- Hide sidebar on small screens
- Adjust font sizes for readability"
\`\`\`

### Animations
\`\`\`
"Add scroll animations:
- Fade in sections as they enter viewport
- Smooth hover effects on cards
- Loading skeleton for data"
\`\`\`

## Best Practices

1. **Mobile-first**: Design for small screens, scale up
2. **Performance**: Optimize images, lazy load content
3. **Accessibility**: Use semantic HTML, proper contrast
4. **Testing**: Check on multiple browsers and devices
    `,
  },

  subdomains: {
    title: "Live Subdomains",
    content: `
# Live Subdomains

Every Rulxy web project gets a free, instant subdomain.

## How It Works

When you create a web project:
1. A unique subdomain is generated
2. Your app is deployed automatically
3. SSL certificate is provisioned
4. CDN caching is enabled

Your app is live at: **yourproject.rulxy.com**

## Subdomain Features

### Instant Updates
- Changes deploy in seconds
- No manual deployment needed
- Version history maintained

### SSL Included
- HTTPS enabled by default
- Auto-renewing certificates
- Secure for all users

### Global CDN
- Fast loading worldwide
- Edge caching
- DDoS protection

## Managing Your Subdomain

### View Your URL
Find your live URL in:
- Project settings
- Preview panel header
- Dashboard project card

### Share Your App
Copy the URL to share with:
- Clients for feedback
- Team members for review
- Users for testing

## Custom Domains

Want your own domain? Pro and Elite plans support custom domains like:
- **myapp.com**
- **app.mycompany.com**

See [Custom Domains](/docs/custom-domains) for setup instructions.
    `,
  },

  "custom-domains": {
    title: "Custom Domains",
    content: `
# Custom Domains

Connect your own domain to Rulxy web apps (Pro and Elite plans).

## Requirements

- Pro or Elite subscription
- A domain you own
- Access to DNS settings

## Setup Process

### Step 1: Add Domain
1. Open project settings
2. Go to "Domain" tab
3. Enter your domain (e.g., myapp.com)
4. Click "Add Domain"

### Step 2: Configure DNS
Add these DNS records at your registrar:

**For apex domain (myapp.com):**
\`\`\`
Type: A
Name: @
Value: [IP provided in dashboard]
\`\`\`

**For subdomain (app.mycompany.com):**
\`\`\`
Type: CNAME
Name: app
Value: [CNAME provided in dashboard]
\`\`\`

### Step 3: Verify
1. Click "Verify Domain" in settings
2. Wait for DNS propagation (up to 24 hours)
3. SSL certificate auto-provisions

## Troubleshooting

### Domain Not Verifying
- Check DNS records are correct
- Wait for propagation (can take 24-48 hours)
- Ensure no conflicting records

### SSL Issues
- SSL provisions automatically after verification
- May take up to 1 hour after verification
- Check for CAA records blocking issuance

## Multiple Domains

You can add multiple domains to one project:
- Primary domain (myapp.com)
- www variant (www.myapp.com)
- Staging domain (staging.myapp.com)
    `,
  },
};
