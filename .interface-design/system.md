# Agorapulse Design System

Source: `~/sources/design/libs/ui-theme/assets/desktop_variables.css`

---

## Colors

**Rule**: Never use raw hex values. Always use design-system tokens.

### Reference palette (`--ref-color-*`)

#### Grey scale
| Token | Value | Use |
|---|---|---|
| `--ref-color-grey-bg` | #F9F9FA | Panel backgrounds, sidebars |
| `--ref-color-grey-05` | #F5F5F7 | Section backgrounds, hover states |
| `--ref-color-grey-10` | #EAECEF | Dividers, borders |
| `--ref-color-grey-20` | #D6DAE0 | Stronger borders |
| `--ref-color-grey-40` | #AEB5C1 | Disabled text, placeholders |
| `--ref-color-grey-60` | #858FA1 | Secondary/light text |
| `--ref-color-grey-80` | #5D6A82 | Medium text |
| `--ref-color-grey-100` | #344563 | Dark text |
| `--ref-color-grey-150` | #212E44 | Darkest (headings) |

#### Brand colors
- Orange: `--ref-color-orange-{10,20,40,60,80,100,150}`
- Electric Blue: `--ref-color-electric-blue-{05,10,20,40,60,80,100,150}`
- Soft Blue: `--ref-color-soft-blue-{10,20,40,60,80,100,150}`
- Green: `--ref-color-green-{10,20,40,60,80,100,150}`
- Red: `--ref-color-red-{10,20,40,60,80,100,150}`
- Yellow: `--ref-color-yellow-{10,20,40,60,80,100,150}`
- Purple: `--ref-color-purple-{05,10,20,40,60,80,100,150}`

### System semantic tokens (`--sys-*`)
- Text: `--sys-text-color-default`, `--sys-text-color-light`, `--sys-text-color-error`
- Border: `--sys-border-color-default`
- Background: `--sys-background-color-*`
- Main (orange): `--sys-color-main-{default,hover,clicked,disabled,light}`
- Accent (blue): `--sys-color-accent-{default,hover,clicked,disabled,light}`
- Error: `--sys-color-error-{default,hover,clicked,light}`
- Warning: `--sys-color-warning-{default,hover,light}`
- Success: `--sys-color-success-{default,hover,light}`

### Component tokens (`--comp-*`)
Use for specific component overrides only (e.g. `--comp-link-default-color`).

---

## Spacing

**Grid**: 4px base. All spacing must be a multiple of 4.

| Token | Value |
|---|---|
| `--ref-spacing-xxxs` | 4px |
| `--ref-spacing-xxs` | 8px |
| `--ref-spacing-xs` | 12px |
| `--ref-spacing-sm` | 16px |
| `--ref-spacing-md` | 24px |
| `--ref-spacing-lg` | 32px |
| `--ref-spacing-xl` | 40px |
| `--ref-spacing-xxl` | 48px |
| `--ref-spacing-xxxl` | 60px |

**Violations**: Any spacing value not divisible by 4 (e.g. 5px, 7px, 13px, 17px).

---

## Typography

**Font**: `'Averta'` — always use this family, never system fonts for UI text.

### Font sizes
| Token | Value |
|---|---|
| `--ref-font-size-xs` | 12px |
| `--ref-font-size-sm` | 14px |
| `--ref-font-size-md` | 16px |
| `--ref-font-size-lg` | 18px |
| `--ref-font-size-xl` | 20px |
| `--ref-font-size-xxl` | 24px |
| `--ref-font-size-xxxl` | 28px |

### Font weights
| Token | Value |
|---|---|
| `--ref-font-weight-regular` | 400 |
| `--ref-font-weight-bold` | 700 |
| `--ref-font-weight-extra-bold` | 800 |
| `--ref-font-weight-black` | 900 |

### Pre-composed text styles (`--sys-text-style-*`)
| Style | Size | Weight | Line-height |
|---|---|---|---|
| h1 | 24px | 700 | 32px |
| h2 | 18px | 700 | 24px |
| h3 | 16px | 700 | 24px |
| h4 | 14px | 700 | 20px |
| body | 14px | 400 | 18px |
| body-bold | 14px | 700 | 18px |
| caption | 12px | 400 | 16px |
| caption-bold | 12px | 700 | 16px |

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `--ref-border-radius-sm` | 4px | Small elements (badges, chips) |
| `--ref-border-radius-md` | 8px | Cards, inputs, modals |

Common non-token values used in this project: `6px` (buttons, small inputs), `20px` (pill chips).

---

## Depth (Elevation)

**System**: Borders-only. No `box-shadow` except ring shadows.

- Allowed: `border: 1px solid var(--sys-border-color-default)` for separation
- Allowed: `box-shadow: 0 0 0 Npx <color>` for focus rings only
- Allowed: `box-shadow: 0 4px 16px rgba(0,0,0,0.12)` for floating overlays (dropdowns, tooltips)
- **Violation**: Multi-layer shadows, `filter: drop-shadow(...)`, elevation shadows on cards/panels

---

## Animation

| Token | Value | Use |
|---|---|---|
| `--ref-animation-xshort` | 75ms | Micro interactions |
| `--ref-animation-short` | 150ms | Default hover transitions |
| `--ref-animation-normal` | 250ms | Panel opens, state changes |
| `--ref-animation-long` | 400ms | Page-level transitions |

**Violations to flag**: hardcoded `transition: 0.3s`, missing `transition` on interactive elements.

---

## Panel Color Hierarchy

This project uses a deliberate depth system for the Create Post modal:

| Panel | Token | Hex | Role |
|---|---|---|---|
| Compose panel | `--ref-color-white` | #FFFFFF | Primary creation surface |
| Compose tabs bar | `--ref-color-grey-bg` | #F9F9FA | Tab chrome, slightly recessed |
| Profiles panel | `--ref-color-grey-bg` | #F9F9FA | Navigation sidebar |
| Preview panel | `--ref-color-grey-bg` | #F9F9FA | Output/display surface |
| Modal header/footer | `--ref-color-white` | #FFFFFF | Chrome stays crisp |

**Draft state**: Compose tabs background → `#FFFBF0` (amber tint), border → `#FDE68A`.

---

## Intentional Exceptions

- **Writing Assistant button** (`compose-panel.ts`): Uses `linear-gradient(135deg, #6c63ff, #f7619a)` for its gradient border and `color: #6c63ff`. These are brand colors for the AI feature with no matching design tokens — intentional and approved.

---

## Violations to Flag

1. Raw hex color not in the palette above
2. Spacing not on the 4px grid
3. Font family other than `'Averta'`
4. `box-shadow` used for elevation (not rings or floating overlays)
5. Missing `transition` on hover-interactive elements
6. `font-size` or `font-weight` not matching any token value
