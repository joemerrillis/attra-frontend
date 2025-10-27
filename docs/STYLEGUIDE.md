# Attra Frontend Styleguide

**Version:** 1.0
**Last Updated:** 2025-10-27
**Purpose:** Authoritative design system and implementation reference for all Attra frontend development

---

## 🎯 Product Vision

**Attra is a mobile-first control center for small business owners doing boots-on-the-ground marketing.**

Users are real estate agents, political organizers, small business owners who hang physical flyers and need to know **immediately** when someone scans a QR code and becomes a lead. They check Attra on their phone between appointments, not at a desk.

**Core User Experience:**
- "I hung 20 flyers this morning. Did anyone scan them?"
- "I have 3 new contacts. Let me email them right now before I forget."
- "All my pins are clear. I'm caught up for the day!"

**Not This:**
- Enterprise dashboard with 15 charts
- Desktop-first analytics platform
- Generic CRM with complex workflows

---

## ●>attra>● Brand Identity

**The Attra logo represents the cycle of physical-to-digital-to-physical marketing.**

### Logo Meaning

**Full logo:** `●>attra>●`

**●>** Physical to Digital
- Flyer scanned → Contact created
- Physical interest → Digital lead
- Scanner → Map lights up
- Real-world action → Data changes

**>●** Digital to Physical
- Campaign created → Flyers printed
- Digital plan → Physical distribution
- Analytics → Strategic placement

**Together:** The complete cycle of boots-on-the-ground marketing

### Usage in UI

**●> (Physical to Digital) - Use for:**
- Success messages when scans happen
- Empty state hints about hanging flyers
- Section headers about real-time activity
- Notifications about new contacts

```tsx
// ✅ Good: Using ●> for physical→digital moments
<Alert variant="success">
  <AlertTitle>●> New scan detected!</AlertTitle>
  <AlertDescription>
    Someone just scanned your flyer at Downtown Coffee
  </AlertDescription>
</Alert>

// Empty state
<EmptyState
  headline="●> Hang flyers to see scans appear"
  description="Your map will light up when people scan your QR codes"
/>

// Section header in long text
<h3 className="text-lg font-semibold">●> Real-Time Activity</h3>
```

**>● (Digital to Physical) - Use for:**
- Campaign creation success
- Flyer generation complete
- Asset print instructions
- Strategic planning sections

```tsx
// ✅ Good: Using >● for digital→physical moments
<Alert variant="success">
  <AlertTitle>>● Campaign created!</AlertTitle>
  <AlertDescription>
    Your flyers are ready to print and distribute
  </AlertDescription>
</Alert>

// Section header
<h3 className="text-lg font-semibold">>● Create Your Campaign</h3>
```

**Typography:**
- Use as-is in monospace context: `●>attra>●`
- Can use Unicode characters: ● (U+25CF) > (U+003E)
- In headings: treat as decorative (non-essential for meaning)
- Always include space after: `●> New scan` not `●>New scan`

**Anti-Patterns:**
```tsx
// ❌ Bad: Using wrong direction
<Alert>●> Campaign created</Alert>  {/* Should be >● */}

// ❌ Bad: Using for generic messages
<p>●> Settings updated</p>  {/* Not physical/digital transition */}

// ❌ Bad: No space after
<h3>●>Real-Time Activity</h3>  {/* Hard to read */}
```

---

## 🎨 Design Philosophy: "Data-Forward Minimalist"

### 1. Thumb-First (Mobile-First)

**Primary actions are always within thumb reach on a phone.**

✅ **Correct:**
- FAB (Floating Action Button) in bottom-right corner
- Bottom navigation for primary tabs
- Large touch targets (minimum 44px)
- Critical actions at bottom of screen

❌ **Wrong:**
- Top-aligned action buttons
- Small touch targets (< 40px)
- Desktop-first layouts that squeeze on mobile
- Hamburger menus hiding primary navigation

**Implementation Example:**
```tsx
// ✅ Good: FAB for primary action
<FloatingActionButton
  to="/campaigns/new"
  className="fixed bottom-20 right-4 md:bottom-6 md:right-6"
>
  <Plus className="w-6 h-6" />
</FloatingActionButton>

// ❌ Bad: Desktop-style top action
<header>
  <Button>Create Campaign</Button> {/* User has to reach to top */}
</header>
```

---

### 2. Glanceable Data (Big Numbers, Small Labels)

**Users glance at their phone for 3 seconds. Information hierarchy must be instant.**

✅ **Correct:**
- 32px+ font for key metrics
- 12-14px font for labels
- Color-coded states (blue = live, red = urgent, green = success)
- Maximum 3 data points per card

❌ **Wrong:**
- Same font size for labels and data
- Walls of text
- 10 metrics on one screen
- Neutral colors for everything

**Implementation Example:**
```tsx
// ✅ Good: Clear hierarchy
<div className="space-y-1">
  <p className="text-3xl font-bold text-foreground">247</p>
  <p className="text-sm text-muted-foreground">Total Scans</p>
</div>

// ❌ Bad: No hierarchy
<div>
  <p className="text-base">Total Scans: 247</p>
</div>
```

---

### 3. Teach By Doing (Graceful Onboarding)

**First-time hints appear contextually and fade away. No modal tutorials.**

✅ **Correct:**
- Inline hints that dismiss permanently
- Empty states that teach next action
- Contextual tooltips on hover/long-press
- Progressive disclosure

❌ **Wrong:**
- Modal walkthrough on first load
- Persistent tooltips that never go away
- "Help" documentation as only guidance
- Assuming users know the workflow

**Implementation Example:**
```tsx
// ✅ Good: Empty state teaches
{campaigns.length === 0 && (
  <EmptyState
    icon={<Target />}
    headline="Create your first campaign"
    description="Campaigns let you organize QR codes by location or event"
    action={
      <Button variant="accent" to="/campaigns/new">
        Create Campaign
      </Button>
    }
  />
)}

// ❌ Bad: Just shows nothing
{campaigns.length === 0 && <p>No campaigns</p>}
```

---

### 4. Fast Over Perfect (Optimistic UI)

**Actions feel instant. Confirmations happen in background.**

✅ **Correct:**
- Optimistic updates (update UI immediately, sync later)
- Loading states for > 300ms operations only
- Offline-first (cache everything, sync when connected)
- Undo instead of "Are you sure?"

❌ **Wrong:**
- Spinner for every action
- Confirmation modals for reversible actions
- Blocking UI during network calls
- "Saving..." messages

**Implementation Example:**
```tsx
// ✅ Good: Optimistic delete
const handleDelete = async (id) => {
  // Update UI immediately
  setCampaigns(prev => prev.filter(c => c.id !== id));

  try {
    await api.deleteCampaign(id);
    toast.success("Campaign deleted", { action: "Undo" });
  } catch (error) {
    // Rollback on failure
    setCampaigns(prev => [...prev, deletedCampaign]);
    toast.error("Failed to delete campaign");
  }
};

// ❌ Bad: Confirmation modal + blocking
const handleDelete = async (id) => {
  if (!confirm("Are you sure?")) return;
  setLoading(true);
  await api.deleteCampaign(id);
  setLoading(false);
};
```

---

### 5. In Control, Always (Transparent State)

**Users always know what's happening and can take action.**

✅ **Correct:**
- Current state visible (e.g., "Syncing...", "Last updated 2m ago")
- Ability to retry failed actions
- Clear feedback for every interaction
- Undo for destructive actions

❌ **Wrong:**
- Silent failures
- No indication of sync status
- Permanent destructive actions
- Unclear whether action completed

**Implementation Example:**
```tsx
// ✅ Good: Clear state + retry
{syncStatus === 'failed' && (
  <Alert variant="warning">
    <AlertDescription>
      Failed to sync. <Button variant="link" onClick={retry}>Retry</Button>
    </AlertDescription>
  </Alert>
)}

// ❌ Bad: Silent failure
{/* Nothing shown when sync fails */}
```

---

## 🎨 Visual Design System

### Color Palette

**Primary: Deep Blue-Gray (Slate)**
- Used for: Text, backgrounds, UI chrome
- Not flashy, gets out of the way of data
- Professional but not corporate

```css
--primary: 215 25% 27%;           /* #1E293B - Slate 800 */
--primary-foreground: 210 40% 98%; /* #F8FAFC - Slate 50 */
```

**Accent: Action Orange**
- Used for: CTAs, FAB, active states, primary actions
- High contrast, thumb-stopping
- Only for things users should click

```css
--accent: 24 95% 53%;              /* #F97316 - Orange 500 */
--accent-foreground: 0 0% 100%;    /* #FFFFFF - White */
```

**Live: Electric Blue**
- Used for: Real-time indicators, pulsing pins, "happening now"
- Conveys activity and urgency
- Animated (pulse, glow)

```css
--live: 217 91% 60%;               /* #3B82F6 - Blue 500 */
```

**Success: Emerald Green**
- Used for: Conversions, completed actions, success states
- Positive reinforcement
- Never for alerts/warnings

```css
--success: 142 71% 45%;            /* #10B981 - Emerald 500 */
```

**Destructive: Red**
- Used for: Errors, destructive actions, urgent attention
- Sparingly (don't alarm users unnecessarily)

```css
--destructive: 0 84% 60%;          /* #EF4444 - Red 500 */
```

**When to Use Which Color:**

| Context | Color | Example |
|---------|-------|---------|
| Primary action button | Accent (Orange) | "Create Campaign" |
| Real-time activity | Live (Blue) | Pulsing map pin |
| Conversion event | Success (Green) | "Contact created!" |
| Navigation active state | Accent (Orange) | Active tab indicator |
| Error message | Destructive (Red) | "Failed to save" |
| Body text | Primary (Slate) | All text content |
| Background (light mode) | White | Page background |
| Background (dark mode) | Slate 950 | Page background |

---

### Typography

**System Font Stack (Fast, Native Feel)**

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

**Why system fonts:**
- Instant load (no web font download)
- Native feel on each platform
- Excellent readability
- Accessibility built-in

❌ **Don't use:** Custom web fonts, script fonts, decorative typefaces

**Type Scale:**

| Purpose | Size | Weight | Example |
|---------|------|--------|---------|
| Hero number | 48px (3rem) | 700 | "247" total scans |
| Large data | 32px (2rem) | 700 | Card headline numbers |
| Headline | 24px (1.5rem) | 600 | Section headers |
| Body | 16px (1rem) | 400 | Paragraphs, descriptions |
| Small label | 14px (0.875rem) | 500 | Input labels, captions |
| Tiny label | 12px (0.75rem) | 400 | Metadata, timestamps |

**Hierarchy Example:**
```tsx
// ✅ Good: Clear hierarchy
<div>
  <h2 className="text-2xl font-semibold mb-2">Active Campaigns</h2>
  <p className="text-sm text-muted-foreground mb-4">
    Manage your marketing campaigns
  </p>
  <div className="space-y-4">
    <div className="text-3xl font-bold">5</div>
    <div className="text-sm text-muted-foreground">Total Campaigns</div>
  </div>
</div>

// ❌ Bad: No hierarchy
<div>
  <div>Active Campaigns</div>
  <div>Manage your marketing campaigns</div>
  <div>5 Total Campaigns</div>
</div>
```

---

### Spacing System

**8px base grid (Tailwind default)**

| Spacing | Value | Use Case |
|---------|-------|----------|
| xs | 4px | Tight groups (icon + label) |
| sm | 8px | Related items |
| md | 16px | Card padding, form fields |
| lg | 24px | Section spacing |
| xl | 32px | Page margins |
| 2xl | 48px | Major section breaks |

**Touch Targets:**
- Minimum: 44x44px (Apple HIG standard)
- Preferred: 48x48px (Material Design standard)

```tsx
// ✅ Good: Adequate touch target
<Button className="h-12 px-6">Tap Me</Button>

// ❌ Bad: Too small for mobile
<Button className="h-8 px-2 text-xs">Tap Me</Button>
```

---

### Component Design Patterns

#### Buttons

**Hierarchy: Only 2 button styles per screen**

```tsx
// Primary action (accent orange)
<Button variant="accent">Create Campaign</Button>

// Secondary actions (outline)
<Button variant="outline">Cancel</Button>

// Tertiary/text actions
<Button variant="ghost">Learn More</Button>

// Destructive
<Button variant="destructive">Delete</Button>
```

**Button Sizes:**
```tsx
<Button size="sm">Small</Button>     // 36px height
<Button size="default">Default</Button> // 44px height
<Button size="lg">Large</Button>     // 52px height
```

**Anti-Pattern:**
```tsx
// ❌ Bad: Too many button styles on one screen
<Button variant="accent">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
// ^ User doesn't know which is most important
```

---

#### Cards

**Cards are data containers, not decorative.**

```tsx
// ✅ Good: Minimal card with clear data
<Card className="p-4">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Downtown Coffee</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-live">12</div>
    <div className="text-sm text-muted-foreground">scans today</div>
  </CardContent>
</Card>

// ❌ Bad: Over-designed card
<Card className="p-8 border-2 shadow-2xl rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <h3>Downtown Coffee</h3>
      <p>12 scans today</p>
    </div>
    <div className="text-6xl">📊</div>
  </div>
</Card>
```

**Card Elevation:**
- Default: `border` only (no shadow) for light backgrounds
- Hover: `shadow-md` for interactive cards
- Active/Selected: `ring-2 ring-accent` for selected state

---

#### Navigation

**Bottom Navigation (Mobile Primary)**

4 tabs maximum:
1. **Dashboard** - Home, overview, real-time feed
2. **Campaigns** - Manage campaigns
3. **Map** - Real-time location view
4. **Settings** - Account, billing, preferences

```tsx
// ✅ Good: 4 clear tabs
<MobileBottomNav items={[
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: Target, label: "Campaigns", to: "/campaigns" },
  { icon: Map, label: "Map", to: "/map" },
  { icon: Settings, label: "Settings", to: "/settings" }
]} />

// ❌ Bad: 6+ tabs (too crowded)
<MobileBottomNav items={[
  { icon: Home, label: "Home", to: "/" },
  { icon: Target, label: "Campaigns", to: "/campaigns" },
  { icon: Map, label: "Map", to: "/map" },
  { icon: Users, label: "Contacts", to: "/contacts" },
  { icon: BarChart, label: "Analytics", to: "/analytics" },
  { icon: Settings, label: "Settings", to: "/settings" }
]} /> {/* User can't read labels, icons too small */}
```

**Active State:**
- Orange indicator bar (4px tall)
- Icon and label in accent color
- Smooth transition

---

#### Floating Action Button (FAB)

**Purpose: Single most important action on the page**

```tsx
// ✅ Good: Positioned for thumb reach
<FloatingActionButton
  to="/campaigns/new"
  label="New Campaign"
  className="fixed bottom-20 right-4 md:bottom-6 md:right-6"
/>

// Position: bottom-right, above bottom nav on mobile
// Size: 56x56px (Material Design standard)
// Color: Accent (orange)
// Shadow: shadow-lg for elevation
```

**When NOT to use FAB:**
- Page has multiple primary actions (use buttons instead)
- Mobile keyboard is visible (FAB would cover input)
- Desktop-only view (FAB is mobile pattern)

---

#### Forms

**Mobile-first form design:**

```tsx
// ✅ Good: Clear labels, large inputs
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="campaign-name" className="text-sm font-medium">
      Campaign Name
    </Label>
    <Input
      id="campaign-name"
      type="text"
      placeholder="e.g., Downtown Flyers"
      className="h-12" // Large touch target
    />
  </div>

  <Button variant="accent" size="lg" className="w-full">
    Create Campaign
  </Button>
</form>

// ❌ Bad: Tiny inputs, floating labels
<form>
  <Input
    placeholder="Campaign Name"
    className="h-8" // Too small for mobile
  />
  <Button size="sm">Create</Button>
</form>
```

**Form Validation:**
- Validate on blur (not on every keystroke)
- Show errors inline below field
- Use red text + icon for errors
- Clear errors immediately when fixed

---

#### Empty States

**Every list/data view needs a designed empty state.**

**Empty State Anatomy:**
1. Icon (illustrative, not decorative)
2. Headline (what's missing)
3. Description (why it's empty + what to do)
4. Primary action (how to add first item)

```tsx
// ✅ Good: Actionable empty state
<EmptyState
  icon={<Target className="w-16 h-16 text-muted-foreground" />}
  headline="No campaigns yet"
  description="Create your first campaign to start tracking QR code scans"
  action={
    <Button variant="accent" to="/campaigns/new">
      <Plus className="w-4 h-4 mr-2" />
      Create Campaign
    </Button>
  }
/>

// ❌ Bad: Lazy empty state
<div>No campaigns found</div>
```

**Contextual Empty States:**

Different messages based on user state:

```tsx
// First-time user (onboarding)
"Create your first campaign to get started"

// User has campaigns but filtered to zero
"No campaigns match your filters. Try adjusting your search."

// User deleted last item
"All campaigns deleted. Create a new one to continue."
```

---

#### Loading States

**Only show loaders for operations > 300ms**

```tsx
// ✅ Good: Skeleton for initial load
{isLoading && <CampaignListSkeleton />}
{!isLoading && campaigns.map(campaign => <CampaignCard {...campaign} />)}

// ✅ Good: Inline spinner for background action
<Button disabled={isSaving}>
  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
  {isSaving ? "Saving..." : "Save"}
</Button>

// ❌ Bad: Full-page spinner for everything
{isLoading && <div className="fixed inset-0 flex items-center justify-center">
  <Spinner size="xl" />
</div>}
```

---

#### Toasts (Notifications)

**Use toasts for background confirmations, not critical info.**

```tsx
// ✅ Good: Non-blocking success
toast.success("Campaign created", {
  description: "Downtown Flyers is now active",
  action: { label: "View", onClick: () => navigate(`/campaigns/${id}`) }
});

// ✅ Good: Error with retry
toast.error("Failed to save campaign", {
  action: { label: "Retry", onClick: handleRetry }
});

// ❌ Bad: Toast for critical error
toast.error("Your account has been suspended");
// ^ Should be a modal or dedicated error page
```

**Toast Positioning:**
- Mobile: Top-center (easier to read, doesn't block FAB)
- Desktop: Bottom-right (out of the way)

---

## 🎯 State-Driven UI Patterns

### Contextual Dashboards

**The dashboard should show different content based on user activity state.**

**States to Detect:**
1. **No campaigns** → Onboarding
2. **Campaigns but no assets** → Incomplete setup
3. **Assets but no scans** → Encourage distribution
4. **Scans but no contacts** → Celebrate early activity
5. **Contacts ready** → Urgent action required
6. **All caught up** → Success state

**Implementation Pattern:**
```tsx
function DashboardFeed({ stats }) {
  // Priority order: Most urgent state first

  if (stats.contactsReady > 0) {
    return (
      <ContextCard
        priority="urgent"
        icon={<Mail className="text-destructive" />}
        headline={`${stats.contactsReady} contacts ready to follow up`}
        subtext="Don't let leads go cold"
        action={
          <Button variant="accent" to="/contacts?filter=ready">
            Follow Up Now
          </Button>
        }
      />
    );
  }

  if (stats.todayScans > 0 && stats.contactsReady === 0) {
    return (
      <ContextCard
        priority="positive"
        icon={<TrendingUp className="text-success" />}
        headline={`${stats.todayScans} scans today!`}
        subtext="Great activity so far"
        action={
          <Button variant="outline" to="/analytics">
            View Details
          </Button>
        }
      />
    );
  }

  if (stats.campaignCount === 0) {
    return (
      <ContextCard
        priority="onboarding"
        icon={<Target />}
        headline="Create your first campaign"
        subtext="Get started in under 2 minutes"
        action={
          <Button variant="accent" to="/campaigns/new">
            Create Campaign
          </Button>
        }
      />
    );
  }

  // All caught up
  return (
    <ContextCard
      priority="success"
      icon={<CheckCircle className="text-success" />}
      headline="You're all caught up!"
      subtext="No pending contacts to follow up with"
    />
  );
}
```

**Anti-Pattern:**
```tsx
// ❌ Bad: Static dashboard that doesn't adapt
function Dashboard() {
  return (
    <>
      <StatsGrid />
      <RecentActivity />
      <CampaignList />
    </>
  );
}
// ^ Same view whether user has 0 campaigns or 100
```

---

### Real-Time Map Badges

**Map pins show live activity with badge counts.**

**Badge States:**
1. **No badge** → No pending contacts at this location
2. **Number badge (1-9)** → Count of pending contacts (red, pulsing)
3. **"9+"** → More than 9 pending contacts
4. **Badge clearing** → Fade-out animation when contact emailed (Pro only)

**Visual Design:**
```tsx
<MapPinBadge
  count={contactsPending}
  status={contactsPending > 0 ? "alert" : "none"}
  onClear={handleEmailSent} // Pro feature
/>
```

**Badge Colors:**
- Alert (pending): Red (#EF4444) with pulse animation
- Success (cleared): Green (#10B981) with fade-out
- None: No badge shown

**Interaction:**
- Tap pin → Opens bottom sheet with contact list
- Each contact shows: Name, email, scanned time
- Pro users: "Open in Gmail" button (clears badge when clicked)
- Free users: See contacts but can't email (upgrade prompt)

---

### Feature Gates (FOMO UI Patterns)

**Philosophy: "Data in is free, data out costs something"**

Free users can SEE features but not USE them. This creates urgency to upgrade.

**Feature Gate Tiers:**

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| View real-time map | ✅ | ✅ | ✅ | ✅ |
| See contact badges | ✅ | ✅ | ✅ | ✅ |
| View 10 contacts | ✅ | ❌ | ❌ | ❌ |
| View all contacts | ❌ | ✅ | ✅ | ✅ |
| Tap contact details | ❌ | ✅ | ✅ | ✅ |
| Gmail deep links | ❌ | ❌ | ✅ | ✅ |
| Clear pin badges | ❌ | ❌ | ✅ | ✅ |
| Team members | ❌ | ❌ | 5 seats | Unlimited |

**UI Patterns:**

**1. Locked Feature Button:**
```tsx
<LockedFeature featureKey="gmail_integration">
  <Button variant="accent" onClick={handleOpenGmail}>
    <ExternalLink className="w-4 h-4 mr-2" />
    Open in Gmail
  </Button>
</LockedFeature>

// When locked, shows:
// - Disabled button with lock icon
// - "Upgrade to Pro" badge
// - Click opens upgrade modal
```

**2. Blurred Contact List:**
```tsx
// Free users see first 10 contacts clearly, rest blurred
<ContactList>
  {contacts.slice(0, 10).map(contact => (
    <ContactCard key={contact.id} {...contact} />
  ))}

  {!isPro && contacts.length > 10 && (
    <BlurredContactList count={contacts.length - 10}>
      <UpgradePrompt
        headline="Unlock all contacts"
        description={`You have ${contacts.length - 10} more contacts`}
        action={<Button variant="accent">Upgrade to Starter</Button>}
      />
    </BlurredContactList>
  )}
</ContactList>
```

**3. Badge Persistence (FOMO):**
```tsx
// Free users: Badges accumulate forever (can't clear)
// Pro users: Badges clear when email sent

{!isPro && contactsPending > 0 && (
  <Alert variant="warning" className="mt-4">
    <Lock className="w-4 h-4" />
    <AlertTitle>Badges won't clear</AlertTitle>
    <AlertDescription>
      Upgrade to Pro to clear badges by emailing contacts.
      <Button variant="link" onClick={handleUpgrade}>Learn More</Button>
    </AlertDescription>
  </Alert>
)}
```

**4. Plan Usage Widget:**
```tsx
// Show tier limits contextually
<PlanUsageWidget>
  <div className="flex items-center justify-between">
    <span className="text-sm">Contacts</span>
    <span className="text-sm font-medium">
      {currentPlan === 'free' ? `${contactCount}/10` : `${contactCount} (unlimited)`}
    </span>
  </div>
  <Progress value={(contactCount / 10) * 100} className="h-2" />

  {contactCount > 8 && currentPlan === 'free' && (
    <p className="text-xs text-muted-foreground mt-2">
      You're almost at your limit. <Button variant="link">Upgrade</Button>
    </p>
  )}
</PlanUsageWidget>
```

**Upgrade Prompt Timing:**
- When user clicks locked feature (immediate)
- When user approaches limit (8/10 contacts)
- When user hits limit (can't see contact 11)
- When badges accumulate (visual FOMO)

---

## 📐 Responsive Breakpoints

**Mobile-first approach: Design for 375px, scale up.**

```css
/* Tailwind breakpoints */
sm: 640px   /* Small tablets (portrait) */
md: 768px   /* Tablets (landscape), small laptops */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

**Design Priorities by Breakpoint:**

| Breakpoint | Layout | Navigation | Actions |
|------------|--------|------------|---------|
| < 640px (Mobile) | Single column, stacked cards | Bottom nav + FAB | FAB primary, bottom nav secondary |
| 640-1024px (Tablet) | 2-column grid where appropriate | Top nav + bottom nav | FAB optional, buttons in cards |
| > 1024px (Desktop) | Multi-column, sidebar navigation | Top nav + sidebar | Buttons in toolbars, no FAB |

**Anti-Pattern:**
```tsx
// ❌ Bad: Desktop-first with mobile as afterthought
<div className="grid grid-cols-3 gap-4 md:grid-cols-1">
  {/* Assumes desktop, squeezes on mobile */}
</div>

// ✅ Good: Mobile-first, enhances on desktop
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Works on mobile, gets better on larger screens */}
</div>
```

---

## ♿ Accessibility Requirements

**Every component must meet WCAG 2.1 AA standards.**

### Color Contrast

**Minimum contrast ratios:**
- Normal text (< 18px): 4.5:1
- Large text (≥ 18px): 3:1
- UI components: 3:1

**Test your colors:**
```bash
# Use Lighthouse in Chrome DevTools
# Or manual testing with contrast checker tools
```

### Keyboard Navigation

**All interactive elements must be keyboard accessible:**
- `Tab` to navigate between elements
- `Enter` or `Space` to activate
- `Esc` to close modals/menus
- Arrow keys for lists/menus

```tsx
// ✅ Good: Keyboard accessible
<Button onClick={handleClick} onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') handleClick();
}}>
  Click Me
</Button>

// ✅ Even better: Use native elements
<button onClick={handleClick}>Click Me</button>
```

### Screen Reader Support

**Use semantic HTML and ARIA labels:**

```tsx
// ✅ Good: Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Dashboard</a></li>
    <li><a href="/campaigns">Campaigns</a></li>
  </ul>
</nav>

// ❌ Bad: Div soup
<div className="nav">
  <div onClick={handleNav}>Dashboard</div>
  <div onClick={handleNav}>Campaigns</div>
</div>
```

**Icon-only buttons need labels:**
```tsx
// ✅ Good: Screen reader accessible
<Button variant="ghost" aria-label="Close modal" onClick={handleClose}>
  <X className="w-4 h-4" />
</Button>

// ❌ Bad: No label for screen readers
<Button onClick={handleClose}>
  <X className="w-4 h-4" />
</Button>
```

### Focus Indicators

**Visible focus states for keyboard users:**

```css
/* ✅ Good: Clear focus ring */
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ❌ Bad: No focus indicator */
button:focus {
  outline: none;
}
```

---

## 🌓 Dark Mode

**Dark mode is a first-class experience, not an afterthought.**

**Background Colors:**
- Light mode: White (#FFFFFF)
- Dark mode: Slate 950 (#020617)

**Text Colors:**
- Light mode: Slate 900 (#0F172A)
- Dark mode: Slate 50 (#F8FAFC)

**Color Adjustments:**
- Accent orange: Same in both modes (high contrast)
- Live blue: Same in both modes
- Borders: Slate 200 (light) / Slate 800 (dark)

**Implementation:**
```tsx
// Use Tailwind dark: prefix
<div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
  <Card className="border-slate-200 dark:border-slate-800">
    {/* Content */}
  </Card>
</div>
```

**Testing:**
- Toggle dark mode via system preference
- Check all screens in both modes
- Verify contrast ratios still meet WCAG

---

## 📊 Performance Standards

### Core Web Vitals Targets

| Metric | Target | Max Acceptable |
|--------|--------|----------------|
| LCP (Largest Contentful Paint) | < 1.5s | < 2.5s |
| FID (First Input Delay) | < 50ms | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.05 | < 0.1 |

### Bundle Size

**JavaScript bundles:**
- Initial bundle: < 150KB (gzipped)
- Route chunks: < 50KB each (gzipped)
- Total JS: < 500KB (gzipped)

**Images:**
- Use WebP format
- Lazy load below-the-fold images
- Max size: 200KB per image

**Fonts:**
- System fonts only (no web font download)

---

## ✅ Component Checklist

**Before marking a component "complete", verify:**

- [ ] Works on mobile (375px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1280px width)
- [ ] Touch targets ≥ 44px
- [ ] Keyboard accessible (Tab, Enter, Esc)
- [ ] Screen reader accessible (ARIA labels)
- [ ] Focus indicators visible
- [ ] Dark mode works correctly
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Empty state designed
- [ ] Loading state designed (if async)
- [ ] Error state designed (if can fail)
- [ ] Animations < 300ms (feel instant)
- [ ] Follows design system colors
- [ ] Follows typography scale
- [ ] Follows spacing system

---

## 🚫 Anti-Patterns to Avoid

### Visual Anti-Patterns

❌ **Gradients everywhere**
```tsx
<div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500">
```
→ Use solid colors from the palette

❌ **Drop shadows on everything**
```tsx
<Card className="shadow-2xl">
```
→ Use subtle borders, shadows only for elevation

❌ **Decorative icons**
```tsx
<h1>Welcome 🎉 to Attra 🚀</h1>
```
→ Icons should be functional, not decorative

❌ **Inconsistent spacing**
```tsx
<div className="mt-3 mb-5 ml-2 mr-7">
```
→ Use spacing system (4, 8, 16, 24, 32px)

---

### UX Anti-Patterns

❌ **Modal confirmation for reversible actions**
```tsx
const handleDelete = () => {
  if (confirm("Are you sure?")) {
    // delete
  }
};
```
→ Use optimistic delete with undo toast

❌ **Hiding navigation in hamburger menu**
```tsx
<HamburgerMenu items={navigation} />
```
→ Use bottom nav (mobile) or sidebar (desktop)

❌ **Generic empty states**
```tsx
{items.length === 0 && <p>No items</p>}
```
→ Design actionable empty states with next steps

❌ **Loading spinners for everything**
```tsx
{isLoading && <Spinner />}
{!isLoading && <Content />}
```
→ Use skeleton screens, optimistic UI

---

### Code Anti-Patterns

❌ **Inline styles**
```tsx
<div style={{ marginTop: '20px', color: '#1E293B' }}>
```
→ Use Tailwind classes

❌ **Magic numbers**
```tsx
<Button className="h-[47px] w-[213px]">
```
→ Use design system sizes

❌ **Inaccessible click handlers**
```tsx
<div onClick={handleClick}>Click me</div>
```
→ Use `<button>` or add keyboard handlers

---

## 📖 References

**When building, ask yourself:**
1. Is this mobile-first? (Can I use it with my thumb?)
2. Is the data hierarchy clear? (Do I see the important info in 3 seconds?)
3. Does it teach contextually? (Will a first-time user understand?)
4. Does it feel instant? (No unnecessary spinners?)
5. Am I in control? (Can I undo? Do I know what's happening?)

**If the answer to any of these is "no", revisit the design.**

---

**Questions or edge cases not covered?**
Refer back to the 5 design principles:
1. Thumb-First
2. Glanceable Data
3. Teach By Doing
4. Fast Over Perfect
5. In Control, Always

**When in doubt, optimize for the mobile user checking Attra between appointments.**

---

**End of Styleguide v1.0**
