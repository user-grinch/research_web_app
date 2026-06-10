# Design Spec: Empathetic Play (Soft Dark Edition)

**Date:** 2026-06-11
**Topic:** UI/UX Overhaul for ResearchPortal
**Status:** Draft

## Overview
Transform the ResearchPortal from a "clinical telemetry tool" into a "human-centric research experience." The goal is to build trust and comfort through a calm, reassuring voice and soft, engaging visuals, leading to more natural user behavior and higher data quality.

## Visual Identity

### Color Palette (Soft Dark)
- **Primary Background:** `slate-950` (`#020617`)
- **Surface/Card Background:** `slate-900/60` with `backdrop-blur-xl`
- **Accent - Primary (Comfort):** `sky-400` (`#38bdf8`)
- **Accent - Secondary (Progress):** `mint-400` (`#4ade80`)
- **Accent - Tertiary (Attention):** `peach-400` (`#fb923c`)
- **Text - Primary:** `slate-100`
- **Text - Secondary:** `slate-400`

### Typography & Shapes
- **Font:** Clean sans-serif (Inter/System), generous letter spacing for legibility.
- **Corners:** Large border-radii (`rounded-3xl` or `2rem`) for all cards and buttons.
- **Shadows:** Soft, diffused shadows instead of hard borders.

## Onboarding: The Reassuring Guide

### Voice & Tone
- **Calm & Reassuring:** "Welcome. Let's explore how you interact with your device. It only takes a few minutes."
- **Transparency:** Explain *why* data is collected in simple, human terms.

### Flow Improvements
- **Intro:** A gentle fade-in with a "Welcome" message that sets the context.
- **Profile Inputs:** 
    - Use friendly icons/emojis (🎂 for age, ✍️ for handedness).
    - Large, easy-to-tap toggle buttons for selection.
- **Consent:** Reframe consent as a "Partnership" in research. Use a "Trust Card" that summarizes privacy in 3 simple points.

## Game Experience: Micro-Celebrations

### Interaction Juice
- **Feedback:** 
    - Hits: A soft "sparkle" or "bloom" effect (Framer Motion).
    - Misses: A subtle "shake" or "ripple" instead of a harsh error state.
- **HUD:** 
    - Minimalist and translucent.
    - A "Comfort Meter" (progress bar) that uses a soft mint-to-sky gradient.
- **Transitions:** 
    - "Slide + Fade" transitions between stages using `AnimatePresence`.
    - No "Glitch" or high-speed effects; keep it fluid and organic.

## Technical Implementation

### Components to Update
1.  **`OnboardingForm.tsx`:** 
    - Full refactor to use the new color palette and voice.
    - Add staggered animations for form fields.
2.  **`GameLauncher.tsx`:**
    - Update the HUD to be more translucent and refined.
    - Soften the briefing screens.
3.  **`TapAccuracyGame.tsx` & others:**
    - Update target visuals (soft colors, glow instead of harsh circles).
    - Implement the "Sparkle" hit feedback.

### Global Styles (`globals.css`)
- Update the `.glass` utility for better translucency.
- Add "Soft Bounce" keyframes for micro-interactions.

## Success Criteria
- Users report feeling "comfortable" and "guided" through the process.
- Telemetry shows consistent completion rates for the onboarding flow.
- Visual consistency across all game stages and summaries.
