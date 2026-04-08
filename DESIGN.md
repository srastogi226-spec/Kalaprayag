# Kala Prayag - Design System & Brand Guidelines

This document serves as the single source of truth for the digital aesthetics, typography, color palette, and layout principles of **Kala Prayag**. Our design language is rooted in "contemporary luxury meets artisanal heritage."

## 1. Color Palette

Our aesthetic uses a warm, minimalist approach allows the rich textures of the handcrafted objects to stand out.

| Color | Hex Code | CSS Variable | Tailwind Usage | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `#1A1A1A` | `--primary-color` | `var(--primary-color)` | Deep, rich black used for high-contrast elements, bold statements, and deep accents. |
| **Secondary** | `#8B735B` | `--secondary-color`| `var(--secondary-color)`| Muted earth tone (warm taupe/brown) that reflects natural clay, wood, and heritage crafts. |
| **Background**| `#FAF9F6` | `--bg-color` | `bg-[#FAF9F6]` | A warm, breathable off-white. The canvas for all our interfaces. Avoid stark `#FFFFFF`. |
| **Text Base** | `#2C2C2C` | `--text-color` | `text-[#2C2C2C]` | Charcoal gray for main body text. Reduces eye strain while maintaining a crisp, elegant look. |
| **Accent** | `#D1D1D1` | `--accent-color` | `var(--accent-color)`| Soft, premium silver/gray used for subtle borders, dividers, and inactive states. |

## 2. Typography

We combine a timeless serif with a modern sans-serif to bridge the gap between historic craftsmanship and modern e-commerce.

### Google Fonts
* **Playfair Display**: `ital,wght@0,400;0,700;1,400`
* **Inter**: `wght@300;400;500;600`

### Families & Usage
* **Headings (Serif)**: `Playfair Display`
  * Applied automatically to `h1`, `h2`, `h3`, `h4`.
  * Also applied via the `.serif` class.
  * Used for editorial titles, product names, and main banners.
* **Body (Sans-Serif)**: `Inter`
  * Applied to the `body` by default.
  * Used for descriptions, UI text, buttons, and functional navigation.

### Letter Spacing (Tracking)
Premium design relies heavily on intentional whitespace and letter spacing. We use custom tracking utilities for text refinement:
* Tight (`-0.01em`): Standard for large bold headers.
* Normal (`0.02em`): Default body text spacing.
* Premium (`0.1em`): `.tracking-premium` - Use for subheadings and elegant short titles.
* Editorial (`0.2em`): `.tracking-editorial` - Use for category labels, small caps, and navigation.
* Signature (`0.3em`): `.tracking-signature` - Use sparingly for ultimate spacing, luxury branding text.

### Typography Utilities
* `.serif-italic`: `Playfair Display`, `italic`, `400` weight. Perfect for delicate, artisanal feeling text.

## 3. Motion & Interaction

Luxury environments feel responsive, fluid, and unhurried. 

### Defaults
* **Base Transition**: `300ms ease-in-out` applied to `a, button, input, select, textarea`, and elements with the `.interactive` class.

### Key Animations
* **Fade In** (`.fade-in`): Smooth opacity entries.
* **Slide Up** (`.slide-up`): Subtle upward reveals for elements pushing into the viewport.
* **Scroll Reveal** (`.scroll-reveal` & `.visible`): Staggered, elegant page reveals on scroll (`0.8s ease-out` opacity + transform).
* **Price Stack Interaction**: Price to "Add to Cart" slides efficiently on hover. Use `.price-container`, `.price-stack`, and `.price-item` within a `.group`.

## 4. UI Components & Layout Rules

### Layout Architecture
* **Breathing Room**: Generous padding and margins are mandatory. Avoid crowded components.
* **Editorial Grid** (`.editorial-grid`): A 12-column grid with `2rem` gaps used for journal articles and sophisticated image layouts.

### Glassmorphism
* `.glass`: Used for floating navigation, sticky headers, or modern overlays over imagery without losing context.
  * *Specs*: `rgba(255, 255, 255, 0.7)` background, `10px` blur, and a subtle `0.2` white border.

### Visual Styling
* **Borders**: Favor `var(--accent-color)` or extremely light white borders on glass components.
* **Scrollbars**: `.admin-sidebar-scroll` refines default scrollbars to a minimal, sophisticated `3px` width with subtle hover states.
* **Image Treatments**: Always ensure imagery represents the artisanal nature with moody, well-lit, authentic photography.

## 5. Development Principles

1. **Use Variables**: Always refer to the CSS variables in `index.css` rather than hardcoding hex codes. This ensures a consistent global theme.
2. **Tailwind Flow**: Utilize Tailwind utility classes for quick positioning and layout, while falling back to `index.css` custom classes (e.g., `.tracking-premium`) for strictly branded aesthetic elements.
3. **Intentional Overlays**: When dealing with overlays on imagery, prefer the `.glass` class over solid dark/light backgrounds where possible to elevate the luxury feel.
