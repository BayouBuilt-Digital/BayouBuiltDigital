# BayouBuilt Digital — Brand Style Guide

> Brand Template & Style Guide · D & G Fuzion LLC
> Source of truth: `brand-template.html`. This document mirrors it in Markdown for
> docs, READMEs, and AI/design tooling.

**Tagline / positioning:** Custom websites for local businesses in South Louisiana —
built to be found, built to convert, and built to last. No templates. No page
builders. Just clean code, sharp design, and a site your customers will trust.

---

## 01 · Logo

The BayouBuilt Digital logo is a **typographic wordmark set in Space Mono Bold**.
"Digital" is always rendered in the primary **teal**. No icon, no symbol — the
wordmark *is* the brand.

| Use | Treatment |
| --- | --- |
| Primary — on dark | Cream "BayouBuilt", teal "Digital" |
| Primary — on light | Black "BayouBuilt", teal "Digital" |
| Nav size | 0.72rem |
| Footer size | 0.55rem |

---

## 02 · Color Palette

### Primary
| Name | Variable | Value |
| --- | --- | --- |
| Teal | `--teal` | `#00d68f` |
| Gold | `--gold` | `#c9952a` |
| Cream | `--cream` | `#f0ede6` |

### Backgrounds & Surfaces
| Name | Variable | Value |
| --- | --- | --- |
| Black (Base) | `--black` | `#050c08` |
| Surface | `--surface` | `#0d1f14` |
| Surface 2 | `--surface-2` | `#132a1a` |
| Surface 3 | `--surface-3` | `#17301e` |

### Teal Variants
| Name | Variable | Value |
| --- | --- | --- |
| Teal Mid | `--teal-mid` | `rgba(0, 214, 143, 0.35)` |
| Teal Border | `--teal-border` | `rgba(0, 214, 143, 0.22)` |
| Teal Faint | `--teal-faint` | `rgba(0, 214, 143, 0.07)` |

### Text
| Name | Variable | Value |
| --- | --- | --- |
| Primary Text | `--cream` | `#f0ede6` |
| Muted Text | `--muted` | `rgba(240, 237, 230, 0.72)` |
| Dim Text | `--muted-dim` | `rgba(240, 237, 230, 0.55)` |

### Gradients
| Use | Definition |
| --- | --- |
| Teal → Gold | `linear-gradient(135deg, var(--teal), var(--gold))` |
| Teal → Bright → Gold | `linear-gradient(90deg, #00d68f 0%, #00ffb3 50%, #c9952a 100%)` |
| Accent Bar (top-of-card) | `linear-gradient(90deg, var(--teal), var(--gold))` |
| Hero Background | `linear-gradient(170deg, #071009 0%, #050c08 45%, #091209 100%)` |

```css
:root {
  --black:       #050c08;
  --surface:     #0d1f14;
  --surface-2:   #132a1a;
  --surface-3:   #17301e;
  --teal:        #00d68f;
  --teal-mid:    rgba(0, 214, 143, 0.35);
  --teal-faint:  rgba(0, 214, 143, 0.07);
  --teal-border: rgba(0, 214, 143, 0.22);
  --gold:        #c9952a;
  --cream:       #f0ede6;
  --muted:       rgba(240, 237, 230, 0.72);
  --muted-dim:   rgba(240, 237, 230, 0.55);
}
```

---

## 03 · Typography

Loaded from Google Fonts:
`Barlow Condensed` (700/800/900 + italic), `Inter` (300–600), `Space Mono` (400/700).

| Family | Use | Weights | Notes |
| --- | --- | --- | --- |
| **Barlow Condensed** | Display headings, hero text, numbers | 700, 800, 900 + italic | Uppercase display |
| **Inter** | Body text, buttons, descriptions | 300, 400, 500, 600 | Line height 1.7–1.9 |
| **Space Mono** | Section labels, nav, tags, metadata | 400, 700 | Always uppercase, tracked |

### Type Scale
| Role | Spec |
| --- | --- |
| Hero | `clamp(2.5rem, 7vw, 6rem)` · Barlow 900 · uppercase |
| Section Title | `clamp(1.6rem, 3vw, 2.4rem)` · Barlow 800 |
| Card Heading | `1.15rem` · Barlow 800 |
| Body | `0.95rem` · Inter 400 · line-height 1.9 |
| Card body / bios | `0.82rem` · Inter 400 · line-height 1.85 |
| Section Label | `0.62rem` · Space Mono 700 · tracking 0.18em |
| Nav Links | `0.6rem` · Space Mono 400 · tracking 0.12em |

---

## 04 · Buttons

| Button | Spec |
| --- | --- |
| **Primary** | Inter 600 · 0.7rem · tracking 0.2em · uppercase · bg `--teal` · text `--black` · border 2px solid `--teal` · padding `0.9rem 2.2rem` |
| **Ghost** | Same spec, transparent bg · text `--cream` · border `rgba(240,237,230,0.25)` · hover → border & text `--teal` |

Hover lifts the button 2px (`translateY`). Primary inverts to transparent bg with
teal text; ghost switches border and text to teal.

---

## 05 · Cards

Cards use a **1.5px gap grid** with teal-border background bleed-through. On hover, a
teal-to-gold gradient bar appears at the top and the background lightens one surface
level. Numbered `01 / 02 / 03`, e.g. *Custom Design*, *Mobile-First*, *SEO-Ready*.

---

## 06 · Spacing

| Token | Use |
| --- | --- |
| `0.75rem` | Tight gaps |
| `1.25rem` | Element margins |
| `2.5rem` | Card padding |
| `3.5rem` | Section gaps |
| `5rem` | Section padding (mobile) |
| `7rem` | Section padding (desktop) |

---

## 07 · Theme Rules / Design Principles

- **Dark-First** — base is always `--black` (`#050c08`). Surfaces layer up with
  progressively lighter green-blacks for depth; there is no light mode.
- **Teal = Action** — interactive elements, labels, borders, hover states. Signals
  "something you can do" or "something important."
- **Gold = Emphasis** — secondary accent, used sparingly in gradients, badges,
  callout borders, and stat numbers. **Never** for buttons or links.
- **Gradient Text** — italicized words in section titles use a teal-to-gold gradient
  fill via `background-clip`. The signature accent treatment.
- **No Border Radius** — sharp corners everywhere. Only exception: circular avatars
  (`border-radius: 50%`).
- **1.5px Grid Gaps** — card grids use 1.5px gaps over a colored background, creating
  thin visible separators instead of traditional spacing.

---

## Voice & Tone

Direct, confident, and local. Short declarative lines ("No templates. No page
builders."). Speaks to South Louisiana small businesses. Emphasizes craft (clean
code, custom design) and outcomes (found, convert, trust) over jargon.
