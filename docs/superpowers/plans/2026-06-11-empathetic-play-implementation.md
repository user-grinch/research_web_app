# Empathetic Play UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the ResearchPortal into a "human-centric" experience with soft visuals, reassuring voice, and engaging micro-interactions.

**Architecture:** Systematic update of Tailwind variables, component refactoring for better UX, and addition of Framer Motion animations for "interaction juice."

**Tech Stack:** Next.js, Tailwind CSS (v4), Framer Motion, Lucide React.

---

### Task 1: Global Aesthetic & Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update Tailwind theme and global variables**

Update the theme to include the new "Soft Dark" palette.

```css
@import "tailwindcss";

@theme inline {
  --color-brand-primary: #38bdf8; /* sky-400 */
  --color-brand-secondary: #4ade80; /* mint-400 */
  --color-brand-accent: #fb923c; /* peach-400 */
  --color-brand-background: #020617; /* slate-950 */
  --color-brand-surface: rgba(15, 23, 42, 0.6); /* slate-900/60 */
}

:root {
  --background: #020617;
  --foreground: #f8fafc;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Refined Glass utility */
@layer utilities {
  .glass {
    background: var(--color-brand-surface);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .text-reassuring {
    @apply text-slate-400 leading-relaxed tracking-wide;
  }
}

/* Micro-interaction: Soft Bounce */
@keyframes soft-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.animate-soft-bounce {
  animation: soft-bounce 0.6s ease-in-out;
}
```

- [ ] **Step 2: Commit global styles**

```bash
git add src/app/globals.css
git commit -m "style: update global theme to Soft Dark palette"
```

---

### Task 2: Reassuring Onboarding Flow

**Files:**
- Modify: `src/components/OnboardingForm.tsx`

- [ ] **Step 1: Refactor UI and Voice**

Update the component to use the "Calm & Reassuring" voice and the new visual style.

```tsx
// Partial update for brevity in plan, but full replacement in implementation
// Change the "Next Phase" button and the headings
// Use Lucide icons: Heart, ShieldCheck, Sparkles for trust
```

- [ ] **Step 2: Add Staggered Animations**

Use `framer-motion` to animate form fields appearing one by one.

- [ ] **Step 3: Implement the "Trust Card"**

Add a summary section in the consent step that highlights privacy in simple terms.

- [ ] **Step 4: Commit Onboarding changes**

```bash
git add src/components/OnboardingForm.tsx
git commit -m "feat: refactor onboarding with reassuring voice and soft visuals"
```

---

### Task 3: Refined Game HUD & Transitions

**Files:**
- Modify: `src/components/GameLauncher.tsx`

- [ ] **Step 1: Update HUD Design**

Make the top HUD more translucent and minimal. Use `sky-400` for progress.

- [ ] **Step 2: Soften Briefing Screens**

Update the briefing modal to be a large, soft card with clear, friendly instructions.

- [ ] **Step 3: Update Transitions**

Ensure `AnimatePresence` uses "Slide + Fade" instead of harsh cuts.

- [ ] **Step 4: Commit HUD updates**

```bash
git add src/components/GameLauncher.tsx
git commit -m "feat: refine game HUD and transitions for better flow"
```

---

### Task 4: Game Visuals & "Interaction Juice" (Tap Accuracy Template)

**Files:**
- Modify: `src/components/TapAccuracyGame.tsx`

- [ ] **Step 1: Update Target Visuals**

Change target colors to `sky-400` or `mint-400` with soft glows.

- [ ] **Step 2: Implement "Sparkle" Hit Feedback**

Add a Framer Motion effect that triggers on hit.

```tsx
// Example sparkle effect
<motion.div
  initial={{ scale: 1, opacity: 1 }}
  animate={{ scale: 2, opacity: 0 }}
  className="absolute rounded-full border border-sky-400"
/>
```

- [ ] **Step 3: Soft Miss Feedback**

Implement a subtle ripple or shake for misses.

- [ ] **Step 4: Commit Game updates**

```bash
git add src/components/TapAccuracyGame.tsx
git commit -m "feat: add interaction juice and soft feedback to TapAccuracy game"
```
