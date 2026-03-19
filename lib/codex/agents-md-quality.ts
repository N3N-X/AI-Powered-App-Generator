export const QUALITY_RULES = `## QUALITY RULES (MANDATORY)

### FUNCTIONALITY FIRST
Every feature you build MUST actually work. Not just look good — WORK.
- Buttons must have onClick/onPress handlers that DO something real
- Forms must collect data and submit to database or API
- Lists must display real data from state, props, or API calls
- Navigation must actually navigate between screens/pages
- Action buttons (Book, Submit, Save, Send, etc.) must complete the full flow:
  1. Collect user input
  2. Validate the data
  3. Save to database or call API
  4. Show success/error feedback
  5. Update UI state accordingly

### Code Quality
- TypeScript with proper types — no \`any\` unless unavoidable
- All components must \`export default\`
- All imports must resolve to actual files in the project
- No unused imports or variables
- No placeholder content: "Lorem ipsum", "TODO", "Coming soon"
- Use real, contextually appropriate sample data

### File Structure
- \`App.tsx\` — root component with navigation
- \`src/services/api.ts\` — DO NOT CREATE THIS FILE (auto-injected by Rulxy)
- \`src/pages/\` (WEB) or \`src/screens/\` (IOS/ANDROID) — page components
- \`src/components/\` — shared components (optional)

### Design System & Visual Quality
Every generated app must look production-ready and polished, not like a prototype. Use the THEME object consistently for ALL visual properties.

**Typography Hierarchy (MANDATORY):**
- Use THEME.typography (web) or THEME.fontSize (mobile) for ALL text sizing
- Every page needs clear visual hierarchy: one hero/h1, section headings (h2), card titles (h3), body text, captions
- Headings: bold, high contrast (theme.colors.text). Secondary text: theme.colors.textSecondary. Muted: theme.colors.textMuted
- WEB: Spread typography objects: style={{ ...THEME.typography.h1, color: THEME.colors.text }}

**Spacing & Layout:**
- Use THEME.spacing for ALL padding, margins, and gaps — never hardcode arbitrary pixel values
- Section spacing: xxl (48) or xxxl (64 web) between major page sections
- Card padding: lg (24). Inner element gaps: md (16). Tight spacing: sm (8)
- Max content width: 1200px centered. Card grids: CSS Grid with gap using THEME.spacing.lg
- WEB: Add className="grid-responsive" on grid containers for auto-responsive columns

**Card & Container Patterns:**
- Cards: background surface, border, borderRadius lg (16), padding lg (24), shadow md
- Glass cards: use THEME.glass properties for frosted glass effect
- Hover on interactive cards: surfaceHover background, shadow lg, transform translateY(-2px), transition 'all 0.2s'
- Group related content in cards — never leave content floating without visual containers
- Mobile: { backgroundColor: theme.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.border }

**Button Variants:**
- Primary: background primary, color white, padding "sm xl", radius md, fontWeight 600, cursor pointer, transition 'all 0.2s'. Hover: primaryHover + glow shadow
- Secondary: background surface, border, color text. Hover: surfaceHover
- Ghost: background transparent, color primary. Hover: primaryGlow background
- Danger: background errorBg, color error. Hover: error background + white text
- All buttons: disabled state with 0.5 opacity + cursor not-allowed
- Mobile: Use Pressable/TouchableOpacity with activeOpacity 0.7

**Form Inputs:**
- WEB: background surface, border, radius md, padding "sm md", color text, fontSize body. Focus: border primary, outline none, boxShadow primaryGlow
- Labels: caption style, textSecondary color, textTransform uppercase, marginBottom xs
- Error messages: small fontSize, error color, marginTop xs
- Input groups: marginBottom md between fields
- Mobile: same pattern using StyleSheet.create + theme tokens

**Status & Feedback Colors:**
- Use THEME semantic colors: success/error/warning (+ successBg/errorBg/warningBg)
- Badges: semanticBg background + semantic color text, padding "2px sm", radius full, caption font
- Toast/alert patterns: semanticBg background, semantic color left border (4px), padding md

**Shadows & Depth:**
- WEB: Use THEME.shadow scale — sm for subtle depth, md for cards, lg for modals/popovers, xl for hero elements
- Glow shadow (THEME.shadow.glow) for primary CTAs and focused elements
- Cards always have shadow md; elevated/modal content uses lg

**Animations (WEB ONLY):**
- Add className="animate-in" to cards and content sections for fade-in on mount
- Add className="slide-up" to hero section content for dramatic entrance
- Stagger card animations: style={{ animationDelay: \`\${index * 0.1}s\` }}
- All interactive elements: transition: 'all 0.2s ease' for hover/active states
- Loading placeholders: use shimmer animation on gray rectangles

**Hero Sections (for home/landing pages on WEB):**
- Full-width section with xxxl (64) vertical padding, centered text
- Hero heading: THEME.typography.hero with gradient text (background: 'linear-gradient(135deg, #7c3aed, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent')
- Subtitle: h3 or body typography, textSecondary color, maxWidth 600px, margin '0 auto'
- CTA buttons below subtitle with lg gap between them
- Add className="slide-up" for entrance animation

**Empty States:**
- Center vertically and horizontally in available space
- Large muted icon (48-64px), h3 heading, body description in textMuted, maxWidth 400px
- Primary action button when applicable
- Never show a blank white/black page — always show an empty state with helpful guidance

**Responsive (WEB):**
- Mobile (<640px): single column grids, reduce hero font to h1 size, stack buttons vertically, full-width cards
- Tablet (641-1024px): 2-column grids
- Desktop (>1024px): 3-4 column grids, full layout

**Mobile-Specific (IOS/ANDROID):**
- Use StyleSheet.create for ALL styles — never inline style objects
- Use theme.spacing.* and theme.fontSize.* scales consistently throughout
- Use Pressable/TouchableOpacity with opacity feedback for all tappable elements
- ScrollView with contentContainerStyle using theme.spacing for padding

**iOS 26 — Liquid Glass:**
- Use expo-glass-effect GlassView for key surfaces (cards, floating buttons, headers) — max 3-5 per screen
- Always provide non-glass fallback using isLiquidGlassAvailable() check for older iOS
- Fallback: surface bg, radius xl, shadow from theme.shadow, borderWidth 1, borderColor border
- Minimal borders — use shadow + translucency for visual separation
- Large rounded corners: radius xl (24) for cards, md (12) for buttons, full for avatars/badges

**Android — Material Design 3:**
- Use theme.elevation levels for depth instead of hard shadows or borders
- Cards: surface bg, radius lg (16), elevation.level2 — NO borderWidth (use elevation)
- FABs: radius lg (16, NOT full circle), primary bg, elevation.level3, size 56
- Tonal buttons: primaryLight bg, primary text, radius full — the M3 "tonal" button pattern
- Bottom sheets: surface bg, borderTopLeftRadius xxl (28), elevation.level5

### Data & API
- Import API functions from \`../services/api\` (auto-injected)
- Handle loading and error states in all data-fetching components
- Use try/catch for all API calls

**Database usage (import { db } from '../services/api'):**
\`\`\`typescript
// List items — collection name, optional filter, optional scope ('global'|'user'|'all')
const items = await db.getAll('collectionName');
const filtered = await db.getAll('collectionName', { status: 'active' }, 'global');

// Get one item
const item = await db.getOne('collectionName', { id: itemId });

// Create — collection name, data object, optional scope
const newItem = await db.create('collectionName', { title: 'Hello', status: 'active' }, 'global');

// Update — collection name, id, update data, optional scope
await db.update('collectionName', itemId, { title: 'Updated' }, 'user');

// Delete — collection name, id, optional scope
await db.delete('collectionName', itemId, 'user');
\`\`\`
Replace 'collectionName' with the actual collection name from the app spec.

**Auth usage (import { auth } from '../services/api'):**
\`\`\`typescript
await auth.signup(email, password);
await auth.login(email, password);
await auth.logout();
const user = await auth.me(); // returns { success, user } — null user means not logged in
\`\`\`

**IMPORTANT — Complete Auth Flows:**
When implementing authentication, ALWAYS create:
1. A Login screen with email + password fields and a "Don't have an account? Sign up" link
2. A Signup/Register screen with email + password + optional name fields and an "Already have an account? Log in" link
3. Navigation between login and signup screens
4. A logout button accessible from the main app (e.g., settings or profile)
5. Auth state management — check \`auth.me()\` on mount, show login/signup if not authenticated
Never implement only login without signup, or vice versa.

**Email (import { email } from '../services/api'):**
\`\`\`typescript
await email.send('user@example.com', 'Hello', { html: '<p>Hi</p>' });
await email.notify('New Booking', { html: '<p>Details...</p>' }); // notifies app owner
\`\`\`
IMPORTANT: When users submit info the owner needs to act on (bookings, orders, contacts, etc.), ALWAYS save to DB first with db.create(), THEN notify with email.notify(). NEVER hardcode email addresses.

**SMS (import { sms } from '../services/api'):**
\`\`\`typescript
await sms.send({ to: '+1234567890', message: 'Hello' });
\`\`\`

**Payments:**
- **WEB** (Stripe proxy): \`import { payments } from '../services/api'\`
- **IOS/ANDROID** (RevenueCat): \`import { payments, initPayments } from '../services/payments'\`
  - Call \`await initPayments()\` on app startup before purchasing

**Maps (import { maps } from '../services/api'):**
\`\`\`typescript
const result = await maps.geocode('1600 Amphitheatre Parkway');
const dirs = await maps.directions(originLatLng, destLatLng);
const places = await maps.searchNearby({ query: 'restaurants', location, radius: 1000 });
\`\`\`

**Storage (import { storage } from '../services/api'):**
\`\`\`typescript
const { uploadUrl, publicUrl } = await storage.getUploadUrl(filename, contentType);
// Upload file to uploadUrl via PUT, then use publicUrl to display
const files = await storage.list(prefix);
await storage.delete(fileId);
\`\`\`

**AI (import { ai } from '../services/api'):**
\`\`\`typescript
// Chat with AI
const response = await ai.chat([{ role: 'user', content: 'Hello' }]);

// Generate images from text prompts (saved to project storage automatically)
const { url } = await ai.generateImage('Professional massage therapy, warm lighting');
// Use the url directly in <Image source={{ uri: url }} /> or <img src={url} />
\`\`\`

### IMAGE GENERATION RULES
**Generate images during seeding but ALWAYS handle failures gracefully.**
Image generation may fail (insufficient credits, network issues). Always use try/catch with placeholder fallback.

**Pattern for seeding with images:**
\`\`\`typescript
const generateImageSafe = async (prompt: string, fallbackText: string) => {
  try {
    const result = await ai.generateImage(prompt);
    return result?.url || \`https://placehold.co/400x300/1a1a2e/ffffff?text=\${encodeURIComponent(fallbackText)}\`;
  } catch {
    return \`https://placehold.co/400x300/1a1a2e/ffffff?text=\${encodeURIComponent(fallbackText)}\`;
  }
};

// In seedIfEmpty:
const massageImg = await generateImageSafe('Professional massage therapy session', 'Massage');
await db.create('services', { name: 'Deep Tissue Massage', image: massageImg, ... }, 'global');
\`\`\`

**NEVER let image generation errors break the app or seeding process.**

### RESOURCE AVAILABILITY & CONFLICT PREVENTION
When building systems that involve limited resources, ALWAYS implement proper availability checking:

**Applies to:** Booking systems, appointment scheduling, reservations, inventory management, seat selection, room booking, time slot allocation, ticket sales, rental systems, or any feature where multiple users compete for the same resource.

**Required implementation:**
1. **Check availability BEFORE allowing selection** — Query existing records to see what's taken
2. **Validate on submission** — Re-check availability when user submits (someone else may have booked)
3. **Prevent double-booking** — Same time slot, seat, item, or resource cannot be assigned twice
4. **Show real-time availability** — Disable or hide unavailable options in the UI
5. **Handle conflicts gracefully** — If conflict detected on submit, show error and refresh available options

**Example pattern:**
\`\`\`typescript
// Check what's already booked for a date/resource
const existingBookings = await db.getAll('bookings', {
  date: selectedDate,
  resourceId: resourceId
}, 'global');

// Filter out taken slots/items
const takenSlots = existingBookings.map(b => b.timeSlot);
const availableSlots = allSlots.filter(s => !takenSlots.includes(s));

// On submit, verify again before creating
const conflictCheck = await db.getAll('bookings', {
  date: selectedDate,
  timeSlot: selectedSlot,
  resourceId: resourceId
}, 'global');

if (conflictCheck.length > 0) {
  setError('This slot was just booked. Please select another.');
  refreshAvailability();
  return;
}

// Safe to create
await db.create('bookings', { ... });
\`\`\`

**For inventory/stock:**
- Track quantity available vs quantity reserved/sold
- Decrement stock atomically on purchase
- Show "Out of Stock" or "Only X left" when appropriate

### DATABASE SEEDING
Apps MUST seed sample data so lists are never empty on first load.

**Pattern (in App.tsx or main screen useEffect):**
\`\`\`typescript
useEffect(() => {
  const seedIfEmpty = async () => {
    const existing = await db.getAll('collectionName', {}, 'global');
    if (existing.length === 0) {
      // Seed 3-5 realistic items matching your app's domain
      await db.create('collectionName', { /* realistic data */ }, 'global');
      await db.create('collectionName', { /* realistic data */ }, 'global');
      await db.create('collectionName', { /* realistic data */ }, 'global');
    }
  };
  seedIfEmpty();
}, []);
\`\`\`

**Rules:**
- Check if collection is empty BEFORE seeding (prevents duplicates on reload)
- Use 'global' scope for shared data (services, products, menu items)
- Seed 3-5 items per collection with realistic, contextual data
- Include ALL required fields with appropriate values
- Seed on app load (useEffect with empty deps)

### FORM VALIDATION
Every form MUST validate input and show errors.

**Required:**
\`\`\`typescript
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return; // Prevent double-submit

  const newErrors: Record<string, string> = {};
  if (!formData.email) newErrors.email = 'Email is required';
  if (!formData.name) newErrors.name = 'Name is required';
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setIsSubmitting(true);
  try {
    await db.create('collection', formData);
    // Success feedback + clear form or navigate
  } catch (e) {
    setErrors({ form: 'Failed to submit. Please try again.' });
  } finally {
    setIsSubmitting(false);
  }
};
\`\`\`

### LIST MANAGEMENT
Lists MUST refresh after add/edit/delete operations.

**Pattern:**
\`\`\`typescript
const [items, setItems] = useState([]);

const loadItems = async () => {
  const data = await db.getAll('items', {}, 'global');
  setItems(data);
};

useEffect(() => { loadItems(); }, []);

const handleDelete = async (id: string) => {
  await db.delete('items', id);
  loadItems(); // Refresh list
};

const handleCreate = async (data) => {
  await db.create('items', data);
  loadItems(); // Refresh list
};
\`\`\`

### CONFIRMATION DIALOGS
Destructive actions (delete, cancel, clear) MUST confirm first.

**Pattern:**
\`\`\`typescript
const handleDelete = async (id: string) => {
  // Use platform-appropriate confirmation
  const confirmed = window.confirm('Delete this item? This cannot be undone.');
  // For React Native: Alert.alert('Confirm', 'Delete?', [{text:'Cancel'},{text:'Delete',onPress:()=>...}])
  if (!confirmed) return;

  await db.delete('items', id);
  loadItems();
};
\`\`\`

### CRITICAL: DO NOT
- Do NOT create src/services/api.ts (it's auto-injected by the platform)
- Do NOT install packages not in the allowed list
- Do NOT use react-router-dom (WEB uses state-based routing)
- Do NOT hardcode API URLs — always import from services/api
- Do NOT leave lists empty — always seed sample data
- Do NOT allow form submission without validation
- Do NOT delete without confirmation
`;
