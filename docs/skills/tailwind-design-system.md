---
name: tailwind-design-system
description: Tailwind CSS design system patterns and best practices for building professional UIs
source: wshobson/agents@tailwind-design-system (23.2K installs)
---

# Tailwind Design System Skill

Comprehensive Tailwind CSS patterns for building professional, responsive UIs.

## When to Use

- Building new UI components
- Styling with Tailwind CSS
- Creating consistent design systems
- Responsive design implementation

## Core Principles

### 1. Spacing System
Use Tailwind's built-in spacing scale:
- `p-4` / `m-4` = 1rem (16px)
- `gap-4` = 1rem between children
- `space-y-4` = 1rem vertical spacing

### 2. Color System
Use semantic color tokens:
```html
<div class="bg-primary text-on-primary">Primary</div>
<div class="bg-secondary text-on-secondary">Secondary</div>
<div class="bg-surface text-on-surface">Surface</div>
<div class="bg-error text-on-error">Error</div>
```

### 3. Typography Scale
```html
<h1 class="text-4xl font-bold">Heading 1</h1>
<h2 class="text-2xl font-semibold">Heading 2</h2>
<p class="text-base">Body text</p>
<p class="text-sm text-gray-500">Caption</p>
```

### 4. Component Patterns

#### Card Component
```html
<div class="bg-white rounded-lg shadow-md p-6 border border-gray-100">
  <!-- Card content -->
</div>
```

#### Button Variants
```html
<!-- Primary -->
<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Primary
</button>

<!-- Secondary -->
<button class="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200">
  Secondary
</button>

<!-- Ghost -->
<button class="text-blue-600 px-4 py-2 hover:bg-blue-50">
  Ghost
</button>
```

#### Form Inputs
```html
<input 
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  placeholder="Enter value"
/>
```

### 5. Responsive Design

```html
<!-- Mobile first -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- Content -->
</div>

<!-- Breakpoints: sm:640px md:768px lg:1024px xl:1280px -->
```

### 6. Dark Mode

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <!-- Content adapts to dark mode -->
</div>
```

## Common Patterns

### Flexbox Layouts
```html
<!-- Center content -->
<div class="flex items-center justify-center min-h-screen">
  
</div>

<!-- Between items -->
<div class="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- Stacked -->
<div class="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Grid Layouts
```html
<!-- 2 column grid -->
<div class="grid grid-cols-2 gap-4">
  
</div>

<!-- Auto-fit columns -->
<div class="grid grid-cols-auto-fit gap-4">
  
</div>
```

## Best Practices

1. **Use utility classes** — Don't fight Tailwind, embrace it
2. **Extract components** — Pull repeated patterns into React components
3. **Use semantic colors** — Primary, secondary, error over raw colors
4. **Mobile-first** — Start with mobile styles, add `md:` for larger
5. **Consistent spacing** — Use the 4px scale (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16)
6. **Avoid arbitrary values** — Stick to Tailwind's built-in scale

## Anti-Patterns

❌ Don't use arbitrary values like `top-[23px]`
❌ Don't use complex nested grids
❌ Don't mix Tailwind with inline styles
❌ Don't use `!important`

## For LinkPay BD

Use these Tailwind patterns:
- Clean, professional fintech look
- Trust-inducing blues and greens
- Mobile-first responsive design
- Accessible contrast ratios
