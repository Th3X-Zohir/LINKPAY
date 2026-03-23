# UI/UX Pro Max - Quick Reference

> Summary of key UI/UX guidelines for LinkPay BD

## Priority Rules

| Priority | Category | Key Checks |
|----------|----------|------------|
| 1 | **Accessibility** | Contrast 4.5:1, Alt text, Keyboard nav, aria-labels |
| 2 | **Touch & Interaction** | Min 44×44px targets, 8px+ spacing, Loading feedback |
| 3 | **Performance** | WebP/AVIF images, Lazy loading, Reserve space (CLS < 0.1) |
| 4 | **Style Selection** | Match product type, Consistency, SVG icons (no emoji) |
| 5 | **Layout & Responsive** | Mobile-first breakpoints, No horizontal scroll |
| 6 | **Typography & Color** | Base 16px, Line-height 1.5, Semantic color tokens |
| 7 | **Animation** | Duration 150–300ms, Motion conveys meaning |
| 8 | **Forms & Feedback** | Visible labels, Error near field, Helper text |
| 9 | **Navigation Patterns** | Predictable back, Bottom nav ≤5 items |
| 10 | **Charts & Data** | Legends, Tooltips, Accessible colors |

## Critical Rules

### Accessibility
- Minimum 4.5:1 color contrast ratio
- All images need alt text
- Visible focus rings on interactive elements
- aria-label for icon-only buttons
- Keyboard navigation support

### Touch Targets
- Minimum 44×44px touch target
- 8px+ spacing between targets
- Don't rely on hover alone
- Loading states during async operations

### Mobile-First
- Design 375px first, scale up
- No horizontal scroll
- 16px minimum body font
- Responsive breakpoints: 375 / 768 / 1024 / 1440

### Forms
- Visible labels (not placeholder-only)
- Error messages near the field
- Loading feedback on submit
- Progressive disclosure for complex forms

## Design Style for LinkPay BD

**Recommended:** Minimal, professional, fintech-appropriate

- Clean lines and ample whitespace
- Trust-inducing colors (blues, greens)
- Clear visual hierarchy
- Prominent but not aggressive CTAs
- Consistent shadow/elevation scale

## Anti-Patterns

- ❌ Emoji as icons
- ❌ Gray-on-gray text
- ❌ Placeholder-only form labels
- ❌ Instant state changes (no animation)
- ❌ Horizontal scroll on mobile
- ❌ Text < 12px body
- ❌ Color-only conveying information
