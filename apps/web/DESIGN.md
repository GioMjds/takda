---
name: Takda
description: High-volume, low-friction queue and booking platform for walk-in businesses
colors:
  primary: '#1A8C75'
  bg-tint: '#E3F5F0'
  dark: '#0D4F43'
  surface: '#F7FAFA'
  accent-fill: '#A8DDD4'
typography:
  display:
    fontFamily: 'Raleway, sans-serif'
    fontSize: 'clamp(2rem, 5vw, 3.5rem)'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'Raleway, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: '4px'
  md: '8px'
  lg: '10px'
spacing:
  sm: '8px'
  md: '16px'
  lg: '24px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#F7FAFA'
    rounded: '{rounded.md}'
    padding: '10px 20px'
  button-primary-hover:
    backgroundColor: '{colors.dark}'
---

# Design System: Takda

## 1. Overview

**Creative North Star: "The Clean Canopy"**

The visual language of Takda is inspired by "The Clean Canopy"—offering a sheltering, structured, and refreshing interface that protects operators and customers from the chaos of physical queues. Built to feel professional yet organic, it brings clarity and structure to walk-in operations in the informal service economy. The design defaults to clean, structured grids with generous breathing room, avoiding generic SaaS-cream surfaces and heavy, over-decorated glassmorphic card groups.

**Key Characteristics:**

- **Organic Professionalism**: Rooted in trustworthy teal and deep dark greens that communicate reliability.
- **Sunlight Legibility**: High-contrast, clean boundaries that remain sharp under direct outdoor sunlight on low-end mobile viewports.
- **Zero-Clutter Actionability**: Heavy layout-shifting animations are banned; instead, fast state transitions guide the user through booking steps.

## 2. Colors

The color palette uses cool, refreshing teals and light surfaces to evoke a sense of trust, efficiency, and calm.

### Primary

- **Canopy Green** (#1A8C75 / oklch(0.589 0.150 170.3)): The primary brand action color. Used for primary call-to-actions, confirmation icons, and active indicators.

### Neutral

- **Deep Forest Dark** (#0D4F43 / oklch(0.395 0.098 171.7)): The main ink/text color. Used for high-contrast headlines and secondary actions.
- **Clean Mint Tint** (#E3F5F0 / oklch(0.959 0.031 171.6)): A light background tint used to denote secondary selections, badges, and highlighted containers.
- **Fresh Surface** (#F7FAFA / oklch(0.984 0.005 182.8)): The canonical background and card container color.
- **Accent Mint** (#A8DDD4 / oklch(0.868 0.087 175.4)): The accent fill color for borders, active selection accents, and hover rings.

### Named Rules

**The Sunlight Contrast Rule.** Background and body text contrast must always exceed 4.5:1. Never use muted gray text on light backgrounds; use a transparent opacity of Deep Forest Dark (#0D4F43) or pure dark green to guarantee outdoor visibility.

## 3. Typography

**Display Font:** Raleway (sans-serif)
**Body Font:** Raleway (sans-serif)

Raleway carries the entire visual structure, providing clean geometric lines that ensure high-density screens remain easily readable under varying ambient light conditions.

### Hierarchy

- **Display** (Bold (700), clamp(2rem, 5vw, 3.5rem), 1.2): Reserved for storefront business titles and primary queue numbers.
- **Headline** (Semi-Bold (600), 1.75rem, 1.3): Used for page titles and key section headers.
- **Title** (Medium (500), 1.25rem, 1.4): Used for service list headings and card labels.
- **Body** (Regular (400), 1rem, 1.5): Used for slots, confirmation text, and instructions. Max line length is strictly capped at 65ch for prose.
- **Label** (Medium (500), 0.875rem, 1.2): Used for status chips, secondary labels, and help text.

### Named Rules

**The Heading Letter-Spacing Rule.** Heading sizes above 1.75rem must use a slightly tighter letter-spacing (e.g., `-0.02em` or `-0.015em`), but never exceed the `-0.04em` floor to prevent letters from touching or feeling cramped on mobile screens.

## 4. Elevation

Takda utilizes a flat, structural visual system. Depth is conveyed primarily through clean borders, subtle background tints, and card containment rather than soft wide shadows.

### Shadow Vocabulary

- **Interactive Glow** (`box-shadow: 0 4px 12px rgba(26, 140, 117, 0.08)`): Used strictly on hover or active focus state of primary buttons to signal response.

### Named Rules

**The Flat-By-Rest Rule.** All cards, inputs, and container elements remain completely flat at rest. No shadows are applied to elements unless responding directly to active user interaction (hover/active focus).

## 5. Components

### Buttons

- **Shape:** Medium rounding (8px) for buttons.
- **Primary:** Background Canopy Green (#1A8C75), Text Fresh Surface (#F7FAFA), with 10px vertical and 20px horizontal padding.
- **Hover / Focus:** Transitions to Deep Forest Dark (#0D4F43) with an outline ring of Accent Mint (#A8DDD4).

### Cards / Containers

- **Corner Style:** Large rounding (10px).
- **Background:** Pure White (#FFFFFF) or Fresh Surface (#F7FAFA).
- **Shadow Strategy:** Flat by rest; no shadows.
- **Border:** 1px solid Accent Mint (#A8DDD4) at 40% opacity.
- **Internal Padding:** 16px (1rem) on mobile, 24px (1.5rem) on tablet/desktop.

### Inputs / Fields

- **Style:** 1px border using Accent Mint (#A8DDD4), Background White, shape is Medium rounding (8px).
- **Focus:** 2px ring using Canopy Green (#1A8C75) with no background change.
- **Error / Disabled:** 1px border using Red/Destructive for errors; opacity reduced to 50% for disabled states.

### Navigation

- **Style:** Top/bottom navigation bars use Fresh Surface (#F7FAFA) background, thin 1px border at bottom/top, with active states marked via solid Canopy Green (#1A8C75) accent bars or colored icons.

## 6. Do's and Don'ts

### Do:

- **Do** check contrast on low-end screens under direct sunlight.
- **Do** keep touch targets at a minimum of 48px for all interactive items.
- **Do** use native dialogs and sheet drawers on mobile to avoid stacking context clipping.

### Don't:

- **Don't** use decorative shadows or ghost-card drop shadows (borders + soft wide shadows).
- **Don't** use saturated warm-neutral AI cream backgrounds (e.g., #Bone, #Parchment, #Flour) as card backgrounds.
- **Don't** use side-stripe borders (e.g., `border-left` thicker than 1px as a colored accent stripe on cards).
- **Don't** use sketchy SVG doodles or non-functional animations that delay user actions.
